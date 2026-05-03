import { useEffect, useState } from "react";
import { BASE_URL, authFetch } from "./api";
import ScoreChart from "./components/ScoreChart";
import Dashboard from "./pages/Dashboard";
import ResultDetail from "./pages/ResultDetail";
import useSpeechToText from "./hooks/useSpeechToText";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  const primaryButtonStyle = {
    border: "none",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
    color: "#e0f2fe",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(14, 165, 233, 0.28)",
  };

  const restartInterview = () => {
    localStorage.removeItem("interviewResults");
    setAnswers([]);
    setSummary(null);
    setIsFinished(false);
    setCurrentIndex(0);
    setAnswer("");
    setTimeLeft(30);
  };
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [category, setCategory] = useState("hr");
  const [summary, setSummary] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const { isListening, startListening, stopListening } = useSpeechToText();

  // 🔐 CHECK LOGIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // LOAD SAVED RESULTS
  useEffect(() => {
    const saved = localStorage.getItem("interviewResults");
    if (saved) {
      const parsed = JSON.parse(saved);
      setAnswers(parsed.results || []);
      setSummary(parsed.summary || null);
      setIsFinished(true);
    }
  }, []);

  // FETCH QUESTIONS
  useEffect(() => {
    fetch(`${BASE_URL}/api/questions?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(Array.isArray(data) ? data : []);
        setCurrentIndex(0);
        setAnswers([]);
        setSummary(null);
        setIsFinished(false);
        setTimeLeft(30);
      })
      .catch(console.error);
  }, [category]);

  // TIMER
  useEffect(() => {
    if (isFinished) return;

    if (timeLeft === 0) {
      handleNext();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isFinished]);

  // NEXT
  const handleNext = async () => {
    const updatedAnswers = [
      ...answers,
      {
        question: questions[currentIndex]?.question || "",
        answer: answer || "No answer",
      },
    ];

    setAnswers(updatedAnswers);
    setAnswer("");
    setTimeLeft(30);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      try {
        const res = await authFetch("/api/interview/feedback", {
          method: "POST",
          body: JSON.stringify({ answers: updatedAnswers, category }),
        });

        const data = await res.json();

        localStorage.setItem("interviewResults", JSON.stringify(data));

        setAnswers(data.results || []);
        setSummary(data.summary || null);
        setIsFinished(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 🔐 LOGIN SCREEN
  if (!isAuthenticated) {
    if (authMode === "signup") {
      return (
        <Signup
          onLoginClick={() => setAuthMode("login")}
          onSignupSuccess={() => setIsAuthenticated(true)}
        />
      );
    }

    return (
      <Login
        onSignupClick={() => setAuthMode("signup")}
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  // 📊 DASHBOARD VIEW
  if (showDashboard) {
    if (selectedResultId) {
      return (
        <ResultDetail
          resultId={selectedResultId}
          onBack={() => setSelectedResultId(null)}
        />
      );
    }

    return (
      <>
        <button
          onClick={() => setShowDashboard(false)}
          style={btn}
        >
          ← Back
        </button>

        <Dashboard onSelect={setSelectedResultId} />
      </>
    );
  }

// 🎉 RESULT SCREEN
if (isFinished) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* TOP ACTION */}
      <button
        onClick={() => setShowDashboard(true)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "#0ea5e9",
          border: "none",
          padding: "10px 16px",
          borderRadius: "8px",
          color: "white",
          cursor: "pointer",
        }}
      >
        📊 Dashboard
      </button>

      {/* TITLE */}
      <h1 style={{ marginBottom: "20px" }}>
        🎉 Interview Completed
      </h1>

      {/* SUMMARY CARD */}
      {summary && (
        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "700px",
            marginBottom: "20px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>📊 Summary</h2>

          <p>
            <strong>Score:</strong>{" "}
            <span
              style={{
                color:
                  summary.averageScore >= 7
                    ? "#22c55e"
                    : summary.averageScore >= 5
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {summary.averageScore}/10
            </span>
          </p>

          <p style={{ marginTop: "8px" }}>💪 {summary.strengths}</p>
          <p>⚠️ {summary.weaknesses}</p>
          <p>🚀 {summary.suggestions}</p>
        </div>
      )}

      {/* ANSWERS */}
      {answers.map((item, i) => (
        <div
          key={i}
          style={{
            background: "#1e293b",
            padding: "15px",
            borderRadius: "10px",
            width: "100%",
            maxWidth: "700px",
            marginBottom: "12px",
          }}
        >
          <p><b>Q:</b> {item.question}</p>
          <p><b>A:</b> {item.answer}</p>
          <p><b>Feedback:</b> {item.feedback}</p>
        </div>
      ))}

      {/* CHART */}
      <div style={{ width: "100%", maxWidth: "700px", marginTop: "20px" }}>
        <ScoreChart answers={answers} />
      </div>

      <button
        onClick={restartInterview}
        style={{
          marginTop: "24px",
          padding: "14px 24px",
          fontSize: "15px",
          ...primaryButtonStyle,
        }}
      >
        Restart Interview
      </button>
    </div>
  );
}

  // LOADING
  if (!questions.length) return <p>Loading...</p>;

  // 🎤 INTERVIEW UI
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.20), transparent 28%), radial-gradient(circle at bottom right, rgba(99,102,241,0.18), transparent 28%), linear-gradient(160deg, #020617 0%, #071226 52%, #020617 100%)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          right: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          zIndex: 2,
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "999px",
            background: "rgba(15, 23, 42, 0.78)",
            border: "1px solid rgba(148,163,184,0.14)",
            color: "#cbd5e1",
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          AI Interview Arena
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowDashboard(true)}
            style={{
              padding: "12px 18px",
              fontSize: "14px",
              letterSpacing: "0.03em",
              ...primaryButtonStyle,
            }}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.reload();
            }}
            style={{
              padding: "12px 18px",
              border: "1px solid rgba(248, 113, 113, 0.28)",
              borderRadius: "999px",
              background: "rgba(127, 29, 29, 0.28)",
              color: "#fecaca",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 14px 30px rgba(127, 29, 29, 0.18)",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{
          width: "min(820px, calc(100vw - 48px))",
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
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#7dd3fc",
              }}
            >
              Live Interview Session
            </p>
            <h2
              style={{
                margin: "10px 0 0",
                fontSize: "40px",
                lineHeight: 1.08,
                color: "#f8fafc",
              }}
            >
              AI Mock Interview
            </h2>
          </div>

          <div
            style={{
              minWidth: "148px",
              padding: "14px 18px",
              borderRadius: "22px",
              background: "rgba(15, 23, 42, 0.84)",
              border: "1px solid rgba(56, 189, 248, 0.18)",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Time Left</p>
            <p style={{ margin: "8px 0 0", fontSize: "30px", fontWeight: 800, color: "#f8fafc" }}>
              {timeLeft}s
            </p>
          </div>
        </div>

        <div
          style={{
            height: "10px",
            borderRadius: "999px",
            background: "rgba(15, 23, 42, 0.95)",
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.08)",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              width: `${(timeLeft / 30) * 100}%`,
              height: "100%",
              borderRadius: "999px",
              background:
                timeLeft > 15
                  ? "linear-gradient(90deg, #22c55e, #38bdf8)"
                  : timeLeft > 7
                  ? "linear-gradient(90deg, #f59e0b, #f97316)"
                  : "linear-gradient(90deg, #ef4444, #fb7185)",
              transition: "width 1s linear",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "999px",
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.16)",
              color: "#bae6fd",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <span>Question {currentIndex + 1}</span>
            <span style={{ opacity: 0.45 }}>/</span>
            <span>{questions.length}</span>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(15, 23, 42, 0.74)",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="hr">HR Interview</option>
            <option value="technical">Technical Interview</option>
          </select>
        </div>

        <div
          style={{
            padding: "26px",
            borderRadius: "24px",
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(148,163,184,0.12)",
            marginBottom: "22px",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "12px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            Current Prompt
          </p>
          <h3
            style={{
              margin: 0,
              fontSize: "32px",
              lineHeight: 1.25,
              color: "#f8fafc",
            }}
          >
            {questions[currentIndex]?.question}
          </h3>
        </div>

        <div
          style={{
            padding: "22px",
            borderRadius: "24px",
            background: "rgba(30, 41, 59, 0.58)",
            border: "1px solid rgba(148,163,184,0.12)",
          }}
        >
          <p style={{ margin: "0 0 12px", color: "#cbd5e1", fontSize: "14px" }}>
            Answer with structure, confidence, and one memorable example.
          </p>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            placeholder="Start speaking or type your response here..."
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: "18px",
              border: "1px solid rgba(56, 189, 248, 0.18)",
              background: "rgba(2, 6, 23, 0.75)",
              color: "#f8fafc",
              padding: "18px 20px",
              fontSize: "16px",
              lineHeight: 1.6,
              outline: "none",
              boxSizing: "border-box",
              minHeight: "150px",
            }}
          />

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {!isListening ? (
                <button
                  onClick={() => startListening(setAnswer)}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(34, 197, 94, 0.16)",
                    color: "#bbf7d0",
                    border: "1px solid rgba(34, 197, 94, 0.22)",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  🎤 Start Speaking
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(239, 68, 68, 0.16)",
                    color: "#fecaca",
                    border: "1px solid rgba(239, 68, 68, 0.24)",
                    borderRadius: "999px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ⛔ Stop
                </button>
              )}

              <p style={{ margin: 0, color: isListening ? "#4ade80" : "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
                {isListening ? "Listening live..." : "Mic ready when you are."}
              </p>
            </div>

            <button
              onClick={handleNext}
              style={{
                padding: "14px 28px",
                fontSize: "15px",
                minWidth: "136px",
                ...primaryButtonStyle,
              }}
            >
              {currentIndex === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btn = {
  position: "absolute",
  top: "20px",
  right: "20px",
  padding: "10px 15px",
  background: "#38bdf8",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export default App;
