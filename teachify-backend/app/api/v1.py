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


logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/v1", tags=["Lecture Generation"])
ensure_dirs()  # create static dirs if missing


@router.post(
    "/content/generate",
    response_model=LectureOutput,
    status_code=status.HTTP_201_CREATED,
    description="Generate AI-based lecture content, visuals, and avatar video (frontend handles compilation).",
)
async def generate_lecture(
    request: GenerationRequest,
    current_user: UserPublic = Depends(get_current_user),
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
    return LectureOutput(
        topic=content.topic,
        introduction=content.introduction,
        main_body=content.main_body,
        conclusion=content.conclusion,
        visualizations=content.visualizations,
        video_path=result_url,  # avatar mp4 path returned for frontend use
        captions_url=captions_url,
    )

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
    return LectureOutput(
        topic=content.topic,
        introduction=content.introduction,
        main_body=content.main_body,
        conclusion=content.conclusion,
        visualizations=content.visualizations,
        video_path=result_url,  # direct Azure URL
        captions_url=captions_url,
    )
