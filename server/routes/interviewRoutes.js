const express = require("express");
const router = express.Router();

const { generateFeedback } = require("../controllers/interviewController");

router.post("/feedback", generateFeedback);

module.exports = router;