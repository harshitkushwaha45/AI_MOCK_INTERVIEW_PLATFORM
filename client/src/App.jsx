import { useEffect, useEffectEvent, useRef, useState } from "react";
import { BASE_URL, authFetch, readJson } from "./api";
import ScoreChart from "./components/ScoreChart";
import EmotionCamera from "./components/EmotionCamera";
import Dashboard from "./pages/Dashboard";
import ResultDetail from "./pages/ResultDetail";
import useSpeechToText from "./hooks/useSpeechToText";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResumeUpload from "./components/ResumeUpload";

const QUESTION_TIME_LIMIT = 120;
const EMPTY_EMOTION_METRICS = {
  confidenceScore: 0,
  eyeContactScore: 0,
  faceVisibilityScore: 0,
  emotion: "Unknown",
};

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
    setFeedbackError("");
    setEmotionMetrics(EMPTY_EMOTION_METRICS);
    setIsFinished(false);
    setCurrentIndex(0);
    setAnswer("");
    setTimeLeft(QUESTION_TIME_LIMIT);
  };
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [category, setCategory] = useState("hr");
  const [summary, setSummary] = useState(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [emotionMetrics, setEmotionMetrics] = useState(EMPTY_EMOTION_METRICS);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );
  const [authMode, setAuthMode] = useState("login");
  const [showUpload, setShowUpload] = useState(true);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(() =>
    "speechSynthesis" in window ? "Voice ready" : "Voice unavailable"
  );
  const spokenQuestionKeyRef = useRef("");

  const { isListening, startListening, stopListening } = useSpeechToText();

  const currentQuestionText = questions[currentIndex]?.question || "";

  const stopQuestionSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleVoiceMute = () => {
    setIsVoiceMuted((prev) => {
      const nextMuted = !prev;

      if (!prev) {
        stopQuestionSpeech();
        setVoiceStatus("Voice muted");
      } else {
        spokenQuestionKeyRef.current = "";
        setVoiceStatus("Voice ready");
      }

      return nextMuted;
    });
  };

  // LOAD SAVED RESULTS
  useEffect(() => {
    const saved = localStorage.getItem("interviewResults");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed?.results) && parsed.results.length && parsed?.summary) {
          setAnswers(parsed.results);
          setSummary(parsed.summary);
          setIsFinished(true);
        } else {
          localStorage.removeItem("interviewResults");
        }
      } catch {
        localStorage.removeItem("interviewResults");
      }
    }
  }, []);

  // FETCH QUESTIONS
  useEffect(() => {
    if (showUpload || category === "resume") {
      return;
    }

    fetch(`${BASE_URL}/api/questions?category=${category}`)
      .then((res) => readJson(res))
      .then((data) => {
        setQuestions(Array.isArray(data) ? data : []);
        setCurrentIndex(0);
        setAnswers([]);
        setSummary(null);
        setFeedbackError("");
        setEmotionMetrics(EMPTY_EMOTION_METRICS);
        setIsFinished(false);
        setTimeLeft(QUESTION_TIME_LIMIT);
      })
      .catch(console.error);
  }, [category, showUpload]);

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
    setFeedbackError("");
    setTimeLeft(QUESTION_TIME_LIMIT);
    stopQuestionSpeech();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      try {
        const res = await authFetch("/api/interview/feedback", {
          method: "POST",
          body: JSON.stringify({
            answers: updatedAnswers,
            category,
            emotionMetrics,
          }),
        });

        const text = await res.text();
        let data = {};

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error("Server returned an invalid feedback response");
        }

        if (!res.ok) {
          throw new Error(data.message || "Feedback generation failed");
        }

        localStorage.setItem("interviewResults", JSON.stringify(data));

        setAnswers(data.results || []);
        setSummary(data.summary || null);
        setEmotionMetrics(data.emotionMetrics || emotionMetrics);
        setIsFinished(true);
      } catch (err) {
        console.error(err);
        setFeedbackError(
          err.message || "Could not generate feedback. Please try finishing again."
        );
      }
    }
  };

  const handleTimerExpired = useEffectEvent(() => {
    handleNext();
  });

  // TIMER
  useEffect(() => {
    if (isFinished) return;

    if (timeLeft === 0) {
      handleTimerExpired();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isFinished]);

  useEffect(() => {
    if (!currentQuestionText || showUpload || isFinished) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    if (isVoiceMuted) {
      stopQuestionSpeech();
      return;
    }

    const questionKey = `${currentIndex}:${currentQuestionText}`;

    if (spokenQuestionKeyRef.current === questionKey) {
      return;
    }

    stopQuestionSpeech();

    const utterance = new SpeechSynthesisUtterance(currentQuestionText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setVoiceStatus("Reading question aloud");
    utterance.onend = () => setVoiceStatus("Question read");
    utterance.onerror = () => setVoiceStatus("Voice stopped");

    spokenQuestionKeyRef.current = questionKey;
    window.speechSynthesis.speak(utterance);

    return () => {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      stopQuestionSpeech();
    };
  }, [
    currentIndex,
    currentQuestionText,
    isFinished,
    isVoiceMuted,
    showUpload,
  ]);

  useEffect(() => {
    return () => stopQuestionSpeech();
  }, []);

  const startResumeInterview = (resumeResult) => {
    const resumeQuestions = Array.isArray(resumeResult?.questions)
      ? resumeResult.questions
      : [];

    if (!resumeQuestions.length) {
      console.error("No resume questions were returned from the server.");
      return;
    }

    localStorage.removeItem("interviewResults");
    setQuestions(resumeQuestions);
    setCategory("resume");
    setCurrentIndex(0);
    setAnswer("");
    setAnswers([]);
    setSummary(null);
    setFeedbackError("");
    setEmotionMetrics(EMPTY_EMOTION_METRICS);
    setIsFinished(false);
    setTimeLeft(QUESTION_TIME_LIMIT);
    spokenQuestionKeyRef.current = "";
    setShowUpload(false);
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

  if (showUpload) {
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

        <ResumeUpload
          onAnalysisComplete={startResumeInterview}
          onSkip={() => setShowUpload(false)}
        />
      </div>
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
        <h2 style={{ marginBottom: "14px" }}>Camera Confidence</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            ["Confidence", emotionMetrics.confidenceScore],
            ["Eye Contact", emotionMetrics.eyeContactScore],
            ["Face Visible", emotionMetrics.faceVisibilityScore],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(148,163,184,0.12)",
              }}
            >
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>{label}</p>
              <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 800 }}>
                {value}
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>/100</span>
              </p>
            </div>
          ))}
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.72)",
              border: "1px solid rgba(148,163,184,0.12)",
            }}
          >
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "12px" }}>Dominant Emotion</p>
            <p style={{ margin: "8px 0 0", fontSize: "24px", fontWeight: 800 }}>
              {emotionMetrics.emotion}
            </p>
          </div>
        </div>
      </div>

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

      <button
        onClick={() => setShowDashboard(true)}
        style={{
          marginTop: "14px",
          padding: "14px 24px",
          fontSize: "15px",
          border: "1px solid rgba(56, 189, 248, 0.24)",
          borderRadius: "999px",
          background: "rgba(14, 165, 233, 0.16)",
          color: "#bae6fd",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Open Dashboard
      </button>
    </div>
  );
}

  // LOADING
  if (!questions.length) return <p>Loading...</p>;

  const timePercent = Math.max(
    0,
    Math.min(100, (timeLeft / QUESTION_TIME_LIMIT) * 100)
  );
  const timeState =
    timeLeft > QUESTION_TIME_LIMIT / 2
      ? "steady"
      : timeLeft > QUESTION_TIME_LIMIT / 4
      ? "warning"
      : "danger";
  const voiceState = isVoiceMuted
    ? "muted"
    : voiceStatus === "Reading question aloud"
    ? "live"
    : "ready";

  // 🎤 INTERVIEW UI
  return (
    <div className="interview-workspace">
      <div className="interview-grid-bg" />

      <header className="interview-topbar">
        <div className="arena-pill">AI Interview Arena</div>

        <div className="interview-topbar__actions">
          <button
            onClick={() => setShowDashboard(true)}
            className="ui-button ui-button--primary"
          >
            Dashboard
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.reload();
            }}
            className="ui-button ui-button--danger"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="interview-stage">
        <section className="interview-panel interview-panel--main">
          <div className="interview-title-row">
            <div>
              <p className="panel-eyebrow">Live Interview Session</p>
              <h1 className="interview-title">AI Mock Interview</h1>
            </div>

            <div className="question-count">
              <span>Question {currentIndex + 1}</span>
              <span>/</span>
              <span>{questions.length}</span>
            </div>
          </div>

          <div className="interview-progress">
          <div
              className={`interview-progress__bar interview-progress__bar--${timeState}`}
            style={{
                width: `${timePercent}%`,
            }}
          />
        </div>

          <div className="interview-meta-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={category === "resume"}
              className="interview-select"
          >
            {category === "resume" && (
              <option value="resume">Resume Based</option>
            )}
            <option value="hr">HR Interview</option>
            <option value="technical">Technical Interview</option>
          </select>
        </div>

          <article className="prompt-card">
            <p className="panel-eyebrow panel-eyebrow--muted">Current Prompt</p>
            <h2 className="prompt-card__question">
            {questions[currentIndex]?.question}
            </h2>
          </article>

          <section className="answer-panel">
            <div className="answer-panel__header">
              <div>
                <p className="panel-eyebrow panel-eyebrow--muted">Response</p>
                <p className="answer-panel__hint">
                  Answer with structure, confidence, and one memorable example.
                </p>
              </div>
            </div>

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
              rows={5}
            placeholder="Start speaking or type your response here..."
              className="answer-textarea"
          />

          {feedbackError && (
              <div className="feedback-alert">
              {feedbackError}
            </div>
          )}
          </section>
        </section>

        <aside className="interview-panel interview-panel--side">
          <section className="timer-card">
            <p className="panel-eyebrow panel-eyebrow--muted">Time Left</p>
            <strong>{timeLeft}s</strong>
            <span>Keep the answer focused.</span>
          </section>

          <section className={`voice-card voice-card--${voiceState}`}>
            <div className="voice-card__status">
              <span aria-hidden="true" />
              <div>
                <p>AI Voice</p>
                <small>{voiceStatus}</small>
              </div>
            </div>

            <button
              onClick={toggleVoiceMute}
              aria-pressed={isVoiceMuted}
              className={`ui-button ${
                isVoiceMuted ? "ui-button--danger" : "ui-button--ghost"
              }`}
            >
              {isVoiceMuted ? "Unmute Voice" : "Mute Voice"}
            </button>
          </section>

          <EmotionCamera onMetricsChange={setEmotionMetrics} compact />

          <footer className="interview-side-actions">
            <div className="speech-control">
              {!isListening ? (
                <button
                  onClick={() => startListening(setAnswer)}
                  className="ui-button ui-button--success"
                >
                  Start Speaking
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="ui-button ui-button--danger"
                >
                  Stop
                </button>
              )}

              <p className={isListening ? "speech-control__status is-live" : "speech-control__status"}>
                {isListening ? "Listening live..." : "Mic ready when you are."}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="ui-button ui-button--primary ui-button--next"
            >
              {currentIndex === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </footer>
        </aside>
      </main>
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
