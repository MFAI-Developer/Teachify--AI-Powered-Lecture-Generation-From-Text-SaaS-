# app/utils/storage.py
"""
Handles file storage for both local and cloud (S3/MinIO) environments.
Provides unified helpers for saving, retrieving, and deleting files.
"""

import os
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("uvicorn")

try:
    import boto3
    from botocore.exceptions import BotoCoreError, NoCredentialsError
    S3_AVAILABLE = True
except ImportError:
    S3_AVAILABLE = False
    logger.warning("boto3 not installed — S3 storage unavailable, falling back to local.")

# ────────────────────────────────
# Directory Management
# ────────────────────────────────
def ensure_dirs():
    """Ensure all required local directories exist."""
    for d in ("static/images", "static/audios", "static/uploads", "static/avatars", "static/videos"):
        os.makedirs(d, exist_ok=True)
    logger.debug("✅ Verified static directories.")


# ────────────────────────────────
# Local Storage
# ────────────────────────────────
def save_file_local(path: str, data: bytes) -> str:
    """Save file locally under the given path."""
    try:
        ensure_dirs()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        logger.info(f"💾 File saved locally at: {path}")
        return path
    except Exception as e:
        logger.error(f"❌ Failed to save local file: {e}")
        raise


def get_local_url(path: str) -> str:
    """Return a local URL path (for dev/testing)."""
    return f"/{path}" if not path.startswith("/") else path


def delete_file_local(path: str) -> bool:
    """Safely delete a local file if it exists."""
    try:
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"🗑️ Deleted local file: {path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        return False


# ────────────────────────────────
# S3 / MinIO Storage
# ────────────────────────────────
def _get_s3_client():
    """Create a boto3 client for S3-compatible storage."""
    if not S3_AVAILABLE:
        raise RuntimeError("boto3 not available — cannot use S3 storage.")
    try:
        return boto3.client(
            "s3",
            region_name=settings.s3_region,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
        )
    except Exception as e:
        logger.error(f"Failed to create S3 client: {e}")
        raise


def save_file_s3(key: str, data: bytes) -> str:
    """Upload file bytes to S3 and return public URL."""
    try:
        s3 = _get_s3_client()
        bucket = settings.s3_bucket
        s3.put_object(Bucket=bucket, Key=key, Body=data)
        logger.info(f"☁️ File uploaded to S3 bucket: {bucket}/{key}")
        return f"https://{bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"
    except (BotoCoreError, NoCredentialsError, Exception) as e:
        logger.error(f"❌ Failed to upload to S3: {e}")
        raise


def delete_file_s3(key: str) -> bool:
    """Delete file from S3 bucket."""
    try:
        s3 = _get_s3_client()
        s3.delete_object(Bucket=settings.s3_bucket, Key=key)
        logger.info(f"🗑️ Deleted S3 object: {key}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete S3 file: {e}")
        return False


# ────────────────────────────────
# Unified Interface
# ────────────────────────────────
def save_file(path_or_key: str, data: bytes) -> str:
    """
    Unified entry point for saving a file.
    Automatically selects local or S3 backend.
    """
    if settings.storage_driver == "s3":
        return save_file_s3(path_or_key, data)
    return save_file_local(path_or_key, data)


def get_file_url(path_or_key: str) -> str:
    """Return the public-accessible URL for a stored file."""
    if settings.storage_driver == "s3":
        return f"https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com/{path_or_key}"
    return get_local_url(path_or_key)


def delete_file(path_or_key: str) -> bool:
    """Delete a file based on current storage driver."""
    if settings.storage_driver == "s3":
        return delete_file_s3(path_or_key)
    return delete_file_local(path_or_key)

# app/utils/storage.py (append or place appropriately)
import os
from fastapi import UploadFile

async def save_upload_file(file: UploadFile, dest_dir: str = "static/uploads") -> str:
    os.makedirs(dest_dir, exist_ok=True)
    filename = file.filename or "upload.bin"
    safe = filename.replace("/", "_").replace("\\", "_")
    path = os.path.join(dest_dir, safe)
    with open(path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    await file.close()
    return path
