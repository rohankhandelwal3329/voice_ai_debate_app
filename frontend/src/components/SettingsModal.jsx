import React, { useState, useEffect } from "react";
import { CloseIcon, KeyIcon } from "./Icons";

const DEFAULT_PROMPT = `You are an AI coach verifying a student understands their submitted assignment.

RULES:
1. Ask SHORT, SPECIFIC questions directly referencing their actual content.
2. Ask exactly 3 questions, ONE at a time. Wait for each answer.
3. Questions must be CONCISE (1-2 sentences max) and reference SPECIFIC parts of their work.

AFTER 3 ANSWERS:
Give a brief review (2 sentences) and assign an integrity score from 30-100.
- 95-100: Exceptional understanding with detailed explanations
- 85-94: Strong understanding with specific details
- 75-84: Adequate understanding, some hesitation
- 65-74: Basic recall, struggles to elaborate
- 50-64: Limited understanding
- 30-49: Cannot demonstrate genuine understanding`;

const STORAGE_KEY = "integrity_checker_settings";

// Load settings from localStorage
export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return {
    geminiApiKey: "",
    elevenlabsApiKey: "",
    customPrompt: DEFAULT_PROMPT,
    numberOfQuestions: 3,
  };
}

// Save settings to localStorage
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// Check if API keys are configured
export function hasConfiguredKeys() {
  const settings = loadSettings();
  return !!settings.geminiApiKey;
}

export function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("api");
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  
  // Check if setup is needed (no API key configured)
  const needsSetup = !settings.geminiApiKey;

  useEffect(() => {
    if (isOpen) {
      const currentSettings = loadSettings();
      setSettings(currentSettings);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const resetSettings = {
      geminiApiKey: "",
      elevenlabsApiKey: "",
      customPrompt: DEFAULT_PROMPT,
      numberOfQuestions: 3,
    };
    setSettings(resetSettings);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={needsSetup ? undefined : handleClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{needsSetup ? "Setup Required" : "Settings"}</h2>
          {!needsSetup && (
            <button className="settings-close" onClick={handleClose}>
              <CloseIcon size={24} />
            </button>
          )}
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === "api" ? "active" : ""}`}
            onClick={() => setActiveTab("api")}
          >
            <KeyIcon size={16} />
            API Keys
          </button>
          <button
            className={`settings-tab ${activeTab === "prompt" ? "active" : ""}`}
            onClick={() => setActiveTab("prompt")}
          >
            AI Prompt
          </button>
        </div>

        <div className="settings-content">
          {activeTab === "api" && (
            <div className="settings-section">
              {needsSetup && (
                <div className="welcome-banner">
                  <h3>🔑 API Key Required</h3>
                  <p>To use this app, you need a Gemini API key. It's free and only takes a minute to get. Your key will be saved in your browser.</p>
                </div>
              )}
              
              <div className="settings-info">
                <p>🔒 API keys are stored securely in your browser's local storage. They persist across sessions — <strong>you only need to enter them once</strong>.</p>
              </div>

              <div className="settings-field">
                <label>
                  Gemini API Key
                  {settings.geminiApiKey && <span className="configured-badge">✓ Configured</span>}
                </label>
                <p className="field-hint">Required for Q&A functionality. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></p>
                <div className="input-with-toggle">
                  <input
                    type={showGeminiKey ? "text" : "password"}
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    placeholder={settings.geminiApiKey ? "••••••••••••••••" : "Enter your Gemini API key"}
                    className={settings.geminiApiKey ? "has-value" : ""}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {showGeminiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <label>
                  ElevenLabs API Key 
                  {settings.elevenlabsApiKey ? (
                    <span className="configured-badge">✓ Configured</span>
                  ) : (
                    <span className="optional-badge">Optional</span>
                  )}
                </label>
                <p className="field-hint">For high-quality text-to-speech. Get one at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">ElevenLabs</a></p>
                <div className="input-with-toggle">
                  <input
                    type={showElevenLabsKey ? "text" : "password"}
                    value={settings.elevenlabsApiKey}
                    onChange={(e) => setSettings({ ...settings, elevenlabsApiKey: e.target.value })}
                    placeholder={settings.elevenlabsApiKey ? "••••••••••••••••" : "Enter your ElevenLabs API key"}
                    className={settings.elevenlabsApiKey ? "has-value" : ""}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                  >
                    {showElevenLabsKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {(settings.geminiApiKey || settings.elevenlabsApiKey) && (
                <div className="settings-status">
                  <p>💾 Your settings are saved and will be remembered.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="settings-section">
              <div className="settings-info">
                <p>Customize how the AI conducts the integrity check.</p>
              </div>

              <div className="settings-field">
                <label>Number of Questions</label>
                <select
                  value={settings.numberOfQuestions}
                  onChange={(e) => setSettings({ ...settings, numberOfQuestions: parseInt(e.target.value) })}
                >
                  <option value={2}>2 Questions</option>
                  <option value={3}>3 Questions (Default)</option>
                  <option value={4}>4 Questions</option>
                  <option value={5}>5 Questions</option>
                </select>
              </div>

              <div className="settings-field">
                <label>AI System Prompt</label>
                <p className="field-hint">Instructions that guide how the AI asks questions and evaluates answers.</p>
                <textarea
                  value={settings.customPrompt}
                  onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                  rows={12}
                  placeholder="Enter custom AI instructions..."
                />
              </div>

              <button className="btn btn-secondary btn-small" onClick={handleReset}>
                Reset to Default
              </button>
            </div>
          )}
        </div>

        <div className="settings-footer">
          {saved && <span className="saved-indicator">✓ Settings saved</span>}
          {needsSetup && (
            <span className="setup-warning">⚠️ Gemini API key required to continue</span>
          )}
          {!needsSetup && (
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => {
              handleSave();
              if (settings.geminiApiKey) {
                onClose();
              }
            }}
            disabled={needsSetup && !settings.geminiApiKey}
          >
            {needsSetup ? "Save & Continue" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

