const https = require("https");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_HOST = "generativelanguage.googleapis.com";
const GEMINI_PATH = `/v1beta/models/${GEMINI_MODEL}:generateContent`;

const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

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
  }
}

Rules:
- Keep the same number of results as the input.
- Preserve each original question and answer text exactly.
- Scores must be integers from 1 to 10.
- Make feedback practical, concise, and encouraging.
- averageScore must be a number, not a string.

Input:
${JSON.stringify(answers)}
`;

  try {
    const responseText = await requestGemini(prompt);
    const parsed = extractJson(responseText);
    const results = normalizeFeedbackResults(answers, parsed);
    const fallbackSummary = buildFallbackSummary(results);
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

    return { results, summary };
  } catch (error) {
    console.error("Gemini feedback fallback:", error.message);
    const results = answers.map((item) => buildFallbackFeedback(item.question, item.answer));
    return {
      results,
      summary: buildFallbackSummary(results),
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
    const responseText = await requestGemini(prompt);
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
    console.error("Gemini question fallback:", error.message);
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
    const responseText = await requestGemini(prompt);
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
    console.error("Gemini resume fallback:", error.message);
    return buildFallbackResumeAnalysis(normalizedText);
  }
};

module.exports = {
  analyzeResumeText,
  buildFallbackSummary,
  getInterviewEvaluation,
  getInterviewQuestions,
};
