import React, { useRef, useState, useEffect } from "react";
import { UploadIcon } from "./Icons";

const ACCEPTED_INPUTS = ".pdf,.docx,.pptx,.txt";

const AI_MODELS = [
  { id: "gemini", name: "Gemini AI", description: "Google's Gemini with text-to-speech", disabled: false },
  { id: "elevenlabs", name: "ElevenLabs", description: "Coming soon — under development", disabled: true },
];

// Detect if browser supports speech recognition (Chrome only)
function getBrowserInfo() {
  const ua = navigator.userAgent;
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
  const isEdge = /Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  
  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  return {
    isSupported: isChrome, // Only Chrome is fully supported
    hasSpeechRecognition,
    browserName: isChrome ? 'Chrome' : isEdge ? 'Edge' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown'
  };
}

export function UploadPanel({ onFileSelected, status, error, selectedModel, onModelChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [browserInfo, setBrowserInfo] = useState(null);

  useEffect(() => {
    const info = getBrowserInfo();
    setBrowserInfo(info);
    if (!info.isSupported) {
      setShowBrowserWarning(true);
    }
  }, []);

  const handleFile = (file) => {
    if (file) onFileSelected(file);
  };

  const disabled = status === "uploading";

  return (
    <div className="card upload-card">
      {/* Browser Warning Modal */}
      {showBrowserWarning && (
        <div className="browser-warning-overlay">
          <div className="browser-warning-modal">
            <div className="browser-warning-icon">⚠️</div>
            <h3>Browser Recommendation</h3>
            <p>
              For the best experience with voice features, please use 
              <strong> Google Chrome</strong>.
            </p>
            <p className="browser-warning-detail">
              You're currently using <strong>{browserInfo?.browserName || 'an unsupported browser'}</strong>.
              {!browserInfo?.hasSpeechRecognition && (
                <span> Speech recognition may not work properly.</span>
              )}
            </p>
            <div className="browser-warning-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setShowBrowserWarning(false)}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Selector */}
      <div className="model-selector">
        <p className="model-label">Select AI Model</p>
        <div className="model-options">
          {AI_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              className={`model-option ${selectedModel === model.id ? "selected" : ""} ${model.disabled ? "model-disabled" : ""}`}
              onClick={() => !model.disabled && onModelChange(model.id)}
              disabled={disabled || model.disabled}
            >
              <span className="model-name">
                {model.name}
                {model.disabled && <span className="coming-soon-badge">Coming Soon</span>}
              </span>
              <span className="model-desc">{model.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* File Upload */}
      <div
        className={`dropzone ${isDragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer?.files?.[0]);
        }}
      >
        <div className="upload-icon">
          <UploadIcon />
        </div>
        <h2>Upload your assignment</h2>
        <p className="hint">PDF, DOCX, PPTX, or TXT up to 8 MB</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {status === "uploading" ? "Uploading..." : "Select file"}
        </button>
        <p className="hint-small">or drag and drop</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_INPUTS}
          style={{ display: "none" }}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
