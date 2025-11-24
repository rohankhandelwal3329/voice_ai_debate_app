import React, { useEffect, useRef } from "react";

export function ConversationPanel({ messages, currentTranscript, isSpeaking, isListening, isProcessing, analysis }) {
  const feedRef = useRef(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, currentTranscript]);

  return (
    <div className="card conversation-card">
      <div className="conversation-header">
        <h3>Conversation</h3>
        {isSpeaking && <span className="live-dot speaking" />}
        {isListening && !isSpeaking && <span className="live-dot listening" />}
        {isProcessing && <span className="live-dot processing" />}
      </div>
      <div className="conversation-feed" ref={feedRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            <span className="msg-author">{msg.role === "ai" ? "AI" : "You"}</span>
            <p>{msg.text}</p>
          </div>
        ))}
        {currentTranscript && (
          <div className="msg student live">
            <span className="msg-author">You</span>
            <p>{currentTranscript}</p>
          </div>
        )}
      </div>
      {analysis && (
        <div className="final-score-bar">
          <span>Final Score</span>
          <strong>{analysis.finalScore}/100</strong>
        </div>
      )}
    </div>
  );
}

