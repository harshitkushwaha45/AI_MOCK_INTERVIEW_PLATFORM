const questions = require("../data/questions.json");

const getQuestions = (req, res) => {
  const { category } = req.query;

  // If no category → return all
  if (!category) {
    return res.json(questions);
  }

  // Filter based on category
  const filteredQuestions = questions.filter(
    (q) => q.category === category
  );

  res.json(filteredQuestions);
};

module.exports = { getQuestions };