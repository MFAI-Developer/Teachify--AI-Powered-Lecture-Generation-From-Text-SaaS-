# app/content/generator.py
import json
import logging
from google import genai
from google.genai import types
from app.config import settings
from app.auth.models import GeneratedContent
import time
logger = logging.getLogger("uvicorn")

# ────────────────────────────────
# Initialize Gemini Client
# ────────────────────────────────
try:
    gemini_client = genai.Client(api_key=settings.gemini_api_key)
    logger.info("✅ Gemini client initialized successfully.")
except Exception as e:
    logger.warning(f"⚠️ Gemini client initialization failed: {e}")
    gemini_client = None


# ────────────────────────────────
# Helper: Fallback heuristic
# ────────────────────────────────
def _heuristic_content(prompt: str) -> dict:
    """
    Local fallback generator when Gemini is unavailable or fails.
    Produces a deterministic structured response to avoid recursion loops.
    """
    return {
        "topic": prompt[:120],
        "introduction": f"An introduction to {prompt}, explaining its basic concepts.",
        "main_body": f"This section elaborates on {prompt}, discussing its key aspects, examples, and relevance.",
        "conclusion": f"In summary, {prompt} highlights essential knowledge that learners can apply in practice.",
        "visualizations": [
            {
                "section": "introduction",
                "prompt": f"An engaging visual illustrating the main idea of {prompt}.",
            },
            {
                "section": "main_body",
                "prompt": f"A clear diagram showing important relationships or components of {prompt}.",
            },
            {
                "section": "conclusion",
                "prompt": f"A summary visual that captures the key takeaway of {prompt}.",
            },
        ],
    }


# ────────────────────────────────
# Helper: Sanitize Gemini output
# ────────────────────────────────
def sanitize_output(data: dict) -> dict:
    """
    Ensures output conforms to the GeneratedContent schema,
    preventing runtime validation errors.
    """
    for k in ("topic", "introduction", "main_body", "conclusion"):
        data[k] = data.get(k) or ""

    vis = data.get("visualizations", [])
    if not isinstance(vis, list):
        vis = [vis]

    data["visualizations"] = [
        v if isinstance(v, dict) else {"section": "Unknown", "prompt": str(v)} for v in vis
    ]
    return data


# ────────────────────────────────
# Main: Generate Content
# ────────────────────────────────
def generate_content(prompt: str) -> dict:
    """
    Generates structured educational content using Gemini,
    falling back to a heuristic method if necessary.
    """
    if not gemini_client or not settings.gemini_api_key:
        logger.warning("⚠️ Gemini client unavailable — using fallback generator.")
        return sanitize_output(_heuristic_content(prompt))

    # Build JSON schema from model
    lecture_schema = GeneratedContent.model_json_schema()

    system_prompt = (
        "You are an expert educational content assistant. "
        "Generate a concise, structured lecture in JSON with the following fields: "
        "topic, introduction, main_body, conclusion, and visualizations[]. "
        "Ensure the output strictly matches the provided JSON schema."
    )

    try:
        # ────────────────────────────────
        # Retry logic for Gemini overloads (503)
        # ────────────────────────────────
        for attempt in range(5):
            try:
                response = gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt if 'context' not in locals() else contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json",
                        response_schema=lecture_schema,
                        temperature=0.3 if 'context' not in locals() else 0.2,
                    ),
                )
                break
            except Exception as e:
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    wait = 2 ** attempt
                    logger.warning(f"⚠️ Gemini overloaded (attempt {attempt + 1}/5) — retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                else:
                    raise
        else:
            logger.error("❌ Gemini remained unavailable after 5 retries — using fallback.")
            return sanitize_output(_heuristic_content(prompt))

        # Parse response JSON
        data = json.loads(response.text)
        logger.info("✅ Gemini content generation successful.")

        # Attach paragraph indices for each visualization
        for vis in data.get("visualizations", []):
            section = vis.get("section", "").lower()
            text_section = data.get(section, "")
            if not text_section:
                continue

            # Find snippet and paragraph position
            paragraphs = [p.strip() for p in text_section.split("\n") if p.strip()]
            if paragraphs:
                vis["paragraph_index"] = min(len(paragraphs) - 1, 0)
                vis["snippet"] = paragraphs[0][:120]

        return sanitize_output(data)

    except Exception as e:
        logger.error(f"❌ Gemini API call failed: {e}")
        logger.warning("Using fallback heuristic instead.")
        return sanitize_output(_heuristic_content(prompt))

# ────────────────────────────────
# Context-aware content generation (RAG)
# ────────────────────────────────
def generate_content_with_context(prompt: str, context: str) -> dict:
    """
    Same as generate_content, but includes retrieved context for higher fidelity answers.
    """
    if not gemini_client or not settings.gemini_api_key:
        logger.warning("⚠️ Gemini unavailable — using fallback with context ignored.")
        return sanitize_output(_heuristic_content(prompt))

    lecture_schema = GeneratedContent.model_json_schema()
    system_prompt = (
        "You are an expert educational content assistant. "
        "Use the provided CONTEXT to ground your answer. If the context is insufficient, say so and avoid fabricating facts. "
        "Return a structured lecture in JSON with: topic, introduction, main_body, conclusion, visualizations[]. "
        "Each visualization should target a concrete paragraph; keep them precise and helpful."
    )

    try:
        contents = [
            {"role": "user", "parts": [
                {"text": f"PROMPT:\n{prompt}\n\nCONTEXT:\n{context or '(none)'}"}
            ]}
        ]

        # ────────────────────────────────
        # Retry logic for Gemini overloads (503)
        # ────────────────────────────────
        for attempt in range(5):
            try:
                response = gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt if 'context' not in locals() else contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json",
                        response_schema=lecture_schema,
                        temperature=0.3 if 'context' not in locals() else 0.2,
                    ),
                )
                break
            except Exception as e:
                if "503" in str(e) or "UNAVAILABLE" in str(e):
                    wait = 2 ** attempt
                    logger.warning(f"⚠️ Gemini overloaded (attempt {attempt + 1}/5) — retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                else:
                    raise
        else:
            logger.error("❌ Gemini remained unavailable after 5 retries — using fallback.")
            return sanitize_output(_heuristic_content(prompt))

        data = json.loads(response.text)
        logger.info("✅ Gemini content (with context) generated.")

        for vis in data.get("visualizations", []):
            section = vis.get("section", "").lower()
            text_section = data.get(section, "")
            if not text_section:
                continue
            paragraphs = [p.strip() for p in text_section.split("\n") if p.strip()]
            if paragraphs:
                vis["paragraph_index"] = min(len(paragraphs) - 1, 0)
                vis["snippet"] = paragraphs[0][:120]

        return sanitize_output(data)

    except Exception as e:
        logger.error(f"❌ Gemini (context) failed: {e}")
        return sanitize_output(_heuristic_content(prompt))

