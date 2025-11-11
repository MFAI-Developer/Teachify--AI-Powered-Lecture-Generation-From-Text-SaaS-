# app/database/schemas.py
from __future__ import annotations
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl

# ---------- Pydantic Domain Models ----------

class UserDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    roles: List[str] = Field(default_factory=lambda: ["user"])

class LectureSection(BaseModel):
    heading: str
    content: str
    visual_prompt: Optional[str] = None

class LectureDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    topic: str
    introduction: str
    main_body: List[LectureSection]
    conclusion: str
    visuals: List[str] = Field(default_factory=list)           # asset_ids or URLs
    avatar_video_url: Optional[HttpUrl] = None
    rag_used: bool = False
    source_files: List[str] = Field(default_factory=list)       # storage keys
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: Literal["draft","ready","error"] = "ready"
    meta: Dict[str, Any] = Field(default_factory=dict)

class AssetDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    kind: Literal["image","audio","video","doc"]
    url: HttpUrl
    storage_key: Optional[str] = None
    etag: Optional[str] = None
    size_bytes: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    meta: Dict[str, Any] = Field(default_factory=dict)

class JobDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    job_type: Literal["generation","visuals","avatar","compile"]
    status: Literal["queued","running","succeeded","failed"] = "queued"
    payload: Dict[str, Any] = Field(default_factory=dict)
    result: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None

class AuditLogDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: Optional[str] = None
    action: str
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    meta: Dict[str, Any] = Field(default_factory=dict)

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class SessionDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    refresh_token_hash: str      # store HASH of refresh token
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    meta: Dict[str, Any] = Field(default_factory=dict)

# ---------- Mongo Index Definitions ----------

MONGO_INDEXES = {
    "users": [
        {"keys": [("username", 1)], "unique": True},
        {"keys": [("email", 1)], "unique": True},
        {"keys": [("created_at", -1)]},
    ],
    "lectures": [
        {"keys": [("user_id", 1), ("created_at", -1)]},
        {"keys": [("topic", "text")]},
    ],
    "assets": [
        {"keys": [("user_id", 1), ("created_at", -1)]},
        {"keys": [("storage_key", 1)], "unique": False},
    ],
    "jobs": [
        {"keys": [("user_id", 1), ("created_at", -1)]},
        {"keys": [("status", 1), ("job_type", 1)]},
    ],
    "audit_logs": [
        {"keys": [("user_id", 1), ("created_at", -1)]},
        {"keys": [("action", 1), ("created_at", -1)]},
    ],
    "sessions": [
        {"keys": [("user_id", 1), ("created_at", -1)]},
        {"keys": [("expires_at", 1)]},
    ],
}
