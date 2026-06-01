const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// 🔥 CONNECT DATABASE FIRST
connectDB();

// 🔥 MIDDLEWARE
app.use(cors());
app.use(express.json());

// 🔥 ROUTES
const interviewRoutes = require("./routes/interviewRoutes");
const questionRoutes = require("./routes/questionRoutes");
const resultRoutes = require("./routes/resultRoutes");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");


app.use("/api/interview", interviewRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "AI Mock Interview API is running" });
});

const clientDistPath = path.join(__dirname, "..", "client", "dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
    res.sendFile(clientIndexPath, (err) => {
      if (err) {
        next(err);
      }
    });
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "AI Mock Interview API is running" });
  });
}

// 🔥 GLOBAL ERROR HANDLER (always last)
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

// 🔥 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
