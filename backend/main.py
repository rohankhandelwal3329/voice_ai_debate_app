import uuid
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from file_parser import parse_file
from gemini_service import GeminiService
from tts_service import text_to_speech_base64
from vosk_service import VoskTranscriber, get_model

app = FastAPI(title="Assignment Authenticity Checker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage (use Redis/DB for production)
sessions: dict = {}


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


class SessionResponse(BaseModel):
    session_id: str
    message_type: str  # "question" or "review"
    text: str
    audio_base64: str
    question_number: Optional[int] = None
    score: Optional[int] = None
    observations: Optional[list] = None


@app.on_event("startup")
async def startup_event():
    """Pre-load Vosk model on startup."""
    print("Loading Vosk speech recognition model...")
    get_model()
    print("Vosk model loaded!")


@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket endpoint for real-time speech transcription.
    
    Client sends: raw audio bytes (16-bit PCM, 16kHz, mono)
    Server sends: JSON with transcription updates
    """
    await websocket.accept()
    transcriber = VoskTranscriber(sample_rate=16000)
    
    try:
        while True:
            # Receive audio data
            data = await websocket.receive_bytes()
            
            # Process audio and get transcription
            result = transcriber.process_audio(data)
            
            # Send transcription update to client
            await websocket.send_json(result)
            
    except WebSocketDisconnect:
        # Client disconnected, get final result
        final_text = transcriber.get_final_result()
        print(f"Transcription session ended. Final: {final_text}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        pass


@app.post("/api/upload", response_model=SessionResponse)
async def upload_assignment(file: UploadFile = File(...)):
    """Upload an assignment file and start the interview session."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_extensions = {"pdf", "docx", "pptx", "txt"}
    ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 8MB.")

    try:
        assignment_text = parse_file(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    if len(assignment_text.split()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Assignment too short. Need at least 50 words."
        )

    # Start Gemini session
    try:
        gemini = GeminiService()
        response = gemini.start_session(assignment_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    session_id = str(uuid.uuid4())
    question_text = response.get("text", "")

    # Generate audio
    try:
        audio_base64 = text_to_speech_base64(question_text)
    except Exception:
        audio_base64 = ""

    # Store session
    sessions[session_id] = {
        "assignment_text": assignment_text,
        "conversation": [{"role": "ai", "text": question_text}],
        "question_number": 1,
    }

    return SessionResponse(
        session_id=session_id,
        message_type="question",
        text=question_text,
        audio_base64=audio_base64,
        question_number=1,
    )


@app.post("/api/answer", response_model=SessionResponse)
async def submit_answer(request: AnswerRequest):
    """Submit a student answer and get the next question or final review."""
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Add student answer to conversation
    session["conversation"].append({"role": "student", "text": request.answer})

    # Get next response from Gemini
    try:
        gemini = GeminiService()
        response = gemini.process_answer(
            assignment_text=session["assignment_text"],
            conversation_history=session["conversation"],
            answer=request.answer,
            question_number=session["question_number"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    response_type = response.get("type", "question")
    response_text = response.get("text") or response.get("review", "")

    # Generate audio
    try:
        audio_base64 = text_to_speech_base64(response_text)
    except Exception:
        audio_base64 = ""

    # Update session
    session["conversation"].append({"role": "ai", "text": response_text})

    if response_type == "review":
        # Clean up session after review
        del sessions[request.session_id]
        return SessionResponse(
            session_id=request.session_id,
            message_type="review",
            text=response_text,
            audio_base64=audio_base64,
            score=response.get("score"),
            observations=response.get("observations", []),
        )
    else:
        session["question_number"] += 1
        return SessionResponse(
            session_id=request.session_id,
            message_type="question",
            text=response_text,
            audio_base64=audio_base64,
            question_number=session["question_number"],
        )


@app.get("/api/session/{session_id}/transcript")
async def get_transcript(session_id: str):
    """Get the current conversation transcript."""
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"conversation": session["conversation"]}


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
