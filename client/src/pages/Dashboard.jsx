import { useEffect, useState } from "react";
import { authFetch } from "../api";

function Dashboard({ onSelect }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const averageScore = results.length
    ? (
        results.reduce(
          (sum, item) => sum + (Number(item.summary?.averageScore) || 0),
          0
        ) / results.length
      ).toFixed(1)
    : "0.0";

  useEffect(() => {
    authFetch("/api/results")
      .then((res) => res.json())
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(99,102,241,0.14), transparent 30%), linear-gradient(160deg, #020617 0%, #061227 52%, #020617 100%)",
        color: "white",
        padding: "40px 24px 64px",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "18px",
            flexWrap: "wrap",
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
              Performance Hub
            </p>
            <h1
              style={{
                margin: "10px 0 0",
                fontSize: "clamp(34px, 6vw, 56px)",
                lineHeight: 1.05,
              }}
            >
              Interview Dashboard
            </h1>
            <p style={{ margin: "12px 0 0", color: "#94a3b8", maxWidth: "560px" }}>
              Review every interview session, compare scores quickly, and jump
              straight into the detailed breakdown.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                minWidth: "150px",
                padding: "18px 20px",
                borderRadius: "22px",
                background: "rgba(15, 23, 42, 0.84)",
                border: "1px solid rgba(56, 189, 248, 0.16)",
                boxShadow: "0 16px 40px rgba(2, 6, 23, 0.35)",
              }}
            >
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Total Interviews</p>
              <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: 800 }}>
                {results.length}
              </p>
            </div>

            <div
              style={{
                minWidth: "150px",
                padding: "18px 20px",
                borderRadius: "22px",
                background: "rgba(15, 23, 42, 0.84)",
                border: "1px solid rgba(99, 102, 241, 0.16)",
                boxShadow: "0 16px 40px rgba(2, 6, 23, 0.35)",
              }}
            >
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Average Score</p>
              <p style={{ margin: "8px 0 0", fontSize: "28px", fontWeight: 800 }}>
                {averageScore}/10
              </p>
            </div>
          </div>
        </div>

        {/* 🔄 LOADING */}
        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#cbd5e1",
              background: "rgba(15, 23, 42, 0.84)",
              borderRadius: "24px",
              border: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            Loading interview history...
          </div>
        ) : results.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#cbd5e1",
              background: "rgba(15, 23, 42, 0.84)",
              borderRadius: "24px",
              border: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            No interviews yet
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {results.map((item) => {
              const score = Number(item.summary?.averageScore) || 0;
              const scoreColor =
                score >= 7 ? "#22c55e" : score >= 5 ? "#f59e0b" : "#ef4444";
              const label =
                score >= 7 ? "Strong performance" : score >= 5 ? "Needs polish" : "Needs practice";

              return (
                <div
                  key={item._id}
                  onClick={() => onSelect(item._id)}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
                    padding: "24px",
                    borderRadius: "24px",
                    cursor: "pointer",
                    transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                    boxShadow: "0 16px 40px rgba(2, 6, 23, 0.36)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 26px 50px rgba(2, 6, 23, 0.48)";
                    e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.28)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 16px 40px rgba(2, 6, 23, 0.36)";
                    e.currentTarget.style.borderColor = "rgba(148,163,184,0.12)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "14px",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          color: "#7dd3fc",
                          textTransform: "uppercase",
                          letterSpacing: "0.14em",
                          fontSize: "11px",
                        }}
                      >
                        {item.category?.toUpperCase()} Interview
                      </p>
                      <h3 style={{ margin: "10px 0 0", fontSize: "24px" }}>
                        Session Review
                      </h3>
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "16px",
                        background: "rgba(2, 6, 23, 0.72)",
                        border: `1px solid ${scoreColor}33`,
                        textAlign: "center",
                        minWidth: "88px",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>Score</p>
                      <p style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: 800, color: scoreColor }}>
                        {score}
                        <span style={{ fontSize: "13px", color: "#cbd5e1" }}>/10</span>
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      height: "8px",
                      borderRadius: "999px",
                      background: "rgba(15, 23, 42, 0.95)",
                      overflow: "hidden",
                      marginBottom: "16px",
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
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>

                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "14px" }}>
                    {label}
                  </p>
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </p>

                  <div
                    style={{
                      marginTop: "22px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#bae6fd",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <span>View full interview</span>
                    <span
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.16)",
                      }}
                    >
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
