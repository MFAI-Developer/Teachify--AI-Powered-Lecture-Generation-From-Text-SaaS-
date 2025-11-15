# app/media/audio.py
import os
from gtts import gTTS
from app.config import settings


# from app.utils.storage import save_file_local # <-- Removed unused import

def tts_gtts(text: str, filename: str) -> str:
    # Ensure static dirs exist
    os.makedirs("static/audios", exist_ok=True)  # <-- ADDED

    safe = filename.replace(" ", "_")[:100]
    out_path = f"static/audios/{safe}.mp3"

    tts = gTTS(text=text, lang='en')
    tts.save(out_path)
    return out_path


def generate_audio(content: dict, filename: str = "lecture"):
    text = ". ".join([
        content.get("topic", ""),
        content.get("introduction", ""),
        content.get("main_body", ""),
        content.get("conclusion", "")
    ])
    if settings.tts_provider == "gtts":
        return tts_gtts(text, filename)
    # add other providers (AWS Polly, OpenAI TTS) here
    return tts_gtts(text, filename)