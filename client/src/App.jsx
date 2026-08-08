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
import { ArenaShell } from "./components/ArenaShell";

const QUESTION_TIME_LIMIT = 120;
const EMPTY_EMOTION_METRICS = {
  confidenceScore: 0,
  eyeContactScore: 0,
  faceVisibilityScore: 0,
  emotion: "Unknown",
};

function App() {
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

  const handleAuthExpired = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setAuthMode("login");
    setShowUpload(true);
    setShowDashboard(false);
    setSelectedResultId(null);
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
          className="floating-back-button"
        >
          ← Back
        </button>

        <Dashboard onSelect={setSelectedResultId} />
      </>
    );
  }

  if (showUpload) {
    return (
      <ArenaShell
        rightAction={
          <div className="arena-app-actions">
            <button
              className="arena-text-button"
              onClick={() => setShowDashboard(true)}
              type="button"
            >
              Dashboard
            </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.reload();
            }}
              className="arena-outline-button"
              type="button"
          >
            Logout
          </button>
          </div>
        }
      >

        <ResumeUpload
          onAnalysisComplete={startResumeInterview}
          onAuthExpired={handleAuthExpired}
          onSkip={() => setShowUpload(false)}
        />
      </ArenaShell>
    );
  }

  // RESULT SCREEN
  if (isFinished) {
    const summaryScore = Number(summary?.averageScore) || 0;
    const summaryTone =
      summaryScore >= 7 ? "good" : summaryScore >= 5 ? "warning" : "danger";

    return (
      <div className="app-page app-page--results">
        <div className="app-page__inner app-page__inner--narrow">
          <button
            className="front-back-button"
            onClick={() => setShowDashboard(true)}
            type="button"
          >
            Open Dashboard
          </button>

          <header className="completion-header">
            <p className="app-eyebrow">Final Review</p>
            <h1>Interview Completed</h1>
            <p>
              Here is your score, camera signal summary, and answer feedback from
              this practice session.
            </p>
          </header>

          {summary && (
            <section className="detail-panel">
              <div className="completion-summary-top">
                <div>
                  <p className="app-eyebrow">Summary</p>
                  <h2>Session outcome</h2>
                </div>

                <div className={`score-badge score-badge--${summaryTone}`}>
                  <span>Score</span>
                  <strong>
                    {summary.averageScore}
                    <small>/10</small>
                  </strong>
                </div>
              </div>

              <div className="summary-grid">
                <article className="summary-tile summary-tile--good">
                  <p className="app-eyebrow">Strengths</p>
                  <span>{summary.strengths}</span>
                </article>
                <article className="summary-tile summary-tile--warning">
                  <p className="app-eyebrow">Weaknesses</p>
                  <span>{summary.weaknesses}</span>
                </article>
                <article className="summary-tile summary-tile--info">
                  <p className="app-eyebrow">Suggestions</p>
                  <span>{summary.suggestions}</span>
                </article>
              </div>
            </section>
          )}

          <section className="detail-panel">
            <p className="app-eyebrow">Camera Confidence</p>
            <h2>Interview presence signals</h2>

            <div className="metric-grid">
              <div className="metric-tile">
                <p>Confidence</p>
                <strong>{emotionMetrics.confidenceScore}/100</strong>
              </div>
              <div className="metric-tile">
                <p>Eye Contact</p>
                <strong>{emotionMetrics.eyeContactScore}/100</strong>
              </div>
              <div className="metric-tile">
                <p>Face Visible</p>
                <strong>{emotionMetrics.faceVisibilityScore}/100</strong>
              </div>
              <div className="metric-tile">
                <p>Dominant Emotion</p>
                <strong>{emotionMetrics.emotion}</strong>
              </div>
            </div>
          </section>

          <div className="answer-review-list">
            {answers.map((item, index) => (
              <article className="answer-review-card" key={`${item.question}-${index}`}>
                <span className="question-chip">Question {index + 1}</span>
                <p className="answer-review-card__label">Prompt</p>
                <h3>{item.question}</h3>
                <p className="answer-review-card__label">Your Answer</p>
                <p>{item.answer}</p>
                <div className="feedback-box">
                  <p className="answer-review-card__label">AI Feedback</p>
                  <p>{item.feedback}</p>
                </div>
              </article>
            ))}
          </div>

          <ScoreChart answers={answers} />

          <div className="completion-actions">
            <button
              className="resume-primary-button"
              onClick={restartInterview}
              type="button"
            >
              Restart Interview
            </button>

            <button
              className="resume-secondary-button"
              onClick={() => setShowDashboard(true)}
              type="button"
            >
              Open Dashboard
            </button>
          </div>
        </div>
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
                  onClick={() => startListening(setAnswer, answer)}
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

export default App;
