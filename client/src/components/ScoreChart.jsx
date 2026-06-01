import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function ScoreChart({ answers = [] }) {
  if (!answers.length) return null;

  const scores = answers.map((item) => {
    if (!item?.feedback) return 0;

    let match = item.feedback.match(/(\d+)\s*\/\s*10/);
    if (!match) {
      match = item.feedback.match(/score\s*[:-]?\s*(\d+)/i);
    }

    return match ? parseInt(match[1]) : 0;
  });

  const data = {
    labels: answers.map((_, i) => `Q${i + 1}`),
    datasets: [
      {
        label: "Score",
        data: scores,

        // 🔥 GRADIENT COLORS
        backgroundColor: scores.map((score) =>
          score >= 7
            ? "rgba(34,197,94,0.85)"
            : score >= 5
            ? "rgba(245,158,11,0.85)"
            : "rgba(239,68,68,0.85)"
        ),
        hoverBackgroundColor: scores.map((score) =>
          score >= 7
            ? "rgba(74,222,128,1)"
            : score >= 5
            ? "rgba(251,191,36,1)"
            : "rgba(248,113,113,1)"
        ),
        borderRadius: 12,
        barThickness: 50,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#fff",
        bodyColor: "#7dd3fc",
        borderColor: "rgba(56, 189, 248, 0.5)",
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (ctx) => `Score: ${ctx.raw}/10`,
        },
      },
    },

    scales: {
      x: {
        ticks: {
          color: "#cbd5e1",
          font: { size: 13, weight: "600" },
        },
        grid: {
          display: false,
        },
      },

      y: {
        min: 0,
        max: 10,
        ticks: {
          color: "#94a3b8",
          stepSize: 2,
        },
        grid: {
          color: "rgba(148,163,184,0.08)",
          drawBorder: false,
        },
      },
    },

    animation: {
      duration: 1200,
      easing: "easeOutQuart",
    },
  };

  const averageScore = (
    scores.reduce((sum, current) => sum + current, 0) / scores.length
  ).toFixed(1);

  return (
    <div
      style={{
        marginTop: "34px",
        padding: "28px",
        background:
          "linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
        borderRadius: "26px",
        boxShadow: "0 18px 40px rgba(2, 6, 23, 0.34)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
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
            Score Insights
          </p>
          <h2
            style={{
              margin: "10px 0 0",
              fontSize: "28px",
            }}
          >
            Performance Overview
          </h2>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: "18px",
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(56, 189, 248, 0.16)",
            minWidth: "130px",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Average</p>
          <p style={{ margin: "8px 0 0", fontSize: "26px", fontWeight: 800, color: "#f8fafc" }}>
            {averageScore}
            <span style={{ fontSize: "13px", color: "#cbd5e1" }}>/10</span>
          </p>
        </div>
      </div>

      <div style={{ height: "300px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default ScoreChart;
