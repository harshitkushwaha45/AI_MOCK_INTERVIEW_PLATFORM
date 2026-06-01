const https = require("https");
const OpenAI = require("openai");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_HOST = "generativelanguage.googleapis.com";
const GEMINI_PATH = `/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2";

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const getAiProvider = () => (process.env.AI_PROVIDER || "gemini").toLowerCase();
const SKILL_KEYS = [
  "communication",
  "confidence",
  "react",
  "node",
  "mongodb",
  "javascript",
];

const stripCodeFences = (text = "") =>
  text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

const extractJson = (text = "") => {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) {
      throw error;
    }
    return JSON.parse(match[0]);
  }
};

const requestGemini = async (prompt) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key is missing");
  }

  const payload = JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      responseMimeType: "application/json",
    },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: GEMINI_HOST,
        path: `${GEMINI_PATH}?key=${apiKey}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(
              new Error(`Gemini request failed with status ${res.statusCode}: ${body}`)
            );
          }

          try {
            const parsed = JSON.parse(body);
            const text =
              parsed?.candidates?.[0]?.content?.parts
                ?.map((part) => part.text || "")
                .join("")
                .trim() || "";

            if (!text) {
              return reject(new Error("Gemini returned an empty response"));
            }

            resolve(text);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

const requestOpenAI = async (prompt) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: "Return only valid JSON. Do not include markdown or explanations.",
    input: prompt,
  });

  const text = (response.output_text || "").trim();

  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return text;
};

const requestAI = async (prompt) => {
  if (getAiProvider() === "openai") {
    return requestOpenAI(prompt);
  }

  return requestGemini(prompt);
};

const buildFallbackFeedback = (question, answer) => {
  const text = (answer || "").trim();
  let score = 6;
  let message = "Good attempt. Add a clearer structure to improve impact.";

  if (!text || text.toLowerCase() === "no answer") {
    score = 3;
    message = "No meaningful answer was provided. Share a direct response with at least one relevant point.";
  } else if (text.length < 30) {
    score = 5;
    message = "Answer is too short. Explain your point more clearly and add detail.";
  } else if (/example|for instance|for example/i.test(text)) {
    score = 8;
    message = "Strong answer. The example helps, and a sharper opening would make it even better.";
  }

  return {
    question,
    answer,
    feedback: `${message} Score: ${score}/10`,
  };
};

const buildFallbackSummary = (results = []) => {
  let totalScore = 0;
  const strengths = [];
  const weaknesses = [];

  results.forEach((item) => {
    const match = item.feedback?.match(/(\d+)\s*\/\s*10/);
    const score = match ? parseInt(match[1], 10) : 5;

    totalScore += score;

    if (score >= 7) {
      strengths.push(item.question);
    } else {
      weaknesses.push(item.question);
    }
  });

  const averageScore = results.length
    ? Number((totalScore / results.length).toFixed(1))
    : 0;

  return {
    averageScore,
    strengths: strengths.length ? strengths.join(", ") : "No strong answers yet",
    weaknesses: weaknesses.length ? weaknesses.join(", ") : "No weak areas",
    suggestions: "Try to give structured answers with examples and clarity.",
  };
};

const clampSkillScore = (value) => {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(score)));
};

const titleCaseSkill = (skill) => {
  const labels = {
    communication: "Communication",
    confidence: "Confidence",
    react: "React",
    node: "Node",
    mongodb: "MongoDB",
    javascript: "JavaScript",
  };

  return labels[skill] || skill;
};

const buildRecommendation = (skill) => {
  const recommendations = {
    communication: "Improve communication with structured answers using Situation, Action, and Result.",
    confidence: "Practice answering aloud with steady pacing and concise examples.",
    react: "Practice explaining React component design, hooks, state flow, and performance decisions.",
    node: "Review Node.js and Express request flow, middleware, routing, and error handling.",
    mongodb: "Practice MongoDB schema design, indexing, and aggregation pipelines.",
    javascript: "Strengthen JavaScript fundamentals like closures, async code, arrays, and event loop behavior.",
  };

  return recommendations[skill] || `Practice ${titleCaseSkill(skill)} with project-specific examples.`;
};

