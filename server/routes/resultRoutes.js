const express = require("express");
const router = express.Router();

// 🔥 IMPORT CONTROLLERS
const {
  getResults,
  getResultById,
  getSkillAnalytics,
} = require("../controllers/resultController");

// 🔐 AUTH MIDDLEWARE
const { protect } = require("../middleware/authMiddleware");

// ✅ PROTECTED ROUTES
router.get("/", protect, getResults);
router.get("/analytics/skills", protect, getSkillAnalytics);
router.get("/:id", protect, getResultById);

module.exports = router;
