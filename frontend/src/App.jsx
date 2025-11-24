import React, { useCallback, useState } from "react";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { uploadAssignment, submitAnswer } from "./api";
import { StepTracker } from "./components/StepTracker";
import { UploadPanel } from "./components/UploadPanel";
import { ReadyPanel } from "./components/ReadyPanel";
import { InterviewPanel } from "./components/InterviewPanel";
import { ResultsPanel } from "./components/ResultsPanel";
import { ConversationPanel } from "./components/ConversationPanel";

export default function App() {
  const [step, setStep] = useState("upload");
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

  const speech = useSpeechRecognition();
  const audio = useAudioPlayer();

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setUploadError("");
    setUploadStatus("uploading");
    setFileName(file.name);

    try {
      const data = await uploadAssignment(file);
      setSessionId(data.session_id);
      setQuestionNumber(data.question_number || 1);
      setPendingAudio(data.audio_base64);
      setPendingGreeting(data.text);
      setStep("ready");
      setUploadStatus("success");
    } catch (error) {
      setUploadError(error.message || "Failed to upload file");
      setUploadStatus("failed");
    }
  }, []);

  const startConversation = useCallback(async () => {
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
  }, [pendingAudio, pendingGreeting, audio, speech]);

  const handleSubmitAnswer = useCallback(async (answerText) => {
    if (!sessionId || !answerText.trim()) return;

    speech.stop();
    setIsProcessing(true);
    setConversation((prev) => [...prev, { role: "student", text: answerText }]);
    speech.reset();

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
        await audio.play(data.audio_base64);
        speech.start();
      }
    } catch (error) {
      setConversation((prev) => [...prev, { role: "ai", text: `Error: ${error.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, questionNumber, audio, speech]);

  const handleFinishAnswer = useCallback(() => {
    if (speech.transcript.trim()) {
      handleSubmitAnswer(speech.transcript);
    }
  }, [speech.transcript, handleSubmitAnswer]);

  const handleRestart = useCallback(() => {
    speech.stop();
    audio.stop();
    setStep("upload");
    setSessionId(null);
    setUploadStatus("idle");
    setUploadError("");
    setConversation([]);
    setQuestionNumber(0);
    setAnalysis(null);
    setPendingAudio(null);
    setPendingGreeting(null);
    setFileName("");
  }, [speech, audio]);

  const showConversation = step === "interview" || step === "results";

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Learning Integrity Checker</h1>
        <StepTracker currentStep={step} />
      </header>

      <main className="main">
        <div className="container">
          {step === "upload" && (
            <UploadPanel
              onFileSelected={handleFileUpload}
              status={uploadStatus}
              error={uploadError}
            />
          )}

          {step === "ready" && (
            <ReadyPanel fileName={fileName} onStart={startConversation} />
          )}

          {step === "interview" && (
            <InterviewPanel
              questionNumber={questionNumber}
              transcript={speech.transcript}
              isListening={speech.isListening}
              isSpeaking={audio.isSpeaking}
              isProcessing={isProcessing}
              micError={speech.error}
              onFinishAnswer={handleFinishAnswer}
            />
          )}

          {step === "results" && analysis && (
            <ResultsPanel analysis={analysis} onRestart={handleRestart} />
          )}

          {showConversation && (
            <ConversationPanel
              messages={conversation}
              currentTranscript={step === "interview" && speech.isListening ? speech.transcript : ""}
              isSpeaking={audio.isSpeaking}
              isListening={speech.isListening}
              isProcessing={isProcessing}
              analysis={analysis}
            />
          )}
        </div>
      </main>
    </div>
  );
}
