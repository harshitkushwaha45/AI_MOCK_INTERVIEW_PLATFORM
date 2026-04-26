import { useEffect, useState } from "react";

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSaved, setIsSaved] = useState(false); // 🔥 SAVE MESSAGE

  // 🔥 LOAD SAVED RESULTS
  useEffect(() => {
    const saved = localStorage.getItem("interviewResults");

    if (saved) {
      setAnswers(JSON.parse(saved));
      setIsFinished(true);
      setIsSaved(true);
    }
  }, []);

  // Fetch questions
  useEffect(() => {
    fetch("http://localhost:5000/api/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error(err));
  }, []);

  // 🔥 TIMER LOGIC
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

  // Handle next / finish
  const handleNext = async () => {
    const updatedAnswers = [
      ...answers,
      {
        question: questions[currentIndex].question,
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
        const res = await fetch(
          "http://localhost:5000/api/interview/feedback",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers: updatedAnswers }),
          }
        );

        const data = await res.json();

        // 🔥 SAVE RESULTS
        localStorage.setItem(
          "interviewResults",
          JSON.stringify(data.results)
        );

        setAnswers(data.results);
        setIsFinished(true);

        // 🔥 SHOW SAVE MESSAGE
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // RESULT SCREEN
  if (isFinished) {
    const totalScore = answers.reduce((sum, item) => {
      const match = item.feedback.match(/(\d+)\/10/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);

    const avgScore = (totalScore / answers.length).toFixed(1);

    return (
      <div
        style={{
          padding: "30px",
          backgroundColor: "#0f172a",
          minHeight: "100vh",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <h1 style={{ textAlign: "center" }}>Interview Completed 🎉</h1>

        <h2 style={{ textAlign: "center", color: "#38bdf8" }}>
          Overall Score: {avgScore}/10
        </h2>

        {/* 🔥 SAVE MESSAGE */}
        {isSaved && (
          <p style={{ textAlign: "center", color: "lightgreen" }}>
            ✅ Results saved successfully
          </p>
        )}

        {answers.map((item, index) => {
          const scoreMatch = item.feedback.match(/(\d+)\/10/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

          return (
            <div
              key={index}
              style={{
                background: "#1e293b",
                padding: "20px",
                marginBottom: "20px",
                borderRadius: "10px",
                borderLeft: `5px solid ${
                  score >= 7 ? "green" : score >= 5 ? "orange" : "red"
                }`,
              }}
            >
              <p><strong>Q:</strong> {item.question}</p>
              <p><strong>Your Answer:</strong> {item.answer}</p>
              <p>
                <strong>AI Feedback:</strong>{" "}
                <span style={{ color: "#38bdf8" }}>
                  {item.feedback}
                </span>
              </p>
            </div>
          );
        })}

        {/* 🔥 RESTART BUTTON */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => {
              localStorage.removeItem("interviewResults");
              window.location.reload();
            }}
            style={{
              marginTop: "20px",
              padding: "12px 25px",
              borderRadius: "8px",
              backgroundColor: "#38bdf8",
              border: "none",
              cursor: "pointer",
            }}
          >
            Restart Interview
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (questions.length === 0) return <p>Loading...</p>;

  // INTERVIEW UI
  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ textAlign: "center" }}>AI Mock Interview</h1>

      <div
        style={{
          maxWidth: "600px",
          margin: "30px auto",
          background: "#1e293b",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        <h3 style={{ color: timeLeft <= 10 ? "red" : "white" }}>
          ⏱ Time Left: {timeLeft}s
        </h3>

        <h3>
          Question {currentIndex + 1} of {questions.length}
        </h3>

        <p><strong>Q:</strong> {questions[currentIndex].question}</p>

        <textarea
          rows="5"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
          }}
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <br /><br />

        <button
          onClick={handleNext}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            backgroundColor: "#38bdf8",
            border: "none",
            cursor: "pointer",
          }}
        >
          {currentIndex === questions.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default App;