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
        color: "#53627e",
      },
    },
    tooltip: {
      backgroundColor: "#071126",
      titleColor: "#fff",
      bodyColor: "#d8d2ff",
      borderColor: "rgba(111, 89, 245, 0.45)",
      borderWidth: 1,
      cornerRadius: 12,
      padding: 12,
    },
  },
  scales: {
    x: {
      ticks: { color: "#53627e" },
      grid: { display: false },
    },
    y: {
      min: 0,
      max: 10,
      ticks: { color: "#66728a", stepSize: 2 },
      grid: { color: "rgba(83, 98, 126, 0.12)" },
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
    <div className="chart-card">
      <p className="app-eyebrow">
        {hasProgress ? "Progress Chart" : "Skill Cards"}
      </p>
      <h2>{title}</h2>

      <div
        className={
          hasProgress
            ? "chart-card__body chart-card__body--progress"
            : "chart-card__body"
        }
      >
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
