import React, { useRef, useState } from "react";
import { UploadIcon } from "./Icons";

const ACCEPTED_INPUTS = ".pdf,.docx,.pptx,.txt";

export function UploadPanel({ onFileSelected, status, error }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (file) onFileSelected(file);
  };

  const disabled = status === "uploading";

  return (
    <div className="card upload-card">
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

