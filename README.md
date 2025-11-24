# Voice AI Debate App

A modern, dark-mode-only React application for AI-powered debates, featuring a live animated orb and real-time transcription using the ElevenLabs API.

## Features
- **Dark Mode Only:** Clean, distraction-free interface.
- **Live Animated Orb:** Visually reacts to user and AI speaking states.
- **Real-Time Transcription:** See the transcript update live as you or the AI speak.
- **Modular Codebase:** All major UI sections are separated into reusable React components.
- **No Theme Switching:** The app is always in dark mode for consistency.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
1. Clone this repository:
   ```sh
   git clone <your-repo-url>
   cd voice_ai_debate_app
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Add your ElevenLabs Agent ID in `src/App.jsx` (`AGENT_ID` constant).

### Running the App
```sh
npm run dev
# or
yarn dev
```
Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Usage
- Enter your details to begin.
- Click "Let's Debate" to start the session.
- Speak or interact with the AI; the orb animates and the transcript updates live.

## Project Structure
- `src/App.jsx` – Main app logic
- `src/components/Orb.jsx` – Animated orb
- `src/components/UserInfoForm.jsx` – User info form
- `src/components/LiveTranscript.jsx` – Transcript display
- `src/styles.css` – App-wide dark theme styles

## License
MIT


A static React app that lets students debate with an AI using ElevenLabs voice SDK. Stores live transcript and provides feedback on command.

## Setup
1. Clone repo
2. Create `.env` file with `REACT_APP_AGENT_ID`
3. Run `npm install`
4. Build with `npm run build` to deploy static files