const buildFallbackSkillAnalytics = (answers = [], results = []) => {
  const combinedText = answers
    .map((item) => `${item.question || ""} ${item.answer || ""}`)
    .join(" ")
    .toLowerCase();
  const feedbackScores = results.map((item) => {
    const match = item.feedback?.match(/(\d+)\s*\/\s*10/);
    return match ? clampSkillScore(match[1]) : 5;
  });
  const averageAnswerScore = feedbackScores.length
    ? feedbackScores.reduce((sum, score) => sum + score, 0) / feedbackScores.length
    : 5;
  const averageAnswerLength = answers.length
    ? answers.reduce((sum, item) => sum + String(item.answer || "").length, 0) / answers.length
    : 0;

  const mentioned = (pattern) => pattern.test(combinedText);
  const skillScores = {
    communication: clampSkillScore(
      averageAnswerScore + (averageAnswerLength > 120 ? 1 : averageAnswerLength < 40 ? -2 : 0)
    ),
    confidence: clampSkillScore(averageAnswerScore),
    react: clampSkillScore(mentioned(/\breact|jsx|component|hook|state\b/i) ? averageAnswerScore + 1 : 4),
    node: clampSkillScore(mentioned(/\bnode|express|api|middleware|backend\b/i) ? averageAnswerScore + 1 : 4),
    mongodb: clampSkillScore(mentioned(/\bmongo|mongoose|schema|aggregation|database\b/i) ? averageAnswerScore + 1 : 4),
    javascript: clampSkillScore(mentioned(/\bjavascript|async|promise|closure|event loop|array\b/i) ? averageAnswerScore + 1 : 5),
  };

  const ranked = SKILL_KEYS.map((skill) => ({
    skill,
    score: skillScores[skill],
  })).sort((a, b) => b.score - a.score);
  const strengths = ranked
    .filter((item) => item.score >= 7)
    .slice(0, 3)
    .map((item) => titleCaseSkill(item.skill));
  const weakAreas = [...ranked]
    .reverse()
    .filter((item) => item.score <= 6)
    .slice(0, 3)
    .map((item) => titleCaseSkill(item.skill));
  const recommendations = (weakAreas.length
    ? weakAreas
    : ranked.slice(-2).map((item) => titleCaseSkill(item.skill))
  ).map((label) => {
    const skill = SKILL_KEYS.find((key) => titleCaseSkill(key) === label);
    return buildRecommendation(skill);
  });

  return {
    skillScores,
    strengths: strengths.length ? strengths : [titleCaseSkill(ranked[0]?.skill || "communication")],
    weakAreas,
    recommendations,
  };
};

const normalizeSkillAnalytics = (answers = [], results = [], parsed = {}) => {
  const fallback = buildFallbackSkillAnalytics(answers, results);
  const rawScores = parsed?.skillAnalytics?.skillScores || {};
  const skillScores = SKILL_KEYS.reduce((acc, skill) => {
    acc[skill] =
      rawScores[skill] === undefined
        ? fallback.skillScores[skill]
        : clampSkillScore(rawScores[skill]);
    return acc;
  }, {});
  const ranked = SKILL_KEYS.map((skill) => ({
    skill,
    score: skillScores[skill],
  })).sort((a, b) => b.score - a.score);
  const strengths = Array.isArray(parsed?.skillAnalytics?.strengths)
    ? parsed.skillAnalytics.strengths
        .filter((item) => typeof item === "string" && item.trim())
        .slice(0, 4)
    : ranked
        .filter((item) => item.score >= 7)
        .slice(0, 3)
        .map((item) => titleCaseSkill(item.skill));
  const weakAreas = Array.isArray(parsed?.skillAnalytics?.weakAreas)
    ? parsed.skillAnalytics.weakAreas
        .filter((item) => typeof item === "string" && item.trim())
        .slice(0, 4)
    : [...ranked]
        .reverse()
        .filter((item) => item.score <= 6)
        .slice(0, 3)
        .map((item) => titleCaseSkill(item.skill));
  const recommendations = Array.isArray(parsed?.skillAnalytics?.recommendations)
    ? parsed.skillAnalytics.recommendations
        .filter((item) => typeof item === "string" && item.trim())
        .slice(0, 5)
    : (weakAreas.length ? weakAreas : fallback.weakAreas).map((label) => {
        const skill = SKILL_KEYS.find((key) => titleCaseSkill(key) === label);
        return buildRecommendation(skill);
      });

  return {
    skillScores,
    strengths: strengths.length ? strengths : fallback.strengths,
    weakAreas: weakAreas.length ? weakAreas : fallback.weakAreas,
    recommendations: recommendations.length ? recommendations : fallback.recommendations,
  };
};

