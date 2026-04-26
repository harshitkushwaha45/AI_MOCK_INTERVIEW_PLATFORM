const { getFeedback } = require("../services/aiService");

const generateFeedback = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({ message: "No answers provided" });
    }

    const results = [];

    for (let item of answers) {
      const feedback = await getFeedback(item.question, item.answer);

      results.push({
        question: item.question,
        answer: item.answer,
        feedback,
      });
    }

    res.json({ results });
  } catch (error) {
    console.error("🔥 BACKEND ERROR:", error);
    res.status(500).json({ message: "AI error" });
  }
};

module.exports = { generateFeedback };