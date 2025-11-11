# app/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import routes as auth_routes
from app.api import v1 as api_v1
from app.database.connection import close_mongo_connection, get_db, ensure_indexes
from app.utils.storage import ensure_dirs
from app.config import settings
from app.logging_config import setup_logging

# ────────────────────────────────
# Setup logging first
# ────────────────────────────────
setup_logging()

# ────────────────────────────────
# Create FastAPI app instance
# ────────────────────────────────
app = FastAPI(
    title="Teachify Backend",
    version="1.0.0",
    description="AI-powered lecture video generation backend for Teachify.",
)

# ────────────────────────────────
# Configure CORS (before routes)
# ────────────────────────────────
# Prefer environment-driven origins via settings.allowed_origins.
# If "*" is present, fall back to a permissive regex to allow any origin.
allowed_origins = settings.allowed_origins
print(f"🔧 CORS allowed_origins: {allowed_origins}")
if "*" in allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ────────────────────────────────
# Google credentials (optional)
# ────────────────────────────────
if settings.google_credentials and os.path.exists(settings.google_credentials):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_credentials

# ────────────────────────────────
# Startup / Shutdown
# ────────────────────────────────
@app.on_event("startup")
async def on_startup():
    ensure_dirs()  # Create static dirs
    db = await get_db()
    await ensure_indexes(db)
    print("✅ Teachify backend started successfully.")


@app.on_event("shutdown")
async def on_shutdown():
    await close_mongo_connection()
    print("🛑 MongoDB connection closed.")

# ────────────────────────────────
# Routers
# ────────────────────────────────
app.include_router(auth_routes.router)  # /auth routes
app.include_router(api_v1.router)       # /v1 routes
# Serve local static files (images, captions, videos) for development/testing
app.mount("/static", StaticFiles(directory="static"), name="static")

# ────────────────────────────────
# Health check
# ────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "service": "Teachify backend is running"}

@app.get("/health")
def health():
    return {"ok": True}
