import os
import json
import urllib.request
import zipfile
from vosk import Model, KaldiRecognizer

MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
MODEL_DIR = "vosk-model"
MODEL_PATH = os.path.join(os.path.dirname(__file__), MODEL_DIR)

_model = None


def download_model():
    """Download and extract Vosk model if not present."""
    if os.path.exists(MODEL_PATH) and os.listdir(MODEL_PATH):
        print(f"Vosk model already exists at {MODEL_PATH}")
        return
    
    print("Downloading Vosk speech recognition model (~40MB)...")
    print("This only happens once.")
    
    zip_path = MODEL_PATH + ".zip"
    
    # Download
    urllib.request.urlretrieve(MODEL_URL, zip_path)
    print("Download complete. Extracting...")
    
    # Extract
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(os.path.dirname(__file__))
    
    # Rename extracted folder
    extracted_name = "vosk-model-small-en-us-0.15"
    extracted_path = os.path.join(os.path.dirname(__file__), extracted_name)
    if os.path.exists(extracted_path):
        os.rename(extracted_path, MODEL_PATH)
    
    # Clean up zip
    os.remove(zip_path)
    print("Vosk model ready!")


def get_model():
    """Get or initialize the Vosk model."""
    global _model
    if _model is None:
        download_model()
        _model = Model(MODEL_PATH)
    return _model


def create_recognizer(sample_rate=16000):
    """Create a new Kaldi recognizer instance."""
    model = get_model()
    recognizer = KaldiRecognizer(model, sample_rate)
    recognizer.SetWords(True)
    return recognizer


class VoskTranscriber:
    """Handles streaming audio transcription."""
    
    def __init__(self, sample_rate=16000):
        self.recognizer = create_recognizer(sample_rate)
        self.final_text = ""
    
    def process_audio(self, audio_data: bytes) -> dict:
        """
        Process audio chunk and return transcription result.
        
        Returns:
            dict with 'partial' (interim) or 'text' (final) transcription
        """
        if self.recognizer.AcceptWaveform(audio_data):
            result = json.loads(self.recognizer.Result())
            if result.get("text"):
                self.final_text += result["text"] + " "
            return {
                "type": "final",
                "text": result.get("text", ""),
                "full_transcript": self.final_text.strip()
            }
        else:
            result = json.loads(self.recognizer.PartialResult())
            return {
                "type": "partial",
                "text": result.get("partial", ""),
                "full_transcript": (self.final_text + result.get("partial", "")).strip()
            }
    
    def get_final_result(self) -> str:
        """Get the final transcription after audio stream ends."""
        result = json.loads(self.recognizer.FinalResult())
        if result.get("text"):
            self.final_text += result["text"]
        return self.final_text.strip()
    
    def reset(self):
        """Reset the transcriber for a new session."""
        self.recognizer = create_recognizer()
        self.final_text = ""

