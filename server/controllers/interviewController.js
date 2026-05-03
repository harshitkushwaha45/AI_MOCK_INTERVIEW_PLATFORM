const Result = require("../models/Result");

// 🔥 SUMMARY FUNCTION
const generateSummary = (results) => {
  let totalScore = 0;
  let strengths = [];
  let weaknesses = [];

  results.forEach((item) => {
    const match = item.feedback?.match(/(\d+)\/10/);
    const score = match ? parseInt(match[1]) : 5;

    totalScore += score;

    if (score >= 7) {
      strengths.push(item.question);
    } else {
      weaknesses.push(item.question);
    }
  });

  const averageScore = results.length
    ? (totalScore / results.length).toFixed(1)
    : 0;

  return {
    averageScore,
    strengths:
      strengths.length > 0
        ? strengths.join(", ")
        : "No strong answers yet",
    weaknesses:
      weaknesses.length > 0
        ? weaknesses.join(", ")
        : "No weak areas",
    suggestions:
      "Try to give structured answers with examples and clarity.",
  };
};

// 🔥 MAIN CONTROLLER (JWT PROTECTED)
const generateFeedback = async (req, res, next) => {
  try {
    const { answers, category } = req.body;

    // 🚨 IMPORTANT: user must exist (from protect middleware)
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ GENERATE FEEDBACK
    const results = answers.map((item) => ({
      question: item.question,
      answer: item.answer,
      feedback:
        item.answer.length > 20
          ? "Good answer. Try to add more structure. Score: 7/10"
          : "Answer is too short. Try to explain more clearly. Score: 5/10",
    }));

    // ✅ GENERATE SUMMARY
    const summary = generateSummary(results);

    // ✅ SAVE TO DATABASE WITH USER
    const savedResult = await Result.create({
      user: req.user._id, // 🔥 JWT USER LINK
      answers: results,
      summary,
      category,
    });

    // ✅ RESPONSE
    res.json({
      results,
      summary,
      id: savedResult._id,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = { generateFeedback };