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
        backgroundColor: "#071126",
        titleColor: "#fff",
        bodyColor: "#d8d2ff",
        borderColor: "rgba(111, 89, 245, 0.45)",
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
          color: "#53627e",
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
          color: "#66728a",
          stepSize: 2,
        },
        grid: {
          color: "rgba(83, 98, 126, 0.12)",
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
    <div className="chart-card score-chart-card">
      <div className="chart-card__header">
        <div>
          <p className="app-eyebrow">
            Score Insights
          </p>
          <h2>Performance Overview</h2>
        </div>

        <div className="chart-average">
          <p>Average</p>
          <strong>
            {averageScore}
            <small>/10</small>
          </strong>
        </div>
      </div>

      <div className="chart-card__body">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default ScoreChart;
