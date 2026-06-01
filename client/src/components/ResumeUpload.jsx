import { useState } from "react";
import { BASE_URL } from "../api";

function ResumeUpload({ onAnalysisComplete, onSkip }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

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

      const data = await res.json();

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
    <div
      style={{
        width: "min(920px, calc(100vw - 48px))",
        borderRadius: "30px",
        padding: "34px",
        background:
          "linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.96))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow:
          "0 30px 80px rgba(2, 6, 23, 0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(18px)",
        position: "relative",
        zIndex: 1,
        color: "white",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#7dd3fc",
        }}
      >
        Resume Check
      </p>
      <h2 style={{ margin: "12px 0 10px", fontSize: "38px", lineHeight: 1.08 }}>
        Upload your PDF resume
      </h2>
      <p style={{ margin: 0, color: "#cbd5e1", fontSize: "15px", lineHeight: 1.7 }}>
        We will extract the text, review the resume, and prepare interview questions from your own projects and skills.
      </p>

      <div
        style={{
          marginTop: "28px",
          padding: "24px",
          borderRadius: "24px",
          background: "rgba(15, 23, 42, 0.72)",
          border: "1px solid rgba(148,163,184,0.12)",
        }}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError("");
          }}
          style={{ color: "#cbd5e1" }}
        />

        <p style={{ margin: "12px 0 0", color: "#94a3b8", fontSize: "13px" }}>
          PDF only, up to 5MB.
        </p>

        {file && (
          <p style={{ margin: "16px 0 0", color: "#e2e8f0", fontSize: "14px" }}>
            Selected: <strong>{file.name}</strong>
          </p>
        )}

        {error && (
          <div
            style={{
              marginTop: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(127, 29, 29, 0.24)",
              border: "1px solid rgba(248, 113, 113, 0.24)",
              color: "#fecaca",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: "22px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleUpload}
            disabled={loading}
            style={{
              padding: "14px 24px",
              border: "none",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
              color: "#e0f2fe",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 14px 30px rgba(14, 165, 233, 0.28)",
            }}
          >
            {loading ? "Analyzing Resume..." : "Upload And Generate Questions"}
          </button>

          <button
            onClick={onSkip}
            style={{
              padding: "14px 24px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(15, 23, 42, 0.74)",
              color: "#cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Skip For Now
          </button>
        </div>
      </div>

      {result?.analysis && (
        <div
          style={{
            marginTop: "24px",
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Resume Verdict
              </p>
              <h3 style={{ margin: "10px 0 0", fontSize: "28px", color: result.analysis.ok ? "#86efac" : "#fbbf24" }}>
                {result.analysis.ok ? "Looks Good" : "Needs Improvement"}
              </h3>
            </div>

            <div
              style={{
                padding: "14px 18px",
                borderRadius: "18px",
                background: "rgba(2, 6, 23, 0.72)",
                border: "1px solid rgba(56, 189, 248, 0.16)",
                minWidth: "140px",
              }}
            >
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Score</p>
              <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: 800 }}>
                {result.analysis.score}
                <span style={{ fontSize: "13px", color: "#cbd5e1" }}>/10</span>
              </p>
            </div>
          </div>

          <p style={{ margin: "16px 0 0", color: "#e2e8f0", lineHeight: 1.7 }}>
            {result.analysis.verdict}
          </p>

          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "rgba(34, 197, 94, 0.10)",
                border: "1px solid rgba(34, 197, 94, 0.16)",
              }}
            >
              <p style={{ margin: 0, color: "#86efac", fontWeight: 700 }}>Strengths</p>
              <ul style={{ margin: "12px 0 0", paddingLeft: "18px", color: "#dcfce7", lineHeight: 1.7 }}>
                {(result.analysis.strengths || []).map((item, index) => (
                  <li key={`strength-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "rgba(245, 158, 11, 0.10)",
                border: "1px solid rgba(245, 158, 11, 0.16)",
              }}
            >
              <p style={{ margin: 0, color: "#fcd34d", fontWeight: 700 }}>Issues</p>
              <ul style={{ margin: "12px 0 0", paddingLeft: "18px", color: "#fef3c7", lineHeight: 1.7 }}>
                {(result.analysis.issues || []).map((item, index) => (
                  <li key={`issue-${index}`}>{item}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "rgba(56, 189, 248, 0.10)",
                border: "1px solid rgba(56, 189, 248, 0.16)",
              }}
            >
              <p style={{ margin: 0, color: "#7dd3fc", fontWeight: 700 }}>Suggestions</p>
              <ul style={{ margin: "12px 0 0", paddingLeft: "18px", color: "#e0f2fe", lineHeight: 1.7 }}>
                {(result.analysis.suggestions || []).map((item, index) => (
                  <li key={`suggestion-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => onAnalysisComplete?.(result)}
              style={{
                padding: "14px 24px",
                border: "none",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                color: "#e0f2fe",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(14, 165, 233, 0.28)",
              }}
            >
              Continue With Resume Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
