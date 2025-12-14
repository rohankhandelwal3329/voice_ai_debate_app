// In production (Docker), use relative URLs since nginx proxies /api/ to backend
// In development, use localhost:8000
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8000");

export async function uploadAssignment(file, settings = {}) {
  const formData = new FormData();
  formData.append("file", file);
  
  // Add settings to form data
  if (settings.geminiApiKey) {
    formData.append("gemini_api_key", settings.geminiApiKey);
  }
  if (settings.elevenlabsApiKey) {
    formData.append("elevenlabs_api_key", settings.elevenlabsApiKey);
  }
  if (settings.customPrompt) {
    formData.append("custom_prompt", settings.customPrompt);
  }
  if (settings.numberOfQuestions) {
    formData.append("num_questions", settings.numberOfQuestions.toString());
  }

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

export async function submitAnswer(sessionId, answer) {
  // Load settings for API keys
  let headers = { "Content-Type": "application/json" };
  
  try {
    const stored = localStorage.getItem("integrity_checker_settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.geminiApiKey) {
        headers["X-Gemini-Api-Key"] = settings.geminiApiKey;
      }
      if (settings.elevenlabsApiKey) {
        headers["X-Elevenlabs-Api-Key"] = settings.elevenlabsApiKey;
      }
    }
  } catch (e) {
    console.error("Failed to load settings for API call:", e);
  }

  const response = await fetch(`${API_BASE}/api/answer`, {
    method: "POST",
    headers,
    body: JSON.stringify({ session_id: sessionId, answer }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to submit answer");
  }

  return response.json();
}

