const express = require("express");
const router = express.Router();

// 🔥 IMPORT CONTROLLERS
const {
  getResults,
  getResultById,
} = require("../controllers/resultController");

// 🔐 AUTH MIDDLEWARE
const { protect } = require("../middleware/authMiddleware");

// ✅ PROTECTED ROUTES
router.get("/", protect, getResults);
router.get("/:id", protect, getResultById);

module.exports = router;