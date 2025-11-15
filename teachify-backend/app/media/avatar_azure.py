# app/media/avatar_azure.py
"""
Azure Avatar API integration.
Takes plain text input and returns a talking avatar video (speech + lip-sync).
"""

import os
import time
import uuid
import json
import logging
import requests
from azure.identity import DefaultAzureCredential
from app.config import settings

logger = logging.getLogger("uvicorn")

# ────────────────────────────────
# Configuration
# ────────────────────────────────
SPEECH_ENDPOINT = settings.speech_endpoint or "https://eastus.api.cognitive.microsoft.com"
SPEECH_KEY = settings.speech_key
PASSWORDLESS_AUTHENTICATION = False
API_VERSION = "2024-04-15-preview"
REQUEST_TIMEOUT = 60
POLL_INTERVAL = 5


# ────────────────────────────────
# Authentication
# ────────────────────────────────
def _authenticate() -> dict:
    """
    Return proper authentication headers for Azure API.
    """
    if PASSWORDLESS_AUTHENTICATION:
        credential = DefaultAzureCredential()
        token = credential.get_token("https://cognitiveservices.azure.com/.default")
        return {"Authorization": f"Bearer {token.token}"}
    if not SPEECH_KEY:
        raise RuntimeError("Azure Speech key not configured.")
    return {"Ocp-Apim-Subscription-Key": SPEECH_KEY}


def _create_job_id() -> str:
    """Generate a unique job ID."""
    return str(uuid.uuid4())


# ────────────────────────────────
# Submit synthesis job
# ────────────────────────────────
def submit_synthesis_with_text(
    job_id: str | None,
    text_chunks: list[str],
    avatar_character: str = "Max",
    style: str = "business"
) -> str:
    job_id = job_id or _create_job_id()
    url = f"{SPEECH_ENDPOINT}/avatar/batchsyntheses/{job_id}?api-version={API_VERSION}"
    headers = {"Content-Type": "application/json"}
    headers.update(_authenticate())

    # ✅ Combine all text chunks into one single input
    combined_text = "\n\n".join(text_chunks)

    payload = {
        "synthesisConfig": {"voice": "en-US-GuyNeural"},
        "inputKind": "plainText",
        "inputs": [{"content": combined_text}],  # ✅ single input only
        "avatarConfig": {
            "customized": False,
            "talkingAvatarCharacter": avatar_character,
            "talkingAvatarStyle": style,
            "videoFormat": "mp4",
            "videoCodec": "h264",
            # Prefer sidecar captions for precise sync in frontend
            "subtitleType": "webvtt",
            "backgroundColor": "#FFFFFFFF"
        },
    }

    try:
        response = requests.put(url, json=payload, headers=headers, timeout=REQUEST_TIMEOUT)
        if response.status_code < 400:
            logger.info(f"✅ Azure avatar synthesis job submitted: {job_id}")
            return job_id
        else:
            raise RuntimeError(f"Azure job submission failed: {response.status_code} {response.text}")
    except Exception as e:
        logger.error(f"❌ Failed to submit Azure synthesis job: {e}")
        raise



# ────────────────────────────────
# Poll job status until done
# ────────────────────────────────
def poll_job_and_get_result(job_id: str) -> tuple[str, str | None]:
    """
    Poll Azure Avatar job status until it's finished.
    Returns the final result URL (MP4 download link).
    """
    url = f"{SPEECH_ENDPOINT}/avatar/batchsyntheses/{job_id}?api-version={API_VERSION}"
    headers = _authenticate()

    logger.info(f"⏳ Polling Azure job status: {job_id}")
    while True:
        try:
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            if resp.status_code >= 400:
                raise RuntimeError(f"Azure job polling failed: {resp.status_code} {resp.text}")
            data = resp.json()
            status = data.get("status")

            if status == "Succeeded":
                outputs = data.get("outputs", {}) or {}
                result = outputs.get("result")
                if not result:
                    raise RuntimeError("Azure job succeeded but no result URL found.")
                # Some regions return captions explicitly; try common keys, else infer
                captions = (
                    outputs.get("resultSubtitle")
                    or outputs.get("subtitles")
                    or outputs.get("subtitleUrl")
                )
                if not captions:
                    # Try to infer a .vtt next to the MP4
                    if result.endswith(".mp4"):
                        captions = result.replace(".mp4", ".vtt")
                logger.info(f"✅ Azure job completed. Result URL: {result}, captions: {captions}")
                return result, captions
            elif status == "Failed":
                raise RuntimeError(f"Azure job failed: {data}")
            else:
                logger.info(f"⌛ Azure job still running ({status})...")
                time.sleep(POLL_INTERVAL)
        except Exception as e:
            logger.error(f"⚠️ Error while polling job {job_id}: {e}")
            time.sleep(POLL_INTERVAL)


# ────────────────────────────────
# Download result file
# ────────────────────────────────
def download_file(url: str, out_path: str) -> None:
    """
    Download the synthesized avatar video to local storage.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    try:
        with requests.get(url, stream=True, timeout=REQUEST_TIMEOUT) as r:
            r.raise_for_status()
            with open(out_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        logger.info(f"🎥 Downloaded Azure avatar video: {out_path}")
    except Exception as e:
        logger.error(f"❌ Failed to download Azure avatar video: {e}")
        raise
