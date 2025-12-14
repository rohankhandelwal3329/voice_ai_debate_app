import io
import base64
import os
import requests
from config import get_settings

# ElevenLabs voice IDs - you can change this to any voice from their library
# Some good options:
# - "21m00Tcm4TlvDq8ikWAM" - Rachel (calm, professional female)
# - "EXAVITQu4vr4xnSDxMaL" - Bella (friendly female)
# - "ErXwobaYiN019PkySvjV" - Antoni (friendly male)
# - "VR6AewLTigWG4xSOukaG" - Arnold (deep male)
# - "pNInz6obpgDQGcFmaJgB" - Adam (professional male)
ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Bella - friendly and natural

# Model options:
# - "eleven_multilingual_v2" - highest quality
# - "eleven_turbo_v2_5" - faster, still good quality
# - "eleven_flash_v2_5" - fastest, lowest latency
ELEVENLABS_MODEL = "eleven_turbo_v2_5"


def text_to_speech_base64(text: str, lang: str = "en", elevenlabs_api_key: str = None) -> str:
    """Convert text to speech using ElevenLabs and return as base64-encoded MP3."""
    settings = get_settings()
    
    # Use provided key or fall back to settings
    api_key = elevenlabs_api_key or settings.elevenlabs_api_key
    
    # Try ElevenLabs first if API key is available
    if api_key:
        try:
            return _elevenlabs_tts(text, api_key)
        except Exception as e:
            print(f"ElevenLabs TTS failed, falling back to gTTS: {e}")
    
    # Fallback to gTTS
    return _gtts_fallback(text, lang)


def _elevenlabs_tts(text: str, api_key: str) -> str:
    """Use ElevenLabs API for high-quality TTS."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
    
    # Convert audio bytes to base64
    return base64.b64encode(response.content).decode("utf-8")


def _gtts_fallback(text: str, lang: str = "en") -> str:
    """Fallback to gTTS if ElevenLabs is not available."""
    from gtts import gTTS
    
    tts = gTTS(text=text, lang=lang)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    return base64.b64encode(audio_buffer.read()).decode("utf-8")
