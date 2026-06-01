const Result = require("../models/Result");
const { getInterviewEvaluation } = require("../services/aiService");

const clampScore = (value) => {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const normalizeEmotionMetrics = (metrics = {}) => {
  const allowedEmotions = ["Happy", "Neutral", "Sad", "Angry", "Surprised"];
  const emotion = allowedEmotions.includes(metrics.emotion)
    ? metrics.emotion
    : "Unknown";

  return {
    confidenceScore: clampScore(metrics.confidenceScore),
    eyeContactScore: clampScore(metrics.eyeContactScore),
    faceVisibilityScore: clampScore(metrics.faceVisibilityScore),
    emotion,
  };
};

const normalizeSkillAnalytics = (analytics = {}) => {
  const skillScores = analytics.skillScores || {};
  const normalizeList = (items) =>
    Array.isArray(items)
      ? items.filter((item) => typeof item === "string" && item.trim()).slice(0, 5)
      : [];

  return {
    skillScores: {
      communication: Math.max(0, Math.min(10, Math.round(Number(skillScores.communication) || 0))),
      confidence: Math.max(0, Math.min(10, Math.round(Number(skillScores.confidence) || 0))),
      react: Math.max(0, Math.min(10, Math.round(Number(skillScores.react) || 0))),
      node: Math.max(0, Math.min(10, Math.round(Number(skillScores.node) || 0))),
      mongodb: Math.max(0, Math.min(10, Math.round(Number(skillScores.mongodb) || 0))),
      javascript: Math.max(0, Math.min(10, Math.round(Number(skillScores.javascript) || 0))),
    },
    strengths: normalizeList(analytics.strengths),
    weakAreas: normalizeList(analytics.weakAreas),
    recommendations: normalizeList(analytics.recommendations),
  };
};

// 🔥 MAIN CONTROLLER (JWT PROTECTED)
const generateFeedback = async (req, res, next) => {
  try {
    const { answers, category, emotionMetrics } = req.body;

    // 🚨 IMPORTANT: user must exist (from protect middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!Array.isArray(answers) || !answers.length) {
      return res.status(400).json({ message: "Answers are required" });
    }

    const normalizedAnswers = answers.map((item) => ({
      question: item?.question || "",
      answer: item?.answer || "No answer",
    }));

    const { results, summary, skillAnalytics } = await getInterviewEvaluation(
      normalizedAnswers,
      category || "hr"
    );

    // ✅ SAVE TO DATABASE WITH USER
    const savedResult = await Result.create({
      user: req.user._id, // 🔥 JWT USER LINK
      answers: results,
      summary,
      category,
      emotionMetrics: normalizeEmotionMetrics(emotionMetrics),
      skillAnalytics: normalizeSkillAnalytics(skillAnalytics),
    });

    // ✅ RESPONSE
    res.json({
      results,
      summary,
      emotionMetrics: savedResult.emotionMetrics,
      skillAnalytics: savedResult.skillAnalytics,
      id: savedResult._id,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = { generateFeedback };
