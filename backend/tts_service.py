import io
import base64
from gtts import gTTS


def text_to_speech_base64(text: str, lang: str = "en") -> str:
    """Convert text to speech and return as base64-encoded MP3."""
    tts = gTTS(text=text, lang=lang)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    return base64.b64encode(audio_buffer.read()).decode("utf-8")

