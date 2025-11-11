# app/config.py
from __future__ import annotations
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))


class Settings(BaseSettings):
    """
    Central configuration for the Teachify backend.
    Values are read automatically from the .env file or system environment.
    """

    # ────────────────────────────────
    # App Metadata
    # ────────────────────────────────
    app_name: str = "Teachify"
    app_env: str = "production"  # "development" | "production"
    debug: bool = True
    version: str = "1.0.0"

    # ────────────────────────────────
    # Allowed CORS origins (Frontend URLs)
    # ────────────────────────────────
    allowed_origins: List[str] = ["*"]  # override in .env for production
    
    @field_validator('allowed_origins', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string or single value
            if v == "*":
                return ["*"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    bfl_api_key: Optional[str] = None
    bfl_api_base: str = "https://api.bfl.ai"
    bfl_route: str = "/v1/flux-pro-1.1"

    # ────────────────────────────────
    # Database (MongoDB)
    # ────────────────────────────────
    mongo_uri: str
    mongo_db_name: str

    # ────────────────────────────────
    # JWT Authentication
    # ────────────────────────────────
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 20   # short-lived access token
    refresh_token_expire_days: int = 14     # new field for refresh tokens

    # ────────────────────────────────
    # LLM / AI Integrations
    # ────────────────────────────────
    gemini_api_key: Optional[str] = None
    huggingface_token: Optional[str] = None
    tts_provider: str = "gtts"

    # ────────────────────────────────
    # Azure Speech + Avatar
    # ────────────────────────────────
    speech_endpoint: Optional[str] = None
    speech_key: Optional[str] = None
    avatar_api_base: Optional[str] = None
    avatar_api_key: Optional[str] = None

    # ────────────────────────────────
    # Storage (local or S3)
    # ────────────────────────────────
    storage_driver: str = "local"  # "local" | "s3"
    s3_bucket: Optional[str] = None
    s3_region: Optional[str] = None
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None

    # ────────────────────────────────
    # File Handling / Upload limits
    # ────────────────────────────────
    max_upload_size_mb: int = 50

    # ────────────────────────────────
    # Google / Vertex AI credentials
    # ────────────────────────────────
    google_project_id: Optional[str] = None
    google_credentials: Optional[str] = None

    # ────────────────────────────────
    # Internal config (Pydantic v2)
    # ────────────────────────────────
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
