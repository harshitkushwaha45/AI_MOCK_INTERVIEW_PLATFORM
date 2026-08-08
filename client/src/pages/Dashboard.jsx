import { useEffect, useState } from "react";
import { authFetch, readJson } from "../api";
import SkillAnalyticsChart from "../components/SkillAnalyticsChart";
import { SKILL_LABELS } from "../utils/skillLabels";

const getScoreTone = (score) => {
  if (score >= 7) return "good";
  if (score >= 5) return "warning";
  return "danger";
};

function Dashboard({ onSelect }) {
  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const averageScore = results.length
    ? (
        results.reduce(
          (sum, item) => sum + (Number(item.summary?.averageScore) || 0),
          0
        ) / results.length
      ).toFixed(1)
    : "0.0";
  const averageConfidence = results.length
    ? Math.round(
        results.reduce(
          (sum, item) => sum + (Number(item.emotionMetrics?.confidenceScore) || 0),
          0
        ) / results.length
      )
    : 0;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [resultsRes, analyticsRes] = await Promise.all([
          authFetch("/api/results"),
          authFetch("/api/results/analytics/skills"),
        ]);
        const resultsData = await readJson(resultsRes);
        const analyticsData = await readJson(analyticsRes);

        if (!resultsRes.ok) {
          throw new Error(resultsData.message || "Could not load interview history");
        }

        if (!analyticsRes.ok) {
          throw new Error(analyticsData.message || "Could not load skill analytics");
        }

        setResults(Array.isArray(resultsData) ? resultsData : []);
        setAnalytics(analyticsData || null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Dashboard failed to load");
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="app-page app-page--dashboard">
      <div className="app-page__inner">
        <header className="app-page-header">
          <div>
            <p className="app-eyebrow">Performance Hub</p>
            <h1>Interview Dashboard</h1>
            <p>
              Review every interview session, compare scores quickly, and open a
              detailed breakdown when you want to improve the next attempt.
            </p>
          </div>

          <div className="stat-row">
            <StatCard label="Total Interviews" value={results.length} />
            <StatCard label="Average Score" value={`${averageScore}/10`} />
            <StatCard label="Avg Confidence" value={`${averageConfidence}/100`} />
          </div>
        </header>

        {loading ? (
          <StatusPanel message="Loading interview history..." />
        ) : error ? (
          <StatusPanel tone="danger" message={error} />
        ) : results.length === 0 ? (
          <StatusPanel message="No interviews yet" />
        ) : (
          <>
            <SkillAnalyticsSummary analytics={analytics} />

            <div className="dashboard-chart">
              <SkillAnalyticsChart
                scores={analytics?.averages || {}}
                progress={analytics?.progress || []}
                title="Skill Progress Across Interviews"
              />
            </div>

            <section className="session-grid" aria-label="Interview sessions">
              {results.map((item) => {
                const score = Number(item.summary?.averageScore) || 0;
                const confidenceScore =
                  Number(item.emotionMetrics?.confidenceScore) || 0;
                const skillScores = item.skillAnalytics?.skillScores || {};
                const scoreTone = getScoreTone(score);
                const label =
                  score >= 7
                    ? "Strong performance"
                    : score >= 5
                    ? "Needs polish"
                    : "Needs practice";

                return (
                  <button
                    className="session-card"
                    key={item._id}
                    onClick={() => onSelect(item._id)}
                    type="button"
                  >
                    <div className="session-card__top">
                      <div>
                        <p className="app-eyebrow">
                          {item.category?.toUpperCase()} Interview
                        </p>
                        <h2>Session Review</h2>
                      </div>

                      <div className={`score-badge score-badge--${scoreTone}`}>
                        <span>Score</span>
                        <strong>
                          {score}
                          <small>/10</small>
                        </strong>
                      </div>
                    </div>

                    <div className="score-track" aria-hidden="true">
                      <span
                        className={`score-track__bar score-track__bar--${scoreTone}`}
                        style={{ width: `${Math.min(score * 10, 100)}%` }}
                      />
                    </div>

                    <p className="session-card__label">{label}</p>
                    <p className="session-card__meta">
                      Confidence: <strong>{confidenceScore}/100</strong>
                      <span> · </span>
                      Emotion: <strong>{item.emotionMetrics?.emotion || "Unknown"}</strong>
                    </p>

                    <div className="skill-pill-row">
                      {Object.entries(skillScores)
                        .sort((a, b) => Number(b[1]) - Number(a[1]))
                        .slice(0, 3)
                        .map(([skill, value]) => (
                          <span className="skill-pill" key={skill}>
                            {SKILL_LABELS[skill] || skill}: {value}/10
                          </span>
                        ))}
                    </div>

                    <time className="session-card__date">
                      {new Date(item.createdAt).toLocaleString()}
                    </time>

                    <span className="session-card__footer">
                      View full interview
                      <span aria-hidden="true">→</span>
                    </span>
                  </button>
                );
              })}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPanel({ message, tone = "neutral" }) {
  return (
    <div className={`status-panel status-panel--${tone}`}>
      {message}
    </div>
  );
}

function SkillAnalyticsSummary({ analytics }) {
  const strengths = analytics?.strengths || [];
  const weakAreas = analytics?.weakAreas || [];
  const recommendations = analytics?.recommendations || [];

  return (
    <div className="insight-grid">
      <InsightPanel title="Strengths" items={strengths.map((item) => item.label || item)} tone="good" />
      <InsightPanel title="Weak Areas" items={weakAreas.map((item) => item.label || item)} tone="warning" />
      <InsightPanel title="Recommendations" items={recommendations} tone="info" />
    </div>
  );
}

function InsightPanel({ title, items, tone }) {
  return (
    <article className={`insight-card insight-card--${tone}`}>
      <p className="app-eyebrow">{title}</p>
      <ul>
        {(items.length ? items : ["No data yet"]).map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export default Dashboard;
