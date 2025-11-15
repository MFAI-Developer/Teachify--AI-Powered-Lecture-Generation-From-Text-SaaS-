# app/media/visuals.py
"""
Generates lecture visuals using Black Forest Labs' official FLUX API.
Falls back to placeholder images if generation fails.
"""

import os
import re
import time
import json
import logging
import requests
from typing import Dict, Any, List, Optional
from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.utils.storage import ensure_dirs

logger = logging.getLogger("uvicorn")

# ────────────────────────────────
# BFL (Black Forest Labs) configuration
# ────────────────────────────────
BFL_API_KEY = getattr(settings, "bfl_api_key", None) or os.getenv("BFL_API_KEY")
BFL_BASE = os.getenv("BFL_API_BASE", "https://api.bfl.ai")
# Pick a route you prefer. "flux-pro-1.1" (higher quality) or "flux-dev" (cheaper/faster).
BFL_ROUTE = os.getenv("BFL_ROUTE", "/v1/flux-pro-1.1")
# aspect_ratio "16:9" gives 1280x720 delivery; API returns a signed URL we will download.
DEFAULT_ASPECT = os.getenv("BFL_ASPECT", "16:9")

if BFL_API_KEY:
    logger.info("✅ BFL API key detected — using official FLUX API.")
else:
    logger.warning("⚠️ No BFL API key found; image generation will use placeholders.")

# ────────────────────────────────
# Helper: safe filename
# ────────────────────────────────
def _safe_filename_from_prompt(prompt: str, index: int) -> str:
    safe = re.sub(r"[^a-zA-Z0-9_-]+", "_", prompt)[:60].strip("_")
    return f"{safe or 'visual'}_{index}.png"

# ────────────────────────────────
# Helper: placeholder image
# ────────────────────────────────
def create_placeholder_image(path: str, text: str) -> None:
    """Create a placeholder image when generation fails."""
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img = Image.new("RGB", (1280, 720), color=(25, 25, 25))
        draw = ImageDraw.Draw(img)
        wrapped = "\n".join([text[i:i + 70] for i in range(0, len(text), 70)])
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 26)
        except Exception:
            font = ImageFont.load_default()
        draw.text((40, 40), f"[PLACEHOLDER IMAGE]\n\n{wrapped}", fill=(240, 240, 240), font=font)
        img.save(path)
        logger.info(f"🖼️ Placeholder created: {path}")
    except Exception as exc:
        logger.error(f"Failed to create placeholder: {exc}")

# ────────────────────────────────
# Helper: save image
# ────────────────────────────────
def _save_image_bytes(image_bytes: bytes, path: str) -> bool:
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(image_bytes)
        return True
    except Exception as e:
        logger.error(f"Failed to save image {path}: {e}")
        return False

# ────────────────────────────────
# Submit + poll via BFL official API
# ────────────────────────────────
def _generate_image_via_bfl(prompt: str, aspect_ratio: str = DEFAULT_ASPECT, timeout_s: int = 180) -> Optional[bytes]:
    if not BFL_API_KEY:
        return None

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-key": BFL_API_KEY,
    }
    url = f"{BFL_BASE}{BFL_ROUTE}"

    try:
        # 1) Submit generation request
        payload = {"prompt": prompt, "aspect_ratio": aspect_ratio}
        logger.info("🧠 Submitting request to BFL FLUX API...")
        submit = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
        if submit.status_code != 200:
            logger.error(f"❌ BFL submit failed {submit.status_code}: {submit.text[:200]}")
            return None

        data = submit.json()
        polling_url = data.get("polling_url")
        if not polling_url:
            logger.error("❌ BFL response missing polling_url.")
            return None

        # 2) Poll for result
        start = time.time()
        while True:
            if time.time() - start > timeout_s:
                logger.error("❌ BFL polling timed out.")
                return None

            time.sleep(0.5)
            poll = requests.get(polling_url, headers={"accept": "application/json", "x-key": BFL_API_KEY}, timeout=30)
            if poll.status_code != 200:
                logger.warning(f"⚠️ BFL poll {poll.status_code}: {poll.text[:160]}")
                continue

            p = poll.json()
            status = p.get("status")
            if status == "Ready":
                sample_url = (p.get("result") or {}).get("sample")
                if not sample_url:
                    logger.error("❌ BFL Ready but no result.sample URL.")
                    return None
                # 3) Download the signed image URL (expires ~10 minutes)
                img_resp = requests.get(sample_url, timeout=60)
                if img_resp.ok:
                    logger.info("✅ BFL FLUX image generation success.")
                    return img_resp.content
                logger.error(f"❌ Failed to download BFL image: {img_resp.status_code}")
                return None
            elif status in {"Error", "Failed"}:
                logger.error(f"❌ BFL generation failed: {p}")
                return None
            # else: Queued / Processing → keep polling

    except Exception as e:
        logger.error(f"BFL image generation error: {e}")
        return None

# ────────────────────────────────
# Public pipeline
# ────────────────────────────────
def generate_visuals_for_content(content: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate visuals using BFL FLUX API or create placeholders if unavailable.
    """
    ensure_dirs()
    visuals: List[Dict[str, Any]] = content.get("visualizations", []) or []

    for idx, v in enumerate(visuals, start=1):
        prompt = (v.get("prompt") or f"Visual {idx}").strip()
        filename = _safe_filename_from_prompt(prompt, idx)
        out_path = os.path.join("static", "images", filename)

        logger.info(f"🎨 Generating visual {idx}: {prompt[:80]}...")
        image_bytes = _generate_image_via_bfl(prompt, aspect_ratio=DEFAULT_ASPECT)

        if image_bytes:
            if _save_image_bytes(image_bytes, out_path):
                logger.info(f"✅ FLUX image saved: {out_path}")
            else:
                logger.warning(f"⚠️ Could not save FLUX image. Placeholder for {filename}")
                create_placeholder_image(out_path, prompt)
        else:
            logger.warning(f"⚠️ BFL API unavailable or failed. Placeholder for {filename}")
            create_placeholder_image(out_path, prompt)

        v["image_path"] = out_path

    content["visualizations"] = visuals
    logger.info("🖼️ Visual generation complete.")
    return content
