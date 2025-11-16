# app/api/v1.py

import os
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File

from app.auth.routes import get_current_user
from app.auth.models import (
    UserPublic,
    GeneratedContent,
    GenerationRequest,
    LectureOutput,
)
from typing import List, Tuple, Optional

from app.content.generator import generate_content
from app.media.visuals import generate_visuals_for_content
from app.media.avatar_azure import (
    submit_synthesis_with_text,
    poll_job_and_get_result,
    download_file,
)
# 👇 still imported for backwards compatibility, but no longer used
from app.media.compiler import compose_fullscreen_with_avatar
from app.utils.storage import ensure_dirs
from app.utils.storage import save_file, get_file_url
import requests
from app.media.avatar_azure import _authenticate  # reuse Azure auth header

from app.content.rag_processor import build_context_from_files
from app.utils.validators import allowed_file_mime
from app.utils.storage import save_upload_file
from app.content.generator import generate_content_with_context

from app.database.connection import get_db
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase



logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/v1", tags=["Lecture Generation"])
ensure_dirs()  # create static dirs if missing

class LectureHistoryItem(BaseModel):
    id: str
    topic: str
    status: str
    created_at: datetime
    lecture: LectureOutput


async def _persist_lecture(
    db: AsyncIOMotorDatabase,
    current_user: UserPublic,
    lecture_output: LectureOutput,
    *,
    rag_used: bool,
    source_files: Optional[List[str]] = None,
) -> None:
    """Best-effort insert of a lecture document for history view."""
    if db is None:
        return

    try:
        user = await db.users.find_one({"username": current_user.username})
        if not user:
            return

        user_id = str(user.get("_id"))
        now = datetime.utcnow()

        record = {
            "user_id": user_id,
            "topic": lecture_output.topic,
            "introduction": lecture_output.introduction,
            "main_body": lecture_output.main_body,
            "conclusion": lecture_output.conclusion,
            "visuals": [
                v.image_path
                for v in (lecture_output.visualizations or [])
                if v and getattr(v, "image_path", None)
            ],
            "avatar_video_url": lecture_output.video_path,
            "rag_used": bool(rag_used),
            "source_files": source_files or [],
            "status": "ready",
            "created_at": now,
            "updated_at": now,
            "meta": {
                "lecture_output": lecture_output.model_dump(),
                "captions_url": lecture_output.captions_url,
                "source": "rag" if rag_used else "prompt",
            },
        }

        await db.lectures.insert_one(record)
    except Exception as e:  # history is non-critical
        logger.error(f"❌ Failed to persist lecture history: {e}")



