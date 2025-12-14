import React, { useEffect, useRef, useState, useCallback } from "react";
import Orb from "./Orb";

// ElevenLabs Agent ID - get from https://elevenlabs.io/app/conversational-ai
const ELEVENLABS_AGENT_ID = "agent_9501kashe10zf1g8bdzz96aef9z6";

// Helper to convert spoken numbers to digits
const wordToNumber = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100
};

function parseSpokenNumber(text) {
  const words = text.toLowerCase().replace(/-/g, ' ').split(/\s+/);
  let total = 0;
  let current = 0;
  
  for (const word of words) {
    if (wordToNumber[word] !== undefined) {
      const num = wordToNumber[word];
      if (num === 100) {
        current = current === 0 ? 100 : current * 100;
      } else if (num >= 20) {
        current += num;
      } else {
        current += num;
      }
    }
  }
  total += current;
  return total > 0 ? total : null;
}

function extractScoreFromText(text) {
  if (!text) return null;
  
  const digitPatterns = [
    /integrity score is (\d{1,3})/i,
    /score is (\d{1,3})/i,
    /(\d{1,3}) out of (?:100|one hundred)/i,
    /(\d{1,3})\/100/i,
    /score[:\s]+(\d{1,3})/i,
    /(\d{1,3})\s*percent/i,
    /(\d{1,3})%/i,
  ];
  
  for (const pattern of digitPatterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseInt(match[1]);
      if (score >= 30 && score <= 100) {
        return score;
      }
    }
  }
  
  const spokenPatterns = [
    /integrity score is ([a-z\-\s]+) out of/i,
    /score is ([a-z\-\s]+) out of/i,
    /score of ([a-z\-\s]+) out of/i,
    /([a-z\-\s]+) out of (?:100|one hundred)/i,
  ];
  
  for (const pattern of spokenPatterns) {
    const match = text.match(pattern);
    if (match) {
      const spokenNum = match[1].trim();
      const score = parseSpokenNumber(spokenNum);
      if (score && score >= 30 && score <= 100) {
        return score;
      }
    }
  }
  
  return null;
}

