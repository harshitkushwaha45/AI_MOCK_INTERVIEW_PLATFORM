const express = require("express");
const router = express.Router();

const { getQuestions } = require("../controllers/questionController");

router.get("/", getQuestions);

module.exports = router;