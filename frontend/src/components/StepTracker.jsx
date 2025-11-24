import React from "react";
import { CheckIcon } from "./Icons";

const STEP_LABELS = {
  upload: "Upload",
  interview: "Q&A",
  results: "Results",
};

export function StepTracker({ currentStep }) {
  const displaySteps = ["upload", "interview", "results"];
  const currentMapped = currentStep === "ready" ? "upload" : currentStep;
  const activeIndex = displaySteps.indexOf(currentMapped);

  return (
    <div className="steps">
      {displaySteps.map((stepKey, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={stepKey} className={`step-item ${active ? "active" : ""} ${complete ? "complete" : ""}`}>
            <div className="step-dot">{complete ? <CheckIcon size={14} /> : index + 1}</div>
            <span className="step-name">{STEP_LABELS[stepKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

