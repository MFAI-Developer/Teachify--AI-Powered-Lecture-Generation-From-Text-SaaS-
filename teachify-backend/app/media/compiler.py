# app/media/compiler.py
"""
Handles final lecture video composition using MoviePy.
⚠️ Video compilation has been disabled.
Now the backend only returns individual assets (audio, images, avatar).
"""

import logging

logger = logging.getLogger("uvicorn")

# ────────────────────────────────
# Legacy slideshow builder (disabled)
# ────────────────────────────────
def compile_video(*args, **kwargs):
    """
    [DEPRECATED] - Backend video compilation disabled.
    The frontend will now handle all media composition.
    """
    logger.warning("⚠️ compile_video() skipped. Video compilation handled on frontend.")
    return None


# ────────────────────────────────
# Full-screen avatar composition (disabled)
# ────────────────────────────────
def compose_fullscreen_with_avatar(*args, **kwargs):
    """
    [DEPRECATED] - Previously merged visuals, text, and avatar into a single MP4.
    Disabled to move final video assembly to frontend.
    """
    logger.warning("⚠️ compose_fullscreen_with_avatar() skipped. Frontend handles assembly.")
    return None
