import React, { useCallback, useState, useEffect } from "react";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { uploadAssignment, submitAnswer } from "./api";
import { StepTracker } from "./components/StepTracker";
import { UploadPanel } from "./components/UploadPanel";
import { ReadyPanel } from "./components/ReadyPanel";
import { GeminiPanel } from "./components/GeminiPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { ElevenLabsPanel } from "./components/ElevenLabsPanel";
import { SettingsModal, loadSettings, hasConfiguredKeys } from "./components/SettingsModal";
import { SettingsIcon } from "./components/Icons";

export default function App() {
  const [step, setStep] = useState("upload");
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [sessionId, setSessionId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadError, setUploadError] = useState("");
  const [conversation, setConversation] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [pendingAudio, setPendingAudio] = useState(null);
  const [pendingGreeting, setPendingGreeting] = useState(null);
  const [fileName, setFileName] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionAudio, setCurrentQuestionAudio] = useState("");
  const [assignmentText, setAssignmentText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [keysConfigured, setKeysConfigured] = useState(hasConfiguredKeys());

  const speech = useSpeechRecognition();
  const audio = useAudioPlayer();

  // Show settings modal on first use if no API keys are configured
  useEffect(() => {
    if (!hasConfiguredKeys()) {
      setShowSettings(true);
    }
  }, []);

  // Check if keys are configured when settings modal closes
  useEffect(() => {
    if (!showSettings) {
      setKeysConfigured(hasConfiguredKeys());
    }
  }, [showSettings]);

  const handleModelChange = useCallback((model) => {
    setSelectedModel(model);
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setUploadError("");
    setUploadStatus("uploading");
    setFileName(file.name);

    try {
      const settings = loadSettings();
      const data = await uploadAssignment(file, settings);
      setSessionId(data.session_id);
      setAssignmentText(data.assignment_text || "");
      
      if (selectedModel === "gemini") {
        setQuestionNumber(data.question_number || 1);
        setPendingAudio(data.audio_base64);
        setPendingGreeting(data.text);
        setCurrentQuestion(data.text);
        setCurrentQuestionAudio(data.audio_base64);
      }
      
      setStep("ready");
      setUploadStatus("success");
    } catch (error) {
      setUploadError(error.message || "Failed to upload file");
      setUploadStatus("failed");
    }
  }, [selectedModel]);

  const startConversation = useCallback(async () => {
    if (selectedModel === "elevenlabs") {
      setStep("interview");
      return;
    }

    // Gemini flow
    if (pendingGreeting) {
      setConversation([{ role: "ai", text: pendingGreeting }]);
      setPendingGreeting(null);
    }
    setStep("interview");
    
    if (pendingAudio) {
      await audio.play(pendingAudio);
      setPendingAudio(null);
    }
    
    speech.start();
  }, [selectedModel, pendingAudio, pendingGreeting, audio, speech]);

  const handleSubmitAnswer = useCallback(async (answerText) => {
    if (!sessionId || !answerText.trim()) return;

    speech.stop();
    setIsProcessing(true);
    setConversation((prev) => [...prev, { role: "student", text: answerText }]);

    try {
      const data = await submitAnswer(sessionId, answerText);
      setConversation((prev) => [...prev, { role: "ai", text: data.text }]);

      if (data.message_type === "review") {
        setAnalysis({
          finalScore: data.score,
          review: data.text,
          observations: data.observations || [],
          confidenceTag: data.score >= 85 ? "Likely original" : data.score >= 65 ? "Probably student-made" : "Needs verification",
        });
        setStep("results");
        await audio.play(data.audio_base64);
      } else {
        setQuestionNumber(data.question_number || questionNumber + 1);
        setCurrentQuestion(data.text);
        setCurrentQuestionAudio(data.audio_base64);
        
        await audio.play(data.audio_base64);
        speech.start();
      }
    } catch (error) {
      setConversation((prev) => [...prev, { role: "ai", text: `Error: ${error.message}` }]);
      speech.start();
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, questionNumber, audio, speech]);

  const handleFinishAnswer = useCallback(() => {
    if (speech.transcript.trim()) {
      handleSubmitAnswer(speech.transcript);
    }
  }, [speech.transcript, handleSubmitAnswer]);

  const handleRepeatQuestion = useCallback(async () => {
    if (currentQuestionAudio) {
      speech.stop();
      await audio.play(currentQuestionAudio);
      speech.start();
    }
  }, [currentQuestionAudio, audio, speech]);

  const handleRetryAnswer = useCallback(() => {
    speech.reset();
  }, [speech]);

  const handleElevenLabsComplete = useCallback((result) => {
    console.log("ElevenLabs complete result:", result);
    const score = result?.score || 75;
    
    setAnalysis({
      finalScore: score,
      review: result?.review || "Conversation completed.",
      observations: result?.observations || [],
      confidenceTag: score >= 85 ? "Likely original" : score >= 65 ? "Probably student-made" : "Needs verification",
    });
    setStep("results");
  }, []);

  const handleRestart = useCallback(() => {
    speech.stop();
    audio.stop();
    setStep("upload");
    setSelectedModel("gemini");
    setSessionId(null);
    setUploadStatus("idle");
    setUploadError("");
    setConversation([]);
    setQuestionNumber(0);
    setAnalysis(null);
    setPendingAudio(null);
    setPendingGreeting(null);
    setFileName("");
    setCurrentQuestion("");
    setCurrentQuestionAudio("");
    setAssignmentText("");
  }, [speech, audio]);

  const isGemini = selectedModel === "gemini";

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">CETLOE's Learning Integrity Checker</h1>
        <div className="header-right">
          <StepTracker currentStep={step} />
          <button 
            className={`settings-button ${keysConfigured ? 'configured' : ''}`}
            onClick={() => setShowSettings(true)}
            title={keysConfigured ? "Settings (API keys configured)" : "Settings (API keys not configured)"}
          >
            <SettingsIcon size={20} />
            {keysConfigured && <span className="settings-badge">✓</span>}
          </button>
        </div>
      </header>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      <main className="main">
        <div className="container">
          {step === "upload" && (
            <UploadPanel
              onFileSelected={handleFileUpload}
              status={uploadStatus}
              error={uploadError}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
          )}

          {step === "ready" && (
            <ReadyPanel 
              fileName={fileName} 
              onStart={startConversation}
              modelName={selectedModel === "gemini" ? "Gemini AI" : "ElevenLabs"}
            />
          )}

          {step === "interview" && isGemini && (
            <GeminiPanel
              questionNumber={questionNumber}
              currentQuestion={currentQuestion}
              transcript={speech.transcript}
              isListening={speech.isListening && !audio.isSpeaking}
              isSpeaking={audio.isSpeaking}
              isProcessing={isProcessing}
              micError={speech.error}
              conversation={conversation}
              onFinishAnswer={handleFinishAnswer}
              onRepeatQuestion={handleRepeatQuestion}
              onRetryAnswer={handleRetryAnswer}
              onCancel={handleRestart}
            />
          )}

          {step === "interview" && !isGemini && (
            <ElevenLabsPanel
              assignmentText={assignmentText}
              fileName={fileName}
              onComplete={handleElevenLabsComplete}
              onRestart={handleRestart}
            />
          )}

          {step === "results" && analysis && (
            <ResultsPanel analysis={analysis} onRestart={handleRestart} />
          )}
        </div>
      </main>
    </div>
  );
}
