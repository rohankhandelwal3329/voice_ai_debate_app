import React from "react";

export function ResultsPanel({ analysis, onRestart }) {
  return (
    <div className="card results-card">
      <div className="score-circle">
        <span className="score-number">{analysis.finalScore}</span>
        <span className="score-label">Score</span>
      </div>
      <p className="confidence-tag">{analysis.confidenceTag}</p>
      <p className="review-text">{analysis.review}</p>
      {analysis.observations?.length > 0 && (
        <ul className="observations">
          {analysis.observations.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
      <button className="btn btn-secondary" onClick={onRestart}>
        Start Over
      </button>
    </div>
  );
}

