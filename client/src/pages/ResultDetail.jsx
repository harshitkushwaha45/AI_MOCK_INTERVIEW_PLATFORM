import { useEffect, useState } from "react";
import { authFetch, readJson } from "../api";
import ScoreChart from "../components/ScoreChart";
import SkillAnalyticsChart from "../components/SkillAnalyticsChart";

const getScoreTone = (score) => {
  if (score >= 7) return "good";
  if (score >= 5) return "warning";
  return "danger";
};

function ResultDetail({ resultId, onBack }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await authFetch(`/api/results/${resultId}`);
        const data = await readJson(res);
        setData(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [resultId]);

  if (!data) {
    return (
      <div className="app-page">
        <div className="app-page__inner app-page__inner--narrow">
          <div className="status-panel">Loading interview details...</div>
        </div>
      </div>
    );
  }

  const score = Number(data.summary?.averageScore) || 0;
  const emotionMetrics = data.emotionMetrics || {};
  const scoreTone = getScoreTone(score);

  return (
    <div className="app-page app-page--detail">
      <div className="app-page__inner">
        <button className="front-back-button" onClick={onBack} type="button">
          ← Back
        </button>

        <header className="app-page-header app-page-header--compact">
          <div>
            <p className="app-eyebrow">Interview Breakdown</p>
            <h1>Interview Details</h1>
            <p>
              Review the full session, compare camera signals, and turn each
              answer into a clearer next practice target.
            </p>
          </div>

          <div className={`score-badge score-badge--${scoreTone} score-badge--large`}>
            <span>Overall Score</span>
            <strong>
              {score}
              <small>/10</small>
            </strong>
          </div>
        </header>

        <section className="detail-panel">
          <p className="app-eyebrow">Camera Analysis</p>
          <h2>Confidence and emotion signals</h2>

          <div className="metric-grid">
            <MetricTile label="Confidence" value={`${emotionMetrics.confidenceScore || 0}/100`} />
            <MetricTile label="Eye Contact" value={`${emotionMetrics.eyeContactScore || 0}/100`} />
            <MetricTile label="Face Visibility" value={`${emotionMetrics.faceVisibilityScore || 0}/100`} />
            <MetricTile label="Dominant Emotion" value={emotionMetrics.emotion || "Unknown"} />
          </div>
        </section>

        <section className="detail-panel">
          <div className="score-track score-track--wide" aria-hidden="true">
            <span
              className={`score-track__bar score-track__bar--${scoreTone}`}
              style={{ width: `${Math.min(score * 10, 100)}%` }}
            />
          </div>

          <div className="summary-grid">
            <SummaryTile title="Strengths" text={data.summary?.strengths} tone="good" />
            <SummaryTile title="Weaknesses" text={data.summary?.weaknesses} tone="warning" />
            <SummaryTile title="Suggestions" text={data.summary?.suggestions} tone="info" />
          </div>
        </section>

        <SkillAnalyticsChart
          scores={data.skillAnalytics?.skillScores || {}}
          title="Skill Breakdown"
        />

        {data.skillAnalytics && (
          <div className="insight-grid">
            <InsightList
              title="Strengths"
              items={data.skillAnalytics.strengths}
              tone="good"
            />
            <InsightList
              title="Weak Areas"
              items={data.skillAnalytics.weakAreas}
              tone="warning"
            />
            <InsightList
              title="Recommendations"
              items={data.skillAnalytics.recommendations}
              tone="info"
            />
          </div>
        )}

        <div className="section-heading">
          <p className="app-eyebrow">Answer Review</p>
          <h2>Question-by-question feedback</h2>
        </div>

        <div className="answer-review-list">
          {data?.answers?.map((item, index) => (
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

        <ScoreChart answers={data.answers} />
      </div>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="metric-tile">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryTile({ title, text, tone }) {
  return (
    <article className={`summary-tile summary-tile--${tone}`}>
      <p className="app-eyebrow">{title}</p>
      <span>{text || "No data yet"}</span>
    </article>
  );
}

function InsightList({ title, items = [], tone }) {
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

export default ResultDetail;
