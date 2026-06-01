import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { SKILL_LABELS } from "../utils/skillLabels";

ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

const SKILL_KEYS = Object.keys(SKILL_LABELS);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#cbd5e1",
      },
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#fff",
      bodyColor: "#7dd3fc",
      borderColor: "rgba(56, 189, 248, 0.5)",
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
    },
  },
  scales: {
    x: {
      ticks: { color: "#cbd5e1" },
      grid: { display: false },
    },
    y: {
      min: 0,
      max: 10,
      ticks: { color: "#94a3b8", stepSize: 2 },
      grid: { color: "rgba(148,163,184,0.08)" },
    },
  },
};

function SkillAnalyticsChart({ scores = {}, progress = [], title = "Skill Analytics" }) {
  const skillValues = SKILL_KEYS.map((skill) => Number(scores?.[skill]) || 0);
  const hasProgress = Array.isArray(progress) && progress.length > 1;
  const barData = {
    labels: SKILL_KEYS.map((skill) => SKILL_LABELS[skill]),
    datasets: [
      {
        label: "Skill Score",
        data: skillValues,
        backgroundColor: skillValues.map((score) =>
          score >= 7
            ? "rgba(34,197,94,0.82)"
            : score >= 5
            ? "rgba(245,158,11,0.82)"
            : "rgba(239,68,68,0.82)"
        ),
        borderRadius: 10,
      },
    ],
  };
  const progressData = {
    labels: progress.map((item, index) =>
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : `Session ${index + 1}`
    ),
    datasets: SKILL_KEYS.map((skill, index) => ({
      label: SKILL_LABELS[skill],
      data: progress.map((item) => Number(item?.[skill]) || 0),
      borderColor: [
        "#38bdf8",
        "#22c55e",
        "#f59e0b",
        "#a78bfa",
        "#fb7185",
        "#facc15",
      ][index],
      backgroundColor: "transparent",
      tension: 0.35,
      pointRadius: 3,
    })),
  };

  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "24px",
        background:
          "linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.95))",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 18px 40px rgba(2, 6, 23, 0.34)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#7dd3fc",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: "12px",
        }}
      >
        {hasProgress ? "Progress Chart" : "Skill Cards"}
      </p>
      <h2 style={{ margin: "10px 0 18px", fontSize: "28px" }}>{title}</h2>

      <div style={{ height: hasProgress ? "320px" : "300px" }}>
        {hasProgress ? (
          <Line data={progressData} options={chartOptions} />
        ) : (
          <Bar data={barData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

export default SkillAnalyticsChart;
