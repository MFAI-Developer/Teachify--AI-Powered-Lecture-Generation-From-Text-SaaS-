# app/utils/validators.py
"""
Validation and sanitization helpers for uploads and text inputs.
Keep these small, fast, and side-effect free so they can be reused in routers and services.
"""

from __future__ import annotations
import re
import unicodedata
from typing import Iterable, Optional

from app.config import settings

# Common MIME groups
IMAGE_MIMES = {"image/png", "image/jpeg", "image/webp"}
DOC_MIMES = {
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

CONTROL_CHARS = "".join(map(chr, list(range(0, 32)) + [127]))
CONTROL_CHARS_RE = re.compile(f"[{re.escape(CONTROL_CHARS)}]")


def sanitize_text(text: str, *, max_len: int = 10_000, collapse_ws: bool = True) -> str:
    """
    Strip control chars, normalize unicode, trim length.
    """
    if text is None:
        return ""
    text = unicodedata.normalize("NFKC", str(text))
    text = CONTROL_CHARS_RE.sub(" ", text)
    if collapse_ws:
        text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_len:
        text = text[:max_len].rstrip() + "…"
    return text


def is_safe_filename(name: str, *, max_len: int = 100) -> bool:
    """
    Only allow alnum, dot, dash, underscore. No path separators.
    """
    if not name or len(name) > max_len:
        return False
    if "/" in name or "\\" in name:
        return False
    return re.fullmatch(r"[A-Za-z0-9._-]+", name) is not None


def safe_filename(name: str, *, max_len: int = 100) -> str:
    """
    Sanitize into a safe filename.
    """
    name = sanitize_text(name, max_len=max_len)
    name = name.lower().strip().replace(" ", "_")
    name = re.sub(r"[^a-z0-9._-]+", "_", name).strip("._-")
    if not name:
        name = "file"
    return name[:max_len]


def validate_prompt(prompt: str, *, min_len: int = 10, max_len: int = 1_500) -> str:
    """
    Sanitize and enforce reasonable bounds for generation prompts.
    """
    prompt = sanitize_text(prompt, max_len=max_len)
    if len(prompt) < min_len:
        raise ValueError(f"Prompt too short (min {min_len} chars).")
    return prompt


def validate_mime(mime: str, allowed: Iterable[str]) -> None:
    """
    Raise if mime not allowed.
    """
    if mime not in allowed:
        raise ValueError(f"Unsupported content type: {mime}")


def validate_filesize(num_bytes: int, *, max_mb: Optional[int] = None) -> None:
    """
    Enforce configured or provided max upload size.
    """
    cap_mb = max_mb or settings.max_upload_size_mb
    if num_bytes > cap_mb * 1024 * 1024:
        raise ValueError(f"File too large (>{cap_mb} MB).")


def validate_upload(
    filename: str,
    mime: str,
    size_bytes: int,
    *,
    allowed_mimes: Iterable[str],
    max_mb: Optional[int] = None,
) -> str:
    """
    One-shot validation for uploads. Returns a sanitized filename.
    """
    validate_mime(mime, allowed_mimes)
    validate_filesize(size_bytes, max_mb=max_mb)
    return safe_filename(filename or "upload")

# app/utils/validators.py (append or place appropriately)

def allowed_file_mime(mime: str | None) -> bool:
    if not mime:
        return False
    allowed = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # docx
        "text/plain",
    }
    return mime in allowed
