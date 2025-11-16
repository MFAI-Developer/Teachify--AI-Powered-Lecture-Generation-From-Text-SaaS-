# app/auth/models.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


# ────────────────────────────────
# AUTHENTICATION MODELS
# ────────────────────────────────


class UserCreate(BaseModel):
    """Schema for new user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(..., description="User email (must be unique)")
    company: str = Field(default="", max_length=128)
    password: str = Field(
        ...,
        min_length=8,
        description="User password (will be hashed before saving).",
    )


class UserInDB(BaseModel):
    """Internal DB model for user storage."""
    username: str
    company: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True



class UserPublic(BaseModel):
    """Public model for user responses (no password exposure)."""
    username: str
    email: EmailStr
    company: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    """Editable fields for the current user profile."""
    email: Optional[EmailStr] = None
    company: Optional[str] = Field(default=None, max_length=128)


class AccountDeleteRequest(BaseModel):
    """Payload for permanent account deletion."""
    password: str = Field(..., min_length=8)
    # Must equal "DELETE" for safety
    confirm: str = Field(
        ...,
        description='Must be exactly "DELETE" to confirm account removal.',
    )



class Token(BaseModel):
    """JWT access token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Decoded token data."""
    username: Optional[str] = None
    role: Optional[str] = None



# ────────────────────────────────
# CONTENT GENERATION MODELS
# ────────────────────────────────

class VisualizationPrompt(BaseModel):
    """Model representing one image prompt for a lecture section."""
    section: str = Field(..., description="Lecture section this visual relates to (e.g., 'introduction').")
    prompt: str = Field(..., description="Detailed image generation prompt.")
    image_path: Optional[str] = Field(None, description="Path or URL to generated image.")
    paragraph_index: Optional[int] = Field(None, description="Index of the paragraph in that section.")
    snippet: Optional[str] = Field(None, description="Exact text snippet where this image applies.")



class GeneratedContent(BaseModel):
    """Structured output from the LLM for a lecture."""
    topic: str = Field(..., max_length=120)
    introduction: str
    main_body: str
    conclusion: str
    visualizations: List[VisualizationPrompt] = Field(default_factory=list)


class GenerationRequest(BaseModel):
    """Input schema for content generation endpoint."""
    prompt: str = Field(..., min_length=10, description="User topic or question to generate lecture content.")


class LectureOutput(BaseModel):
    """Final response after full video generation."""
    topic: str
    introduction: str
    main_body: str
    conclusion: str
    visualizations: List[VisualizationPrompt]
    video_path: str = Field(..., description="Path or URL to final compiled video file.")
    captions_url: Optional[str] = Field(
        default=None, description="Optional URL to WebVTT/SRT captions aligned with avatar speech."
    )
