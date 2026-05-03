const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    answers: [
      {
        question: String,
        answer: String,
        feedback: String,
      },
    ],
    summary: {
      averageScore: Number,
      strengths: String,
      weaknesses: String,
      suggestions: String,
    },
    category: {
      type: String,
      enum: ["hr", "technical"],
    },
    user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", resultSchema);