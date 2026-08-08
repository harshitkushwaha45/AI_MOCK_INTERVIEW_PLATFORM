import { useRef, useState } from "react";
import { BASE_URL, readJson } from "../api";
import { ArenaIcon } from "./ArenaShell";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const formatFileSize = (size) => {
  if (!Number.isFinite(size)) return "";

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

function ResumeUpload({ onAnalysisComplete, onAuthExpired, onSkip }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      setResult(null);
      setError("Only PDF files are allowed.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setResult(null);
      setError("PDF must be smaller than 5MB.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await fetch(`${BASE_URL}/api/resume/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await readJson(res);

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        onAuthExpired?.();
        setError("Your login session expired. Please log in again.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setResult(data);

    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="resume-upload-card" aria-labelledby="resume-upload-title">
      <div className="resume-upload-card__badge">
        <ArenaIcon name="uploadFile" />
      </div>

      <div className="resume-upload-card__heading">
        <h2 id="resume-upload-title">Upload Your Resume</h2>
        <p>Let AI understand you better</p>
      </div>

      <div
        className={[
          "resume-dropzone",
          isDragging ? "is-dragging" : "",
          file ? "has-file" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) {
            return;
          }

          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            selectFile(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="resume-dropzone__input"
        />

        <ArenaIcon name="cloudUpload" className="resume-dropzone__icon" />

        <p className="resume-dropzone__title">
          {file ? file.name : "Drag & drop your PDF here"}
        </p>

        {!file && <span className="resume-dropzone__divider">or</span>}

        <button
          className="resume-browse-button"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {file ? "Choose Another PDF" : "Browse PDF"}
        </button>

        <small className="resume-dropzone__meta">
          {file ? `${formatFileSize(file.size)} selected` : "PDF only, up to 5MB"}
        </small>
      </div>

      {error && <div className="resume-alert">{error}</div>}

      <div
        className={[
          "resume-upload-actions",
          !file ? "resume-upload-actions--subtle" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {file && (
          <button
            className="resume-primary-button"
            disabled={loading}
            onClick={handleUpload}
            type="button"
          >
            {loading ? "Analyzing Resume..." : "Analyze Resume"}
          </button>
        )}

        {onSkip && (
          <button
            className="resume-secondary-button"
            onClick={onSkip}
            type="button"
          >
            Skip Resume
          </button>
        )}
      </div>

      {result?.analysis && (
        <div className="resume-result">
          <div className="resume-result__header">
            <div>
              <p>Resume Verdict</p>
              <h3 className={result.analysis.ok ? "is-good" : "is-warning"}>
                {result.analysis.ok ? "Looks Good" : "Needs Improvement"}
              </h3>
            </div>

            <div className="resume-score">
              <span>Score</span>
              <strong>
                {result.analysis.score}
                <small>/10</small>
              </strong>
            </div>
          </div>

          <p className="resume-result__verdict">{result.analysis.verdict}</p>

          <div className="resume-result__grid">
            <div className="resume-result-list resume-result-list--good">
              <p>Strengths</p>
              <ul>
                {(result.analysis.strengths || []).map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="resume-result-list resume-result-list--warning">
              <p>Issues</p>
              <ul>
                {(result.analysis.issues || []).map((item, index) => (
                  <li key={`issue-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="resume-result-list resume-result-list--info">
              <p>Suggestions</p>
              <ul>
                {(result.analysis.suggestions || []).map((item, index) => (
                  <li key={`suggestion-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="resume-result__footer">
            <button
              className="resume-primary-button"
              onClick={() => onAnalysisComplete?.(result)}
              type="button"
            >
              Continue With Resume Questions
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ResumeUpload;
