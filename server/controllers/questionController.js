const questions = require("../data/questions.json");
const { getInterviewQuestions } = require("../services/aiService");

const getQuestions = async (req, res, next) => {
  const { category } = req.query;

  // If no category → return all
  if (!category) {
    return res.json(questions);
  }

  const filteredQuestions = questions.filter((q) => q.category === category);

  try {
    const aiQuestions = await getInterviewQuestions(category, filteredQuestions);
    res.json(aiQuestions.length ? aiQuestions : filteredQuestions);
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions };
