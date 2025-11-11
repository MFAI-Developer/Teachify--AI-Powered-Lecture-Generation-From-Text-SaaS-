# app/utils/tasks.py
"""
Lightweight task runner with optional Celery support.

Usage:
- Inline (default): runs tasks synchronously (good for dev)
- Threaded: runs tasks in a background thread pool
- Celery: if Celery is installed and broker is configured, tasks are enqueued to Celery

Configure via env:
  TASKS_DRIVER=inline | thread | celery
  CELERY_BROKER_URL=redis://localhost:6379/0
  CELERY_RESULT_BACKEND=redis://localhost:6379/0
"""

from __future__ import annotations
import os
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger("uvicorn")

TASKS_DRIVER = os.getenv("TASKS_DRIVER", "inline").lower()  # inline | thread | celery

# Optional Celery wiring
CELERY_AVAILABLE = False
celery_app = None
if TASKS_DRIVER == "celery":
    try:
        from celery import Celery

        broker_url = os.getenv("CELERY_BROKER_URL")
        backend_url = os.getenv("CELERY_RESULT_BACKEND", broker_url)
        if not broker_url:
            raise RuntimeError("CELERY_BROKER_URL not set")

        celery_app = Celery(
            "teachify",
            broker=broker_url,
            backend=backend_url,
            include=[],  # tasks registered dynamically below
        )
        CELERY_AVAILABLE = True
        logger.info("✅ Celery enabled for background tasks.")
    except Exception as e:
        logger.error(f"⚠️ Celery not available, falling back to inline: {e}")
        TASKS_DRIVER = "inline"

# Thread pool for lightweight background work (no external deps)
_thread_pool: Optional[ThreadPoolExecutor] = None
if TASKS_DRIVER == "thread":
    _thread_pool = ThreadPoolExecutor(max_workers=int(os.getenv("TASKS_THREADS", "4")))
    logger.info(f"✅ Threaded task runner enabled with {_thread_pool._max_workers} workers.")


def enqueue(func: Callable, *args: Any, **kwargs: Any) -> Any:
    """
    Enqueue a callable according to the configured driver.
    - inline: immediately executes and returns result
    - thread: schedules in a thread; returns a Future
    - celery: sends a Celery task; returns AsyncResult
    """
    if TASKS_DRIVER == "inline":
        logger.debug(f"▶️ Running task inline: {func.__name__}")
        return func(*args, **kwargs)

    if TASKS_DRIVER == "thread" and _thread_pool:
        logger.debug(f"🧵 Submitting task to thread pool: {func.__name__}")
        return _thread_pool.submit(func, *args, **kwargs)

    if TASKS_DRIVER == "celery" and CELERY_AVAILABLE and celery_app:
        # Wrap the function in a Celery task dynamically to avoid import cycles.
        task = celery_app.task(func, name=f"teachify.{func.__module__}.{func.__name__}")
        logger.debug(f"☁️ Sending task to Celery: {task.name}")
        return task.apply_async(args=args, kwargs=kwargs)

    # Fallback
    logger.debug(f"➡️ Fallback to inline for task: {func.__name__}")
    return func(*args, **kwargs)


# Convenience wrappers for your pipeline (optional sugar)
def enqueue_generate_visuals(content_dict: Dict) -> Any:
    """
    Enqueue visuals generation; returns result or async handle depending on driver.
    """
    from app.media.visuals import generate_visuals_for_content  # lazy import to avoid cycles
    return enqueue(generate_visuals_for_content, content_dict)


def enqueue_avatar_synthesis(text_chunks: list[str], avatar_character="Max", style="business") -> Any:
    """
    Enqueue Azure avatar synthesis (submit + poll + return result URL).
    """
    def _run():
        from app.media.avatar_azure import submit_synthesis_with_text, poll_job_and_get_result
        job_id = submit_synthesis_with_text(None, text_chunks, avatar_character=avatar_character, style=style)
        return poll_job_and_get_result(job_id)
    return enqueue(_run)


def enqueue_compose_video(avatar_path: str, content: Dict, visuals: list[Dict], out_path: str) -> Any:
    """
    Enqueue final composition; returns out_path or async handle depending on driver.
    """
    from app.media.compiler import compose_fullscreen_with_avatar
    return enqueue(compose_fullscreen_with_avatar, avatar_path, content, visuals, out_path)
