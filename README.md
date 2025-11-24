# Assignment Authenticity Checker

A voice-powered tool that verifies whether students truly understand the assignments they submit. Students upload their work, answer three voice questions from an AI coach (powered by Gemini), and receive an integrity score.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   React Frontend    │  HTTP   │   FastAPI Backend   │
│  (Vite + Browser    │◄───────►│  (Python + Gemini)  │
│   Speech API)       │         │                     │
└─────────────────────┘         └─────────────────────┘
         │                               │
         │ Web Speech API                │ Google Generative AI
         │ (recognition)                 │ (questions + scoring)
         │                               │
         │ Audio playback                │ gTTS
         │ (base64 MP3)                  │ (text-to-speech)
```

## Features

- **File upload**: Supports PDF, DOCX, PPTX, and TXT (up to 8 MB)
- **Voice conversation**: Browser-based speech recognition + server-side TTS
- **Gemini-powered questions**: AI generates adaptive questions based on the assignment content
- **Live transcript**: Real-time display of the conversation
- **Integrity scoring**: 0-100 score based on concept coverage, depth, and authenticity signals
- **Fallback to text**: Students can type answers if voice doesn't work

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
# From project root
npm install

# Create .env file for API URL (optional, defaults to localhost:8000)
echo VITE_API_URL=http://localhost:8000 > .env
```

## Running Locally

### Start the backend

```bash
cd backend
venv\Scripts\activate  # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start the frontend

```bash
# From project root (new terminal)
npm run dev
```

Open http://localhost:5173 in Chrome (best speech recognition support).

## Usage Flow

1. **Upload**: Drag or select a PDF/DOCX/PPTX/TXT file
2. **Listen**: AI coach greets you and asks the first question (plays audio)
3. **Speak**: Click the mic button and answer verbally (or switch to text input)
4. **Repeat**: Answer two more questions
5. **Review**: See your integrity score and feedback

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload assignment file, returns first question |
| `/api/answer` | POST | Submit answer, returns next question or final review |
| `/api/session/{id}/transcript` | GET | Get conversation history |
| `/api/health` | GET | Health check |

## Deployment

### Backend

Deploy the FastAPI backend to any Python hosting service:
- **Railway**: `railway up`
- **Render**: Connect repo, set `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Fly.io**: `fly launch`

Set the `GEMINI_API_KEY` environment variable in your hosting dashboard.

### Frontend

Build and deploy the static frontend:

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting

Set `VITE_API_URL` to your deployed backend URL before building.

## Project Structure

```
├── backend/
│   ├── main.py           # FastAPI app + endpoints
│   ├── config.py         # Environment settings
│   ├── file_parser.py    # PDF/DOCX/PPTX extraction
│   ├── gemini_service.py # Gemini AI integration
│   ├── tts_service.py    # Text-to-speech (gTTS)
│   ├── requirements.txt  # Python dependencies
│   └── env.example       # Environment template
├── src/
│   ├── App.jsx           # React app with voice UI
│   ├── styles.css        # Dark theme styles
│   └── index.jsx         # Entry point
├── package.json          # Node dependencies
└── vite.config.js        # Vite configuration
```

## Browser Support

- **Chrome**: Full support (Web Speech API)
- **Edge**: Full support
- **Firefox**: Text input only (no speech recognition)
- **Safari**: Partial support

## License

MIT
