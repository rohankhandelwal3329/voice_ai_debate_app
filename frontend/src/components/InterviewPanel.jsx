import React from "react";
import { CheckIcon } from "./Icons";

export function InterviewPanel({
  questionNumber,
  transcript,
  isListening,
  isSpeaking,
  isProcessing,
  micError,
  onFinishAnswer,
}) {
  const hasAnswer = transcript.trim().length > 0;
  const canFinish = hasAnswer && isListening && !isSpeaking && !isProcessing;

  return (
    <div className="card interview-card">
      <div className="question-header">
        <span className="question-badge">Question {questionNumber}/3</span>
        {isSpeaking && <span className="status-badge speaking">AI Speaking</span>}
        {isListening && !isSpeaking && <span className="status-badge listening">Listening</span>}
        {isProcessing && <span className="status-badge processing">Processing</span>}
      </div>

      <div className="transcript-area">
        <p className="transcript-label">Your answer</p>
        <div className="transcript-content">
          {transcript || (isListening ? "Start speaking..." : "Waiting for AI...")}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-finish"
        onClick={onFinishAnswer}
        disabled={!canFinish}
      >
        <CheckIcon />
        Done
      </button>

      {micError && <p className="error">{micError}</p>}
    </div>
  );
}
