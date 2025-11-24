import React from 'react';

export default function LiveTranscript({ transcript, theme }) {
  if (!transcript || transcript.length === 0) {
    return <div className="widget-transcript-empty">Transcript will appear here during the call.</div>;
  }
  return (
    <>
      {transcript.map((msg, idx) => {
        const who = msg?.who || '';
        const text = msg?.text || '';
        return (
          <div
            key={idx}
            className={`widget-transcript-msg ${who === 'user' ? 'transcript-user' : who === 'ai' ? 'transcript-ai' : ''}`}
            style={{
              color: who === 'user' ? '#8ecbff' : '#e9e9e9',
              fontWeight: who === 'user' ? 600 : 400,
              marginLeft: who === 'user' ? 0 : 12,
              marginRight: who === 'ai' ? 0 : 12,
              background: who === 'user' ? 'rgba(30,144,255,0.13)' : '#23232b',
              borderRadius: 6,
              padding: '10px 14px',
              display: 'inline-block',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: '0.96em', opacity: 0.7, marginRight: 6 }}>
              {who === 'user' ? 'You:' : who === 'ai' ? 'AI:' : ''}
            </span>
            {text}
          </div>
        );
      })}
    </>
  );
}
