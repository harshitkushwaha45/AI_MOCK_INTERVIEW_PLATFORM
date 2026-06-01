const Result = require("../models/Result");

const SKILL_LABELS = {
  communication: "Communication",
  confidence: "Confidence",
  react: "React",
  node: "Node",
  mongodb: "MongoDB",
  javascript: "JavaScript",
};

const SKILL_KEYS = Object.keys(SKILL_LABELS);

// 🔥 GET ALL RESULTS
const getResults = async (req, res, next) => {
  try {
    const results = await Result.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// 🔥 GET SINGLE RESULT BY ID
const getResultById = async (req, res, next) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        message: "Result not found",
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getSkillAnalytics = async (req, res, next) => {
  try {
    const results = await Result.find({ user: req.user._id }).sort({ createdAt: 1 });
    const totals = SKILL_KEYS.reduce((acc, skill) => {
      acc[skill] = 0;
      return acc;
    }, {});
    const recommendationCounts = {};
    const progress = [];

    results.forEach((result) => {
      const scores = result.skillAnalytics?.skillScores || {};
      const progressItem = {
        id: result._id,
        createdAt: result.createdAt,
      };

      SKILL_KEYS.forEach((skill) => {
        const score = Number(scores[skill]) || 0;
        totals[skill] += score;
        progressItem[skill] = score;
      });

      (result.skillAnalytics?.recommendations || []).forEach((item) => {
        recommendationCounts[item] = (recommendationCounts[item] || 0) + 1;
      });

      progress.push(progressItem);
    });

    const averages = SKILL_KEYS.reduce((acc, skill) => {
      acc[skill] = results.length ? Number((totals[skill] / results.length).toFixed(1)) : 0;
      return acc;
    }, {});
    const ranked = SKILL_KEYS.map((skill) => ({
      key: skill,
      label: SKILL_LABELS[skill],
      score: averages[skill],
    })).sort((a, b) => b.score - a.score);

    res.json({
      averages,
      strengths: ranked.filter((item) => item.score >= 7).slice(0, 4),
      weakAreas: [...ranked].reverse().filter((item) => item.score <= 6).slice(0, 4),
      recommendations: Object.entries(recommendationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([text]) => text),
      progress,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getResults, getResultById, getSkillAnalytics };