export function ElevenLabsPanel({ assignmentText, fileName, onComplete, onRestart }) {
  const [conversationState, setConversationState] = useState("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [aiMessageCount, setAiMessageCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedScore, setExtractedScore] = useState(null);
  
  const conversationRef = useRef(null);
  const feedRef = useRef(null);
  const isStartingRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  // Auto-complete after the review message
  useEffect(() => {
    if (aiMessageCount >= 5 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setIsComplete(true);
      
      const lastAiMessage = messages.filter(m => m.role === "ai").pop();
      if (lastAiMessage) {
        const text = lastAiMessage.text;
        console.log("Extracting score from:", text);
        
        const score = extractScoreFromText(text);
        if (score) {
          console.log("Found score:", score);
          setExtractedScore(score);
        }
      }
      
      setTimeout(() => {
        endConversation();
      }, 2000);
    }
  }, [aiMessageCount, messages]);

  const startConversation = useCallback(async () => {
    if (isStartingRef.current || conversationRef.current) {
      console.log("Already starting or connected");
      return;
    }
    
    isStartingRef.current = true;
    hasCompletedRef.current = false;
    setIsComplete(false);
    setExtractedScore(null);
    setAiMessageCount(0);
    setCurrentTranscript("");
    
    try {
      setConversationState("connecting");
      setError("");
      setMessages([{ role: "system", text: "Requesting microphone access..." }]);

      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      
      setMessages([{ role: "system", text: "Connecting to AI..." }]);

      const { Conversation } = await import("@elevenlabs/client");

      const assignmentTitle = fileName ? fileName.replace(/\.[^/.]+$/, "") : "your assignment";
      const fullAssignment = assignmentText || "No assignment content provided.";

      console.log("=== OVERRIDE DEBUG ===");
      console.log("Assignment title:", assignmentTitle);
      console.log("Full assignment length:", fullAssignment.length);

      const systemPrompt = `You are an AI coach verifying a student understands their submitted assignment.

ASSIGNMENT TITLE: ${assignmentTitle}

ASSIGNMENT CONTENT:
${fullAssignment}

RULES:
1. Ask SHORT, SPECIFIC questions directly referencing their actual content.
2. Ask exactly 3 questions, ONE at a time. Wait for each answer.
3. Questions must be CONCISE (1-2 sentences max) and reference SPECIFIC parts of their work.

QUESTION EXAMPLES (adapt to their content):
- "In your assignment, you mentioned [specific term/concept]. Can you explain what that means?"
- "You wrote about [specific example]. Why did you include that?"
- "What was the main finding or conclusion you reached?"
- "You used [specific method/approach]. How does it work?"
- "Can you explain the [specific section] in your own words?"

AFTER 3 ANSWERS:
Give a brief review (2 sentences) and clearly state the score.
Say exactly: "Your integrity score is [NUMBER] out of one hundred" where [NUMBER] is a value between 30 and 100.
For example: "Your integrity score is eighty-five out of one hundred" or "Your integrity score is seventy out of one hundred".

IMPORTANT:
- Keep questions SHORT and SPECIFIC to their content
- Do NOT ask broad/generic questions
- The first message is just a greeting, then ask 3 questions
- Always end with the integrity score statement`;

      const firstMsg = `Hello! I've just reviewed your assignment "${assignmentTitle}". I'll ask you three quick questions to make sure the work reflects your own understanding. Ready?`;

      console.log("System prompt length:", systemPrompt.length);
      console.log("=== END DEBUG ===");

      const conversation = await Conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        overrides: {
          agent: {
            prompt: {
              prompt: systemPrompt
            },
            firstMessage: firstMsg
          }
        },
        onConnect: () => {
          console.log("Connected to ElevenLabs");
          setIsConnected(true);
          setConversationState("listening");
          setMessages([{ role: "system", text: "Connected! The AI will greet you..." }]);
          isStartingRef.current = false;
        },
        onDisconnect: () => {
          console.log("Disconnected from ElevenLabs");
          setIsConnected(false);
          setConversationState("idle");
          isStartingRef.current = false;
        },
        onError: (err) => {
          console.error("ElevenLabs error:", err);
          setError("Connection error. Please try again.");
          setConversationState("idle");
          isStartingRef.current = false;
        },
        onModeChange: (modeInfo) => {
          console.log("Mode changed:", modeInfo);
          const mode = modeInfo?.mode || modeInfo;
          if (mode === "speaking") {
            setConversationState("speaking");
            // Clear interim transcript when AI starts speaking
            setCurrentTranscript("");
          } else if (mode === "listening") {
            setConversationState("listening");
          }
        },
        onMessage: (message) => {
          console.log("Message received:", JSON.stringify(message, null, 2));
          
          if (!message) return;
          
          // Handle different message types from ElevenLabs
          // The message object can have different structures
          const messageType = message.type || message.message_type;
          const source = message.source || message.role;
          const text = message.message || message.text || message.content || message.transcript;
          const isFinal = message.isFinal !== false; // Default to true if not specified
          
          console.log("Parsed - Type:", messageType, "Source:", source, "Text:", text, "IsFinal:", isFinal);
          
          // Handle user transcripts (interim and final)
          if (source === "user" || source === "human" || messageType === "user_transcript" || messageType === "transcript") {
            if (text) {
              if (isFinal || messageType === "user_transcript") {
                // Final transcript - add to messages
                setCurrentTranscript("");
                setMessages(prev => [...prev, { role: "user", text }]);
              } else {
                // Interim transcript - show as live
                setCurrentTranscript(text);
              }
            }
          }
          // Handle AI messages
          else if (source === "ai" || source === "agent" || source === "assistant" || messageType === "agent_response") {
            if (text) {
              setMessages(prev => [...prev.filter(m => m.role !== "system"), { role: "ai", text }]);
              setAiMessageCount(prev => {
                const newCount = prev + 1;
                console.log("AI message count:", newCount);
                return newCount;
              });
            }
          }
          // Handle audio transcript events specifically
          else if (messageType === "audio_transcript" || messageType === "user_audio_transcript") {
            if (text) {
              if (isFinal) {
                setCurrentTranscript("");
                setMessages(prev => [...prev, { role: "user", text }]);
              } else {
                setCurrentTranscript(text);
              }
            }
          }
        },
        onStatusChange: (status) => {
          console.log("Status:", status);
        },
      });

      console.log("Conversation started:", conversation);
      conversationRef.current = conversation;

    } catch (err) {
      console.error("Failed to start:", err);
      isStartingRef.current = false;
      if (err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow microphone and refresh.");
      } else {
        setError(`Failed to connect: ${err.message || "Please try again."}`);
      }
      setConversationState("idle");
    }
  }, [assignmentText, fileName]);

  const endConversation = useCallback(async () => {
    isStartingRef.current = false;
    if (conversationRef.current) {
      try { await conversationRef.current.endSession(); } catch (e) {}
      conversationRef.current = null;
    }
    setIsConnected(false);
    setConversationState("idle");
  }, []);

  const handleOrbClick = useCallback(() => {
    if (conversationState === "idle" && !isStartingRef.current && !isComplete) {
      startConversation();
    }
  }, [conversationState, startConversation, isComplete]);

  const handleFinish = useCallback(() => {
    endConversation();
    
    const aiMessages = messages.filter(m => m.role === "ai");
    const reviewMessage = aiMessages[aiMessages.length - 1]?.text || "Review not available.";
    
    let finalScore = extractedScore;
    if (!finalScore && reviewMessage) {
      finalScore = extractScoreFromText(reviewMessage);
      if (finalScore) {
        console.log("Extracted score on finish:", finalScore);
      }
    }
    
    onComplete({ 
      score: finalScore || 75, 
      review: reviewMessage,
      messages 
    });
  }, [endConversation, onComplete, messages, extractedScore]);

  const handleCancel = useCallback(() => {
    endConversation();
    onRestart();
  }, [endConversation, onRestart]);

  useEffect(() => {
    return () => {
      isStartingRef.current = false;
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(() => {});
        conversationRef.current = null;
      }
    };
  }, []);

  const getOrbState = () => {
    if (conversationState === "connecting") return "processing";
    if (conversationState === "speaking") return "speaking";
    if (conversationState === "listening") return "listening";
    return "idle";
  };

  const getQuestionProgress = () => {
    if (aiMessageCount === 0) return "Ready";
    if (aiMessageCount === 1) return "Greeting";
    if (aiMessageCount === 2) return "Question 1/3";
    if (aiMessageCount === 3) return "Question 2/3";
    if (aiMessageCount === 4) return "Question 3/3";
    if (aiMessageCount >= 5) return "Review";
    return "In progress";
  };

  return (
    <div className="card elevenlabs-custom-card">
      <div className="elevenlabs-custom-header">
        <h2>Voice Q&A</h2>
        <span className="question-counter">
          {isConnected ? (
            <span className="live-badge">● {getQuestionProgress()}</span>
          ) : isComplete ? (
            <span className="complete-badge">✓ Complete</span>
          ) : (
            "Ready to start"
          )}
        </span>
      </div>

      <div className="elevenlabs-orb-section" onClick={handleOrbClick}>
        <Orb state={isComplete ? "idle" : getOrbState()} />
        {conversationState === "idle" && !error && !isComplete && (
          <p className="orb-hint">Click to start conversation</p>
        )}
        {conversationState === "connecting" && (
          <p className="orb-hint">Connecting...</p>
        )}
        {conversationState === "speaking" && (
          <p className="orb-hint">AI is speaking...</p>
        )}
        {conversationState === "listening" && (
          <p className="orb-hint">Listening... speak now</p>
        )}
        {isComplete && (
          <p className="orb-hint success">Q&A Complete! Click "See Results" below.</p>
        )}
      </div>

      {error && (
        <div className="elevenlabs-error-banner">
          <p>{error}</p>
          <button 
            className="btn btn-secondary btn-small" 
            onClick={() => { 
              setError(""); 
              setConversationState("idle"); 
              isStartingRef.current = false;
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="elevenlabs-transcript-section">
        <div className="transcript-header">
          <h3>Conversation</h3>
          {conversationState === "listening" && currentTranscript && (
            <span className="live-indicator">● Live</span>
          )}
        </div>
        
        <div className="transcript-feed" ref={feedRef}>
          {messages.length === 0 && !currentTranscript && (
            <p className="transcript-placeholder">
              Click the orb above to start the voice conversation
            </p>
          )}
          
          {messages.map((msg, i) => (
            <div key={i} className={`transcript-message ${msg.role}`}>
              <span className="message-role">
                {msg.role === "ai" ? "AI" : msg.role === "user" ? "You" : "System"}
              </span>
              <p>{msg.text}</p>
            </div>
          ))}
          
          {currentTranscript && (
            <div className="transcript-message user live">
              <span className="message-role">You (speaking...)</span>
              <p>{currentTranscript}</p>
            </div>
          )}
        </div>
      </div>

      <div className="elevenlabs-actions">
        <button className="btn btn-secondary" onClick={handleCancel}>
          Cancel
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleFinish}
          disabled={!isComplete && messages.length < 4}
        >
          {isComplete ? "See Results" : "Finish & See Results"}
        </button>
      </div>
    </div>
  );
}
