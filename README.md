# CETLOE's Learning Integrity Checker

A voice-powered tool that verifies whether students truly understand the assignments they submit. Students upload their work, answer three voice questions from an AI coach, and receive an integrity score.

## Features

- **Dual AI Models**: Choose between Gemini AI or ElevenLabs Conversational AI
- **File Upload**: Supports PDF, DOCX, PPTX, and TXT (up to 8 MB)
- **Voice Conversation**: Real-time speech recognition and natural AI voice responses
- **Live Transcript**: See the conversation as it happens
- **Integrity Scoring**: Precise scores (30-100) based on how well students explain their work
- **Modern UI**: Clean, minimal design with interactive audio-reactive orb
- **High-Quality TTS**: Optional ElevenLabs text-to-speech for natural voice output

## AI Model Options

### Gemini AI (Default)
- Custom implementation using Google's Gemini 2.5 Flash API
- Backend handles conversation logic and scoring
- Uses Web Speech API for voice input
- ElevenLabs TTS for natural voice output (or gTTS fallback)
- Audio-reactive orb visualization

### ElevenLabs Conversational AI
- Uses ElevenLabs' conversational AI agent
- Real-time voice-to-voice conversation
- Live transcription from ElevenLabs
- Custom audio-reactive orb visualization
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

# Edit .env and add your API keys
notepad .env
```

### 2. Environment Variables

Create a `.env` file in the `backend/` folder with:

```env
# Required: Google Gemini API key for Q&A
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: ElevenLabs API key for high-quality TTS (Gemini voice)
# Get your free API key at: https://elevenlabs.io
# Free tier: 10,000 characters/month
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Required for ElevenLabs model: Conversational AI Agent ID
# Create an agent at: https://elevenlabs.io/app/conversational-ai
ELEVENLABS_AGENT_ID=your_agent_id_here
```

**Get API Keys:**
- Gemini: https://aistudio.google.com/app/apikey
- ElevenLabs: https://elevenlabs.io (free tier available)

### 3. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install
```

### 4. ElevenLabs Agent Setup (For ElevenLabs Model)

If you want to use the ElevenLabs conversational AI model:

1. Create an account at https://elevenlabs.io
2. Go to **Conversational AI** → **Agents** → Create new agent
3. Copy the **Agent ID** and add it to your `.env` file as `ELEVENLABS_AGENT_ID`
4. In agent settings → **Security** tab:
   - Enable **First message** override
   - Enable **System prompt** override
5. In agent settings → **Advanced** tab:
   - Enable **User transcripts** for live transcription
6. Set a default system prompt (will be overridden by the app):
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
5. **Get Results**: See your integrity score (30-100) and review

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app + endpoints
│   ├── config.py            # Environment settings
│   ├── file_parser.py       # PDF/DOCX/PPTX extraction
│   ├── gemini_service.py    # Gemini AI integration
│   ├── tts_service.py       # Text-to-speech (ElevenLabs/gTTS)
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
│   │   │   ├── GeminiPanel.jsx      # Gemini Q&A interface
│   │   │   ├── ElevenLabsPanel.jsx  # ElevenLabs Q&A interface
│   │   │   ├── ResultsPanel.jsx     # Score display
│   │   │   ├── Orb.jsx              # Audio-reactive orb component
│   │   │   ├── StepTracker.jsx      # Progress indicator
│   │   │   └── Icons.jsx            # SVG icons
│   │   └── hooks/
│   │       ├── useSpeechRecognition.js  # Voice input hook
│   │       └── useAudioPlayer.js        # Audio playback hook
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
│
└── run.py                   # Start both servers
```

## Browser Support

- **Chrome**: Full support (Web Speech API + ElevenLabs)
- **Edge**: Full support
- **Firefox**: ElevenLabs only (no Web Speech API)
- **Safari**: Partial support

## Troubleshooting

### ElevenLabs not connecting
- Ensure `ELEVENLABS_AGENT_ID` is set in your `.env` file
- Check that overrides are enabled in agent Security settings

### Speech recognition stops working
- Refresh the page
- Check microphone permissions
- Use Chrome for best support

### Changing the Gemini TTS Voice

Edit `backend/tts_service.py` to change the ElevenLabs voice:

```python
# Some voice options:
# - "EXAVITQu4vr4xnSDxMaL" - Bella (friendly female) - default
# - "21m00Tcm4TlvDq8ikWAM" - Rachel (calm female)
# - "ErXwobaYiN019PkySvjV" - Antoni (friendly male)
# - "pNInz6obpgDQGcFmaJgB" - Adam (professional male)
ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"
```