const normalizeFeedbackResults = (answers = [], parsed = {}) => {
  if (!Array.isArray(parsed.results)) {
    return answers.map((item) => buildFallbackFeedback(item.question, item.answer));
  }

  return answers.map((item, index) => {
    const aiItem = parsed.results[index] || {};
    const rawFeedback = typeof aiItem.feedback === "string" ? aiItem.feedback.trim() : "";
    const scoreMatch = rawFeedback.match(/(\d+)\s*\/\s*10/);
    const score = scoreMatch
      ? Math.min(10, Math.max(0, parseInt(scoreMatch[1], 10)))
      : 6;

    return {
      question: item.question,
      answer: item.answer,
      feedback: rawFeedback
        ? scoreMatch
          ? rawFeedback
          : `${rawFeedback} Score: ${score}/10`
        : buildFallbackFeedback(item.question, item.answer).feedback,
    };
  });
};

const getInterviewEvaluation = async (answers = [], category = "hr") => {
  const prompt = `
You are an expert mock interviewer.
Evaluate these ${category} interview answers.
Return strict JSON only in this shape:
{
  "results": [
    {
      "question": "original question",
      "answer": "original answer",
      "feedback": "2 to 3 sentences of actionable interview feedback. End with Score: X/10"
    }
  ],
  "summary": {
    "averageScore": 0,
    "strengths": "short sentence",
    "weaknesses": "short sentence",
    "suggestions": "short sentence"
  },
  "skillAnalytics": {
    "skillScores": {
      "communication": 0,
      "confidence": 0,
      "react": 0,
      "node": 0,
      "mongodb": 0,
      "javascript": 0
    },
    "strengths": ["React"],
    "weakAreas": ["MongoDB"],
    "recommendations": ["Practice MongoDB aggregation."]
  }
}

Rules:
- Keep the same number of results as the input.
- Preserve each original question and answer text exactly.
- Scores must be integers from 1 to 10.
- Make feedback practical, concise, and encouraging.
- averageScore must be a number, not a string.
- Skill scores must be integers from 0 to 10.
- Score communication from clarity, structure, relevance, and completeness.
- Score confidence from directness, specificity, and certainty in the answer.
- Score React, Node, MongoDB, and JavaScript only from evidence in answers and questions.
- Recommendations must be concrete practice actions, not generic advice.

Input:
${JSON.stringify(answers)}
`;

  try {
    const responseText = await requestAI(prompt);
    const parsed = extractJson(responseText);
    const results = normalizeFeedbackResults(answers, parsed);
    const fallbackSummary = buildFallbackSummary(results);
    const skillAnalytics = normalizeSkillAnalytics(answers, results, parsed);
    const summary = {
      averageScore: Number(
        Number(parsed?.summary?.averageScore ?? fallbackSummary.averageScore).toFixed(1)
      ),
      strengths:
        typeof parsed?.summary?.strengths === "string" && parsed.summary.strengths.trim()
          ? parsed.summary.strengths.trim()
          : fallbackSummary.strengths,
      weaknesses:
        typeof parsed?.summary?.weaknesses === "string" && parsed.summary.weaknesses.trim()
          ? parsed.summary.weaknesses.trim()
          : fallbackSummary.weaknesses,
      suggestions:
        typeof parsed?.summary?.suggestions === "string" && parsed.summary.suggestions.trim()
          ? parsed.summary.suggestions.trim()
          : fallbackSummary.suggestions,
    };

    return { results, summary, skillAnalytics };
  } catch (error) {
    console.error("AI feedback fallback:", error.message);
    const results = answers.map((item) => buildFallbackFeedback(item.question, item.answer));
    return {
      results,
      summary: buildFallbackSummary(results),
      skillAnalytics: buildFallbackSkillAnalytics(answers, results),
      error,
    };
  }
};

const getInterviewQuestions = async (category, fallbackQuestions = []) => {
  const prompt = `
Generate 5 ${category} mock interview questions for a practice platform.
Return strict JSON only as an array like:
[
  { "category": "${category}", "question": "Question text" }
]

Rules:
- Keep category exactly "${category}".
- Questions must be clear, realistic, and non-duplicative.
- Do not add numbering.
`;

  try {
    const responseText = await requestAI(prompt);
    const parsed = extractJson(responseText);

    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error("Invalid Gemini question payload");
    }

    return parsed
      .filter((item) => typeof item?.question === "string" && item.question.trim())
      .map((item) => ({
        category,
        question: item.question.trim(),
      }));
  } catch (error) {
    console.error("AI question fallback:", error.message);
    return fallbackQuestions;
  }
};