@router.post(
    "/content/generate",
    response_model=LectureOutput,
    status_code=status.HTTP_201_CREATED,
    description="Generate AI-based lecture content, visuals, and avatar video (frontend handles compilation).",
)
async def generate_lecture(
    request: GenerationRequest,
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Lecture Generation Pipeline (updated):
    1️⃣ Generate structured content (Gemini)
    2️⃣ Generate visuals (Gemini)
    3️⃣ Create Azure avatar video
    4️⃣ ✅ Return all assets — no backend compilation
    """

    username = current_user.username
    logger.info(f"🎬 Starting lecture generation for user: {username}")

    # 1️⃣ Generate structured lecture content using Gemini
    try:
        content_data = generate_content(request.prompt)
        content = GeneratedContent(**content_data)
        logger.info(f"✅ Content generation successful for topic: {content.topic}")
    except Exception as e:
        logger.error(f"❌ LLM content generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate structured content.",
        )

    # 2️⃣ Generate visuals
    try:
        content_with_visuals = generate_visuals_for_content(content.model_dump())
        content = GeneratedContent(**content_with_visuals)
        logger.info("🖼️ Visual generation complete.")
    except Exception as e:
        logger.error(f"❌ Visual generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate visuals for lecture.",
        )

    # 3️⃣ Azure Avatar synthesis (URL only, no download)
    safe_title = content.topic.replace(" ", "_").replace("/", "-")[:50]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename_base = f"{username}_{safe_title}_{timestamp}"

    try:
        logger.info("🧠 Submitting text to Azure Avatar for synthesis...")

        full_text = "\n\n".join(
            filter(None, [content.introduction, content.main_body, content.conclusion])
        ).strip()

        # Split text into smaller chunks
        words = full_text.split()
        max_chunk_words = 250
        chunks = [" ".join(words[i:i + max_chunk_words]) for i in range(0, len(words), max_chunk_words)]

        job_id = submit_synthesis_with_text(None, chunks, avatar_character="Max", style="business")
        result_url, captions_url_remote = poll_job_and_get_result(job_id)
        logger.info(f"✅ Azure Avatar job completed. Returning video URL: {result_url}")
        # Try to materialize captions locally so the frontend can fetch without Azure auth
        captions_url = None
        try:
            if captions_url_remote:
                resp = requests.get(captions_url_remote, headers=_authenticate(), timeout=30)
                if resp.ok and resp.text.strip():
                    ensure_dirs()
                    local_rel = f"static/captions/{job_id}.vtt"
                    os.makedirs(os.path.dirname(local_rel), exist_ok=True)
                    save_file(local_rel, resp.content)
                    captions_url = get_file_url(local_rel)
        except Exception as e:
            logger.warning(f"⚠️ Could not cache captions locally: {e}")

    except Exception as e:
        logger.error(f"❌ Azure Avatar synthesis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Avatar synthesis failed. Please retry.",
        )

    # 4️⃣ ✅ Skip final video composition (frontend will handle)
    logger.info("⏭️ Skipping backend video compilation. Returning assets for frontend assembly.")

    # ✅ Return structured response with all materials
    # 5) Build response (no backend compilation)
    lecture_output = LectureOutput(
        topic=content.topic,
        introduction=content.introduction,
        main_body=content.main_body,
        conclusion=content.conclusion,
        visualizations=content.visualizations,
        video_path=result_url,  # direct Azure URL
        captions_url=captions_url,
    )

    # 6) Persist in history (best-effort)
    await _persist_lecture(
        db=db,
        current_user=current_user,
        lecture_output=lecture_output,
        rag_used=False,
        source_files=[],
    )

    return lecture_output


@router.post(
    "/content/generate-from-docs",
    response_model=LectureOutput,
    status_code=status.HTTP_201_CREATED,
    description="Generate lecture grounded in uploaded documents (RAG). Frontend compiles final video.",
)
async def generate_lecture_from_docs(
    prompt: str = Form(..., min_length=10),
    files: List[UploadFile] = File(...),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):

    """
    RAG-based generation:
    - Accepts PDF/DOCX/TXT
    - Extracts, chunks, embeds, retrieves top-k context
    - Calls Gemini with prompt+context
    - Generates visuals (HF FLUX)
    - Azure avatar URL only (no download)
    """
    username = current_user.username
    logger.info(f"📄 RAG lecture generation for user: {username} — files: {len(files)}")

    # 0) Save uploads
    saved: List[Tuple[str, Optional[str]]] = []
    for f in files:
        if not allowed_file_mime(f.content_type):
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {f.content_type}")
        path = await save_upload_file(f, dest_dir="static/uploads")
        saved.append((path, f.content_type))

    # 1) Build RAG context
    try:
        context = build_context_from_files(saved, prompt, top_k=6)
    except Exception as e:
        logger.error(f"RAG context build failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to process documents.")

    # 2) Generate structured content using Gemini + context
    try:
        content_data = generate_content_with_context(prompt, context)
        content = GeneratedContent(**content_data)
        logger.info(f"✅ Context-grounded content generated for topic: {content.topic}")
    except Exception as e:
        logger.error(f"LLM content (with context) failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate content from docs.")

    # 3) Visuals
    try:
        content_with_visuals = generate_visuals_for_content(content.model_dump())
        content = GeneratedContent(**content_with_visuals)
        logger.info("🖼️ Visual generation complete (RAG).")
    except Exception as e:
        logger.error(f"Visual generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate visuals.")

    # 4) Azure avatar URL (no download)
    try:
        full_text = "\n\n".join(filter(None, [content.introduction, content.main_body, content.conclusion])).strip()
        words = full_text.split()
        max_chunk_words = 250
        chunks = [" ".join(words[i:i + max_chunk_words]) for i in range(0, len(words), max_chunk_words)]
        job_id = submit_synthesis_with_text(None, chunks, avatar_character="Max", style="business")
        result_url, captions_url_remote = poll_job_and_get_result(job_id)
        logger.info(f"✅ Azure Avatar job completed (RAG). Returning URL.")
        captions_url = None
        try:
            if captions_url_remote:
                resp = requests.get(captions_url_remote, headers=_authenticate(), timeout=30)
                if resp.ok and resp.text.strip():
                    ensure_dirs()
                    local_rel = f"static/captions/{job_id}.vtt"
                    os.makedirs(os.path.dirname(local_rel), exist_ok=True)
                    save_file(local_rel, resp.content)
                    captions_url = get_file_url(local_rel)
        except Exception as e:
            logger.warning(f"⚠️ Could not cache captions locally: {e}")
    except Exception as e:
        logger.error(f"Azure avatar synthesis failed: {e}")
        raise HTTPException(status_code=500, detail="Avatar synthesis failed.")

    # 5) Return (no backend compilation)
    lecture_output = LectureOutput(
        topic=content.topic,
        introduction=content.introduction,
        main_body=content.main_body,
        conclusion=content.conclusion,
        visualizations=content.visualizations,
        video_path=result_url,
        captions_url=captions_url,
    )

    await _persist_lecture(
        db=db,
        current_user=current_user,
        lecture_output=lecture_output,
        rag_used=True,
        source_files=[path for (path, _mime) in saved],
    )

    return lecture_output


@router.get(
    "/content/history",
    response_model=List[LectureHistoryItem],
    status_code=status.HTTP_200_OK,
    description="Return previous lectures for the authenticated user (most recent first).",
)
async def get_lecture_history(
    limit: int = 20,
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        user = await db.users.find_one({"username": current_user.username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = str(user.get("_id"))
        per_page = max(1, min(limit, 100))

        cursor = (
            db.lectures.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(per_page)
        )

        items: List[LectureHistoryItem] = []
        async for doc in cursor:
            meta = doc.get("meta") or {}
            lecture_data = meta.get("lecture_output")

            # Fallback for very old docs with no meta
            if not lecture_data:
                main_body_value = doc.get("main_body") or ""
                if isinstance(main_body_value, list):
                    main_body_text = "\n\n".join(
                        str(part.get("content", ""))
                        for part in main_body_value
                        if isinstance(part, dict)
                    )
                else:
                    main_body_text = str(main_body_value)

                lecture_data = {
                    "topic": doc.get("topic", ""),
                    "introduction": doc.get("introduction", ""),
                    "main_body": main_body_text,
                    "conclusion": doc.get("conclusion", ""),
                    "visualizations": [],
                    "video_path": doc.get("avatar_video_url") or "",
                    "captions_url": meta.get("captions_url"),
                }

            lecture = LectureOutput(**lecture_data)

            items.append(
                LectureHistoryItem(
                    id=str(doc.get("_id")),
                    topic=doc.get("topic", lecture.topic),
                    status=str(doc.get("status", "ready")),
                    created_at=doc.get("created_at", datetime.utcnow()),
                    lecture=lecture,
                )
            )

        return items
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to load lecture history: {e}")
        raise HTTPException(status_code=500, detail="Failed to load lecture history")
