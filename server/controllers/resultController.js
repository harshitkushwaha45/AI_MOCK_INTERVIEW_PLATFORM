const Result = require("../models/Result");

// 🔥 GET ALL RESULTS
const getResults = async (req, res, next) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// 🔥 GET SINGLE RESULT BY ID
const getResultById = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

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

module.exports = { getResults, getResultById };