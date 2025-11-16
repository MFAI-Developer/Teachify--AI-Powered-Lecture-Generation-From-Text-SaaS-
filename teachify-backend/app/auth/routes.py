# app/auth/routes.py
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Request,
)
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from pydantic import BaseModel
from app.auth.models import (
    UserCreate,
    Token,
    UserPublic,
    UserUpdate,
    AccountDeleteRequest,
)
from app.utils.storage import save_upload_file, delete_file
from app.database.connection import get_db
from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_refresh_token,
    verify_access_token,  # ✅ add
    verify_refresh_token,
)
from urllib.parse import urljoin
from app.config import settings
import os


# ────────────────────────────────
# Setup
# ────────────────────────────────
router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _map_user_to_public(user: dict) -> UserPublic:
    """
    Map a MongoDB user document to the public user schema.
    Safely handles missing optional fields.
    """
    return UserPublic(
        username=user["username"],
        email=user.get("email", ""),
        company=user.get("company", "") or "",
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at", datetime.now(timezone.utc)),
    )


# ────────────────────────────────
# Helper: Current User
# ────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserPublic:
    # Strict: validates signature, exp, and that type == "access"
    try:
        username = verify_access_token(token)  # returns the subject (string)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return _map_user_to_public(user)


# ────────────────────────────────
# Register
# ────────────────────────────────
@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Register a new user with unique username.
    """
    username = user.username.strip().lower()
    if await db.users.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = pwd_context.hash(user.password)
    doc = {
        "username": username,
        "email": user.email.lower(),
        "company": user.company,
        "hashed_password": hashed,
        "created_at": datetime.utcnow(),
    }

    await db.users.insert_one(doc)
    return _map_user_to_public(doc)


# ────────────────────────────────
# Login (Issue Tokens)
# ────────────────────────────────
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    username = form_data.username.strip().lower()
    user = await db.users.find_one({"username": username})
    if not user or not pwd_context.verify(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Create access & refresh tokens
    access_token = create_access_token(username)
    refresh_token = create_refresh_token(username)
    payload = decode_token(refresh_token)

    # Save hashed refresh token
    await db.sessions.insert_one(
        {
            "user_id": username,
            "refresh_token_hash": hash_refresh_token(refresh_token),
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            "revoked_at": None,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,  # client stores securely
        "expires_in": settings.access_token_expire_minutes * 60,
    }


# ────────────────────────────────
# Refresh
# ────────────────────────────────
class RefreshIn(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_token(payload: RefreshIn, db=Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    username = decoded.get("sub")
    session_doc = await db.sessions.find_one(
        {
            "user_id": username,
            "revoked_at": None,
            "expires_at": {"$gt": datetime.now(timezone.utc)},
        },
        sort=[("created_at", -1)],
    )

    if not session_doc or not verify_refresh_token(
        payload.refresh_token, session_doc["refresh_token_hash"]
    ):
        raise HTTPException(status_code=401, detail="Refresh token not recognized")

    new_access = create_access_token(username)
    new_refresh = create_refresh_token(username)

    # Revoke old + insert new
    await db.sessions.update_one(
        {"_id": session_doc["_id"]}, {"$set": {"revoked_at": datetime.now(timezone.utc)}}
    )
    payload_new = decode_token(new_refresh)
    await db.sessions.insert_one(
        {
            "user_id": username,
            "refresh_token_hash": hash_refresh_token(new_refresh),
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.fromtimestamp(payload_new["exp"], tz=timezone.utc),
            "revoked_at": None,
        }
    )

    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


# ────────────────────────────────
# Logout
# ────────────────────────────────
@router.post("/logout")
async def logout(payload: RefreshIn, db=Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
    except ValueError:
        return {"ok": True}  # idempotent

    username = decoded.get("sub")
    session_doc = await db.sessions.find_one(
        {
            "user_id": username,
            "revoked_at": None,
            "expires_at": {"$gt": datetime.now(timezone.utc)},
        },
        sort=[("created_at", -1)],
    )

    if not session_doc:
        return {"ok": True}

    if verify_refresh_token(payload.refresh_token, session_doc["refresh_token_hash"]):
        await db.sessions.update_one(
            {"_id": session_doc["_id"]}, {"$set": {"revoked_at": datetime.now(timezone.utc)}}
        )

    return {"ok": True}


# ────────────────────────────────
# Profile (Protected)
# ────────────────────────────────
@router.get("/profile", response_model=UserPublic)
async def read_users_me(current_user: UserPublic = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserPublic)
async def update_profile(
    payload: UserUpdate,
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Allow the user to update non-primary profile fields.
    Username is intentionally not editable.
    """
    update_doc: dict = {}

    if payload.email is not None:
        update_doc["email"] = payload.email.lower()

    if payload.company is not None:
        update_doc["company"] = payload.company

    if not update_doc:
        # Nothing changed; just return the latest state
        user_doc = await db.users.find_one({"username": current_user.username})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        return _map_user_to_public(user_doc)

    update_doc["updated_at"] = datetime.now(timezone.utc)

    await db.users.update_one(
        {"username": current_user.username},
        {"$set": update_doc},
    )

    user_doc = await db.users.find_one({"username": current_user.username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    return _map_user_to_public(user_doc)

@router.post("/profile/avatar")
async def upload_profile_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Upload or replace the current user's profile image.
    Stores the file under static/avatars and persists avatar_url + storage key.
    """
    if file.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG and WebP images are allowed.",
        )

    user_doc = await db.users.find_one({"username": current_user.username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    old_storage_key = user_doc.get("avatar_storage_key")

    # Save to static/avatars
    saved_path = await save_upload_file(file, dest_dir="static/avatars")
    storage_key = saved_path  # for local driver this is the filesystem path

    # Build absolute public URL
    rel_path = saved_path.replace("\\", "/")
    if rel_path.startswith("./"):
        rel_path = rel_path[2:]
    avatar_url = urljoin(str(request.base_url), rel_path.lstrip("/"))

    await db.users.update_one(
        {"username": current_user.username},
        {
            "$set": {
                "avatar_url": avatar_url,
                "avatar_storage_key": storage_key,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    # Best-effort delete old avatar
    if old_storage_key:
        delete_file(old_storage_key)

    return {"avatar_url": avatar_url}

@router.delete("/profile/avatar")
async def delete_profile_avatar(
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Remove the current user's profile image and delete the underlying file.
    """
    user_doc = await db.users.find_one({"username": current_user.username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    storage_key = user_doc.get("avatar_storage_key")
    if storage_key:
        delete_file(storage_key)

    await db.users.update_one(
        {"username": current_user.username},
        {
            "$unset": {
                "avatar_url": "",
                "avatar_storage_key": "",
            },
            "$set": {
                "updated_at": datetime.now(timezone.utc),
            },
        },
    )

    return {"ok": True}

@router.delete("/account")
async def delete_account(
    payload: AccountDeleteRequest,
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Permanently delete the authenticated user's account and related data.

    Safety:
    - Requires current password
    - Requires confirm == "DELETE"
    """
    if payload.confirm.strip().upper() != "DELETE":
        raise HTTPException(
            status_code=400,
            detail='To delete your account you must type "DELETE" in the confirmation field.',
        )

    user_doc = await db.users.find_one({"username": current_user.username})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify password
    if not pwd_context.verify(payload.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=403, detail="Password is incorrect")

    # Clean up profile avatar
    avatar_storage_key = user_doc.get("avatar_storage_key")
    if avatar_storage_key:
        delete_file(avatar_storage_key)

    # Some collections use username, others may use _id as user_id
    user_id = str(user_doc.get("_id") or current_user.username)

    # Delete sessions (stored with username as user_id)
    await db.sessions.delete_many({"user_id": current_user.username})

    # Delete lectures (cover both username & objectId-based user_id)
    try:
        await db.lectures.delete_many(
            {"$or": [{"user_id": user_id}, {"user_id": current_user.username}]}
        )
    except Exception:
        # If lectures collection doesn't exist yet, ignore
        pass

    # Delete assets/jobs tied to user_id (if those collections exist)
    for collection_name in ("assets", "jobs"):
        try:
            await db[collection_name].delete_many({"user_id": user_id})
        except Exception:
            pass

    # Audit log (do not block on failure)
    try:
        await db.audit_logs.insert_one(
            {
                "user_id": user_id,
                "action": "account_deleted",
                "created_at": datetime.now(timezone.utc),
                "meta": {},
            }
        )
    except Exception:
        pass

    # Finally remove user
    await db.users.delete_one({"_id": user_doc["_id"]})

    return {"ok": True}

