import { useEffect, useState } from "react";
import { authFetch } from "../api";
import ScoreChart from "../components/ScoreChart";

function ResultDetail({ resultId, onBack }) {
  const [data, setData] = useState(null);
  const wrappedTextStyle = {
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  };
  const buttonStyle = {
    border: "none",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
    color: "#e0f2fe",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(14, 165, 233, 0.28)",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch(`/api/results/${resultId}`);
        const data = await res.json();
        setData(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [resultId]);

  if (!data) return <p style={{ color: "white" }}>Loading...</p>;

  const score = Number(data.summary?.averageScore) || 0;
  const scoreColor =
    score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div
      style={{
        padding: "34px 24px 60px",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(99,102,241,0.14), transparent 30%), linear-gradient(160deg, #020617 0%, #0f172a 52%, #020617 100%)",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            marginBottom: "26px",
            padding: "12px 18px",
            fontSize: "14px",
            letterSpacing: "0.03em",
            ...buttonStyle,
          }}
        >
          ← Back
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "26px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#7dd3fc",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                fontSize: "12px",
              }}
            >
              Interview Breakdown
            </p>
            <h1
              style={{
                margin: "10px 0 0",
                fontSize: "clamp(34px, 6vw, 54px)",
                lineHeight: 1.05,
              }}
            >
              Interview Details
            </h1>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: "22px",
              background: "rgba(15, 23, 42, 0.84)",
              border: `1px solid ${scoreColor}33`,
              minWidth: "152px",
              boxShadow: "0 16px 40px rgba(2, 6, 23, 0.35)",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Overall Score</p>
            <p style={{ margin: "8px 0 0", fontSize: "30px", fontWeight: 800, color: scoreColor }}>
              {score}
              <span style={{ fontSize: "14px", color: "#cbd5e1" }}>/10</span>
            </p>
          </div>
        </div>

        {/* SUMMARY */}
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
            padding: "26px",
            borderRadius: "26px",
            border: "1px solid rgba(148,163,184,0.12)",
            boxShadow: "0 18px 40px rgba(2, 6, 23, 0.34)",
            marginBottom: "22px",
          }}
        >
          <div
            style={{
              height: "8px",
              borderRadius: "999px",
              background: "rgba(15, 23, 42, 0.95)",
              overflow: "hidden",
              marginBottom: "22px",
            }}
          >
            <div
              style={{
                width: `${Math.min(score * 10, 100)}%`,
                height: "100%",
                borderRadius: "999px",
                background:
                  score >= 7
                    ? "linear-gradient(90deg, #22c55e, #34d399)"
                    : score >= 5
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #ef4444, #fb7185)",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "rgba(15, 23, 42, 0.62)",
                border: "1px solid rgba(34, 197, 94, 0.16)",
              }}
            >
              <p style={{ margin: "0 0 10px", color: "#86efac", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Strengths
              </p>
              <p style={{ margin: 0, color: "#e2e8f0", ...wrappedTextStyle }}>
                {data.summary?.strengths}
              </p>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "rgba(15, 23, 42, 0.62)",
                border: "1px solid rgba(245, 158, 11, 0.16)",
              }}
            >
              <p style={{ margin: "0 0 10px", color: "#fcd34d", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Weaknesses
              </p>
              <p style={{ margin: 0, color: "#e2e8f0", ...wrappedTextStyle }}>
                {data.summary?.weaknesses}
              </p>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "rgba(15, 23, 42, 0.62)",
                border: "1px solid rgba(56, 189, 248, 0.16)",
              }}
            >
              <p style={{ margin: "0 0 10px", color: "#7dd3fc", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Suggestions
              </p>
              <p style={{ margin: 0, color: "#e2e8f0", ...wrappedTextStyle }}>
                {data.summary?.suggestions}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              margin: 0,
              color: "#7dd3fc",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontSize: "12px",
            }}
          >
            Answer Review
          </p>
          <h2 style={{ margin: "10px 0 0", fontSize: "28px" }}>
            Question-by-question feedback
          </h2>
        </div>

        {/* ANSWERS */}
        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {data?.answers?.map((item, i) => (
            <div
              key={i}
              style={{
                background:
                  "linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
                padding: "22px",
                borderRadius: "24px",
                border: "1px solid rgba(148,163,184,0.12)",
                boxShadow: "0 16px 36px rgba(2, 6, 23, 0.28)",
                transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 24px 44px rgba(2, 6, 23, 0.38)";
                e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 16px 36px rgba(2, 6, 23, 0.28)";
                e.currentTarget.style.borderColor = "rgba(148,163,184,0.12)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.18)",
                    color: "#bae6fd",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Question {i + 1}
                </div>
              </div>

              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Prompt
              </p>
              <p style={{ margin: "8px 0 18px", fontSize: "20px", color: "#f8fafc", ...wrappedTextStyle }}>
                {item.question}
              </p>

              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Your Answer
              </p>
              <p style={{ margin: "8px 0 18px", color: "#e2e8f0", ...wrappedTextStyle }}>
                {item.answer}
              </p>

              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "18px",
                  background: "rgba(15, 23, 42, 0.62)",
                  border: "1px solid rgba(148,163,184,0.12)",
                }}
              >
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  AI Feedback
                </p>
                <p style={{ margin: "8px 0 0", color: "#e2e8f0", ...wrappedTextStyle }}>
                  {item.feedback}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CHART */}
        <ScoreChart answers={data.answers} />
      </div>
    </div>
  );
}

export default ResultDetail;
