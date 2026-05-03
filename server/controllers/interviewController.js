const Result = require("../models/Result");
const { getInterviewEvaluation } = require("../services/aiService");

// 🔥 MAIN CONTROLLER (JWT PROTECTED)
const generateFeedback = async (req, res, next) => {
  try {
    const { answers, category } = req.body;

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

    const { results, summary } = await getInterviewEvaluation(
      normalizedAnswers,
      category || "hr"
    );

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
