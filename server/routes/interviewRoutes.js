const express = require("express");
const router = express.Router();
const { generateFeedback } = require("../controllers/interviewController");
const { protect } = require("../middleware/authMiddleware");

router.post("/feedback", protect, generateFeedback);
module.exports = router;
