import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from file_parser import parse_file
from gemini_service import GeminiService
from tts_service import text_to_speech_base64
from config import get_settings

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
    assignment_text: Optional[str] = None


@app.post("/api/upload", response_model=SessionResponse)
async def upload_assignment(
    file: UploadFile = File(...),
    gemini_api_key: Optional[str] = Form(None),
    elevenlabs_api_key: Optional[str] = Form(None),
    custom_prompt: Optional[str] = Form(None),
    num_questions: Optional[int] = Form(None),
):
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

    # Start Gemini session with custom settings
    try:
        gemini = GeminiService(api_key=gemini_api_key)
        response = gemini.start_session(
            assignment_text, 
            custom_prompt=custom_prompt,
            num_questions=num_questions or 3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    session_id = str(uuid.uuid4())
    question_text = response.get("text", "")

    # Generate audio with custom ElevenLabs key if provided
    try:
        audio_base64 = text_to_speech_base64(question_text, elevenlabs_api_key=elevenlabs_api_key)
    except Exception:
        audio_base64 = ""

    # Store session with custom settings
    sessions[session_id] = {
        "assignment_text": assignment_text,
        "conversation": [{"role": "ai", "text": question_text}],
        "question_number": 1,
        "custom_prompt": custom_prompt,
        "num_questions": num_questions or 3,
        "gemini_api_key": gemini_api_key,
        "elevenlabs_api_key": elevenlabs_api_key,
    }

    return SessionResponse(
        session_id=session_id,
        message_type="question",
        text=question_text,
        audio_base64=audio_base64,
        question_number=1,
        assignment_text=assignment_text[:3000],  # Send first 3000 chars for ElevenLabs context
    )


@app.post("/api/answer", response_model=SessionResponse)
async def submit_answer(
    request: AnswerRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    x_elevenlabs_api_key: Optional[str] = Header(None),
):
    """Submit a student answer and get the next question or final review."""
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Use API keys from headers or session
    gemini_api_key = x_gemini_api_key or session.get("gemini_api_key")
    elevenlabs_api_key = x_elevenlabs_api_key or session.get("elevenlabs_api_key")

    # Add student answer to conversation
    session["conversation"].append({"role": "student", "text": request.answer})

    # Get next response from Gemini
    try:
        gemini = GeminiService(api_key=gemini_api_key)
        response = gemini.process_answer(
            assignment_text=session["assignment_text"],
            conversation_history=session["conversation"],
            answer=request.answer,
            question_number=session["question_number"],
            custom_prompt=session.get("custom_prompt"),
            num_questions=session.get("num_questions", 3),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    response_type = response.get("type", "question")
    response_text = response.get("text") or response.get("review", "")

    # Generate audio with custom ElevenLabs key if provided
    try:
        audio_base64 = text_to_speech_base64(response_text, elevenlabs_api_key=elevenlabs_api_key)
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

