# CETLOE's Learning Integrity Checker

A voice-powered tool that verifies whether students truly understand the assignments they submit. Students upload their work, answer three voice questions from an AI coach, and receive an integrity score.

## Features

- **Dual AI Models**: Choose between Gemini AI (custom) or ElevenLabs Conversational AI
- **File Upload**: Supports PDF, DOCX, PPTX, and TXT (up to 8 MB)
- **Voice Conversation**: Real-time speech recognition and AI voice responses
- **Live Transcript**: See the conversation as it happens
- **Integrity Scoring**: 30-100 score based on how well students explain their own work
- **Modern UI**: Clean, minimal design with visual orb feedback

## Architecture

```
┌─────────────────────────┐         ┌─────────────────────────┐
│    React Frontend       │  HTTP   │    FastAPI Backend      │
│  (Vite + Web Speech)    │◄───────►│  (Python + Gemini)      │
└─────────────────────────┘         └─────────────────────────┘
         │                                   │
         ├── Web Speech API                  ├── Google Generative AI
         │   (voice recognition)             │   (questions + scoring)
         │                                   │
         ├── ElevenLabs SDK                  └── gTTS (text-to-speech)
         │   (conversational AI)
         │
         └── Audio playback (base64 MP3)
```

## AI Model Options

### Gemini AI (Default)
- Custom implementation using Google's Gemini API
- Backend handles conversation logic and scoring
- Uses Web Speech API for voice input
- gTTS for voice output

### ElevenLabs Conversational AI
- Uses ElevenLabs' conversational AI agent
- Real-time voice-to-voice conversation
- Custom orb visualization
- Live transcription
- Requires ElevenLabs agent setup (see below)

## Setup

### 1. Backend (Python)

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy env.example .env  # Windows
# cp env.example .env  # Mac/Linux

# Edit .env and add your Gemini API key
notepad .env
```

**Get a Gemini API key**: https://aistudio.google.com/app/apikey

### 2. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install
```

### 3. ElevenLabs Setup (Optional)

If you want to use the ElevenLabs model:

1. Create an account at https://elevenlabs.io
2. Go to **Conversational AI** → **Agents** → Create new agent
3. Copy the **Agent ID** and update it in `frontend/src/components/ElevenLabsPanel.jsx`
4. In agent settings → **Security** tab:
   - Enable **First message** override
   - Enable **System prompt** override
5. Set a default system prompt (will be overridden by the app):
   ```
   You are an AI coach verifying a student understands their submitted assignment.
   Ask 3 short, specific questions about their work, then give an integrity score.
   ```

## Running Locally

### Option 1: Using run.py (Recommended)

```bash
python run.py
```

This starts both backend and frontend automatically.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in Chrome (best speech recognition support).

## Usage Flow

1. **Upload**: Drag or select a PDF/DOCX/PPTX/TXT file
2. **Select Model**: Choose Gemini AI or ElevenLabs
3. **Start Q&A**: Click "Start Q&A" to begin the voice conversation
4. **Answer Questions**: The AI asks 3 questions about your assignment
5. **Get Results**: See your integrity score and review

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app + endpoints
│   ├── config.py            # Environment settings
│   ├── file_parser.py       # PDF/DOCX/PPTX extraction
│   ├── gemini_service.py    # Gemini AI integration
│   ├── tts_service.py       # Text-to-speech (gTTS)
│   ├── requirements.txt     # Python dependencies
│   └── env.example          # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   ├── styles.css       # Styling
│   │   ├── api.js           # API client
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx      # File upload + model selection
│   │   │   ├── ReadyPanel.jsx       # Pre-conversation screen
│   │   │   ├── InterviewPanel.jsx   # Gemini Q&A interface
│   │   │   ├── ElevenLabsPanel.jsx  # ElevenLabs Q&A interface
│   │   │   ├── ResultsPanel.jsx     # Score display
│   │   │   ├── Orb.jsx              # Visual orb component
│   │   │   └── ...
│   │   └── hooks/
│   │       ├── useSpeechRecognition.js  # Voice input hook
│   │       └── useAudioPlayer.js        # Audio playback hook
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
│
└── run.py                   # Start both servers
```

Set the `GEMINI_API_KEY` environment variable in your hosting dashboard.

### Frontend

Build and deploy the static frontend:

```bash
cd frontend
npm run build
```

## Browser Support

- **Chrome**: Full support (Web Speech API + ElevenLabs)
- **Edge**: Full support
- **Firefox**: ElevenLabs only (no Web Speech API)
- **Safari**: Partial support

## Troubleshooting

### ElevenLabs not connecting
- Check that overrides are enabled in agent Security settings
- Verify the Agent ID is correct
- Try in an incognito window to clear cache

### Speech recognition stops working
- Refresh the page
- Check microphone permissions
- Use Chrome for best support

### Score not showing correctly
- The AI should say "Your integrity score is X out of one hundred"
- Check console for "Extracting score from:" logs

## License

MIT
