const questions = require("../data/questions.json");

const getQuestions = (req, res) => {
  res.json(questions);
};

module.exports = { getQuestions };