const buildFallbackResumeAnalysis = (text = "") => {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const issues = [];
  const strengths = [];
  const suggestions = [];
  let score = 6;

  if (normalizedText.length > 400) {
    strengths.push("Your resume has enough content for a meaningful review.");
  } else {
    issues.push("The resume content looks short, so key details may be missing.");
    suggestions.push("Add more measurable experience, projects, and skills.");
    score -= 1;
  }

  if (/@/.test(normalizedText)) {
    strengths.push("Contact information appears to be present.");
  } else {
    issues.push("An email address was not clearly detected.");
    suggestions.push("Add a professional email address near the top.");
    score -= 1;
  }

  if (/\b(project|experience|skills|education)\b/i.test(normalizedText)) {
    strengths.push("The resume includes common professional sections.");
  } else {
    issues.push("Important sections like skills, experience, or education are not easy to detect.");
    suggestions.push("Use clear headings for skills, experience, projects, and education.");
    score -= 1;
  }

  if (/\b\d+%|\b\d+\+|\b\d+\s+(users|clients|projects|years|months)\b/i.test(normalizedText)) {
    strengths.push("Some quantified impact is present, which usually strengthens a resume.");
    score += 1;
  } else {
    issues.push("The resume does not show much measurable impact.");
    suggestions.push("Add numbers like percentages, counts, or time saved to show impact.");
  }

  if (!suggestions.length) {
    suggestions.push("Tailor the summary and project bullets to the role you are targeting.");
  }

  const clampedScore = Math.max(1, Math.min(10, score));

  return {
    ok: clampedScore >= 7,
    score: clampedScore,
    verdict:
      clampedScore >= 7
        ? "Your resume looks solid overall, with a few possible refinements."
        : "Your resume is usable, but it needs a few improvements before interviews.",
    strengths: strengths.slice(0, 4),
    issues: issues.slice(0, 4),
    suggestions: suggestions.slice(0, 4),
  };
};

const analyzeResumeText = async (text = "") => {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return {
      ok: false,
      score: 1,
      verdict: "No readable resume text was found in the PDF.",
      strengths: [],
      issues: ["The PDF could not be read as usable resume text."],
      suggestions: ["Upload a text-based PDF instead of a scanned image, and make sure the file is not empty."],
    };
  }

  const prompt = `
You are an expert resume reviewer.
Review this resume text and tell whether it looks okay for job applications.
Return strict JSON only in this shape:
{
  "ok": true,
  "score": 0,
  "verdict": "short verdict",
  "strengths": ["short point"],
  "issues": ["short point"],
  "suggestions": ["short point"]
}

Rules:
- "ok" should be true if the resume is reasonably ready, false if it needs notable work.
- "score" must be an integer from 1 to 10.
- Keep each list between 0 and 4 items.
- Focus on structure, clarity, contact info, skills, experience, projects, and impact.
- Be concise, practical, and encouraging.

Resume text:
${normalizedText.slice(0, 12000)}
`;

  try {
    const responseText = await requestAI(prompt);
    const parsed = extractJson(responseText);
    const fallback = buildFallbackResumeAnalysis(normalizedText);

    return {
      ok: typeof parsed?.ok === "boolean" ? parsed.ok : fallback.ok,
      score: Number.isFinite(parsed?.score)
        ? Math.max(1, Math.min(10, Math.round(parsed.score)))
        : fallback.score,
      verdict:
        typeof parsed?.verdict === "string" && parsed.verdict.trim()
          ? parsed.verdict.trim()
          : fallback.verdict,
      strengths: Array.isArray(parsed?.strengths)
        ? parsed.strengths.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
        : fallback.strengths,
      issues: Array.isArray(parsed?.issues)
        ? parsed.issues.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
        : fallback.issues,
      suggestions: Array.isArray(parsed?.suggestions)
        ? parsed.suggestions
            .filter((item) => typeof item === "string" && item.trim())
            .slice(0, 4)
        : fallback.suggestions,
    };
  } catch (error) {
    console.error("AI resume fallback:", error.message);
    return buildFallbackResumeAnalysis(normalizedText);
  }
};

