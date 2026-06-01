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
    emotionMetrics: {
      confidenceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      eyeContactScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      faceVisibilityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      emotion: {
        type: String,
        enum: ["Happy", "Neutral", "Sad", "Angry", "Surprised", "Unknown"],
        default: "Unknown",
      },
    },
    skillAnalytics: {
      skillScores: {
        communication: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
        confidence: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
        react: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
        node: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
        mongodb: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
        javascript: {
          type: Number,
          min: 0,
          max: 10,
          default: 0,
        },
      },
      strengths: {
        type: [String],
        default: [],
      },
      weakAreas: {
        type: [String],
        default: [],
      },
      recommendations: {
        type: [String],
        default: [],
      },
    },
    category: {
      type: String,
      enum: ["hr", "technical", "resume"],
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
