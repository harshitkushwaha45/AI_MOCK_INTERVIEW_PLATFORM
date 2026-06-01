const express = require("express");
const router = express.Router();
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const { protect } = require("../middleware/authMiddleware");
const {
  analyzeResumeText,
  generateResumeInterviewQuestions,
} = require("../services/aiService");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfName = /\.pdf$/i.test(file.originalname || "");

    if (!isPdfMime && !isPdfName) {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

// 📄 Upload + extract text
router.post("/upload", protect, upload.single("resume"), async (req, res) => {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF resume" });
    }

    parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    const text = (pdfData.text || "").replace(/\s+/g, " ").trim();

    if (!text) {
      return res.status(400).json({
        message: "The PDF does not contain readable text",
      });
    }

    const [analysis, questions] = await Promise.all([
      analyzeResumeText(text),
      generateResumeInterviewQuestions(text),
    ]);

    res.json({
      fileName: req.file.originalname,
      text,
      analysis,
      questions,
    });
  } catch (err) {
    console.error(err);

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "PDF must be smaller than 5MB" });
    }

    if (err.message === "Only PDF files are allowed") {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "PDF processing failed" });
  } finally {
    if (parser && typeof parser.destroy === "function") {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error("PDF parser cleanup failed:", destroyError.message);
      }
    }
  }
});

router.post("/generate-questions", protect, async (req, res, next) => {
  try {
    const text = (req.body?.text || "").replace(/\s+/g, " ").trim();

    if (!text) {
      return res.status(400).json({ message: "Resume text is required" });
    }

    const questions = await generateResumeInterviewQuestions(text);

    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