const normalizePersonalizedQuestions = (items = [], fallbackQuestions = []) => {
  const seen = new Set();

  const normalized = items
    .map((item) => {
      const question = typeof item === "string" ? item : item?.question;
      return typeof question === "string" ? question.replace(/\s+/g, " ").trim() : "";
    })
    .filter((question) => {
      if (!question || seen.has(question.toLowerCase())) {
        return false;
      }

      seen.add(question.toLowerCase());
      return true;
    })
    .slice(0, 5)
    .map((question) => ({
      category: "resume",
      question,
    }));

  if (normalized.length >= 5) {
    return normalized;
  }

  fallbackQuestions.forEach((item) => {
    if (normalized.length >= 5) {
      return;
    }

    const question = item?.question || "";
    const key = question.toLowerCase();

    if (question && !seen.has(key)) {
      seen.add(key);
      normalized.push({ category: "resume", question });
    }
  });

  return normalized.slice(0, 5);
};

const extractResumeSignals = (text = "") => {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const skillsToDetect = [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "JWT",
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "SQL",
    "REST API",
    "Git",
    "Docker",
    "AWS",
    "Machine Learning",
    "AI",
  ];

  const skills = skillsToDetect.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(normalizedText);
  });

  const projectMatches = normalizedText.match(
    /\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){1,5}\s+(?:Platform|App|Application|System|Website|Portal|Dashboard|Project))\b/g
  );

  const projects = [...new Set(projectMatches || [])].slice(0, 3);

  return {
    skills,
    projects,
  };
};

const buildFallbackPersonalizedQuestions = (text = "") => {
  const { skills, projects } = extractResumeSignals(text);
  const primaryProject = projects[0] || "your main resume project";
  const questions = [];

  if (skills.includes("JWT")) {
    questions.push(`Explain how you implemented JWT authentication in ${primaryProject}.`);
  }

  if (skills.includes("MongoDB")) {
    questions.push(`How did you design the MongoDB schema for ${primaryProject}?`);
  }

  if (skills.includes("React")) {
    questions.push(`Which React components or state patterns were most important in ${primaryProject}?`);
  }

  if (skills.includes("Node.js") || skills.includes("Express")) {
    questions.push(`How did you structure the Node.js and Express backend for ${primaryProject}?`);
  }

  if (projects[0]) {
    questions.push(`Describe the architecture of your ${projects[0]} and the main technical decisions you made.`);
  }

  skills
    .filter((skill) => !["JWT", "MongoDB", "React", "Node.js", "Express"].includes(skill))
    .forEach((skill) => {
      questions.push(`Where did you use ${skill} in your resume projects, and what problem did it solve?`);
    });

  if (questions.length < 5) {
    questions.push(
      "Which resume project best demonstrates your technical depth, and what was the hardest part?",
      "Pick one technology from your resume and explain a bug or performance issue you solved with it.",
      "How does your education connect to the projects and technologies listed on your resume?",
      "What would you improve in your strongest resume project if you rebuilt it today?",
      "Walk me through one project from requirements to deployment using the technologies on your resume."
    );
  }

  return normalizePersonalizedQuestions(questions);
};

const generateResumeInterviewQuestions = async (text = "") => {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    throw new Error("Resume text is required");
  }

  const fallbackQuestions = buildFallbackPersonalizedQuestions(normalizedText);
  const prompt = `
You are a senior technical interviewer.
Generate exactly 5 personalized interview questions based only on this resume text.
Return strict JSON only as an array in this shape:
[
  { "category": "resume", "question": "Question text" }
]

Rules:
- Every question must reference a concrete skill, project, education item, tool, or technology found in the resume.
- Do not ask generic questions like "Tell me about yourself" or "What are your strengths?"
- Prefer project-specific questions that connect multiple resume signals.
- Keep questions concise and realistic for a mock interview.
- Do not invent technologies or projects not present in the resume.
- Keep category exactly "resume".
- Do not add numbering.

Resume text:
${normalizedText.slice(0, 12000)}
`;

  try {
    const responseText = await requestAI(prompt);
    const parsed = extractJson(responseText);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid AI resume question payload");
    }

    const questions = normalizePersonalizedQuestions(parsed, fallbackQuestions);

    if (questions.length < 5) {
      throw new Error("AI returned fewer than 5 usable resume questions");
    }

    return questions;
  } catch (error) {
    console.error("AI resume question fallback:", error.message);
    return fallbackQuestions;
  }
};

module.exports = {
  analyzeResumeText,
  buildFallbackSummary,
  generateResumeInterviewQuestions,
  getInterviewEvaluation,
  getInterviewQuestions,
};
