# app/auth/jwt_handler.py
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import jwt, JWTError
from passlib.hash import argon2
from fastapi import HTTPException, status
from app.config import settings

# ────────────────────────────────
# JWT Configurations
# ────────────────────────────────
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days


def _now() -> datetime:
    """Return timezone-aware current UTC time."""
    return datetime.now(timezone.utc)


# ────────────────────────────────
# Create Access Token
# ────────────────────────────────
def create_access_token(subject: str, role: Optional[str] = None) -> str:
    """
    Create a short-lived access token (JWT) for a user.
    """
    expire = _now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": _now(),
        "type": "access",
    }
    if role:
        payload["role"] = role
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ────────────────────────────────
# Create Refresh Token
# ────────────────────────────────
def create_refresh_token(subject: str) -> str:
    """
    Create a long-lived refresh token for renewing access tokens.
    """
    expire = _now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": _now(),
        "type": "refresh",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ────────────────────────────────
# Verify / Decode Token
# ────────────────────────────────
def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT and return its payload or raise ValueError if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Invalid token or signature")


def verify_access_token(token: str) -> str:
    """
    Verify an access token and return the subject (username or user_id).
    Raises HTTP 401 if invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        subject: Optional[str] = payload.get("sub")
        token_type = payload.get("type")
        if subject is None or token_type != "access":
            raise credentials_exception
        return subject
    except JWTError as e:
        raise credentials_exception from e


# ────────────────────────────────
# Refresh Token Hashing (for DB storage)
# ────────────────────────────────
def hash_refresh_token(raw_refresh: str) -> str:
    """
    Hash refresh tokens before saving them to the database.
    """
    return argon2.hash(raw_refresh)


def verify_refresh_token(raw_refresh: str, hash_value: str) -> bool:
    """
    Verify refresh token hash stored in DB.
    Returns True if valid, False otherwise.
    """
    try:
        return argon2.verify(raw_refresh, hash_value)
    except Exception:
        return False
