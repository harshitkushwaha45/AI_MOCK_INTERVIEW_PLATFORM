const getFeedback = async (question, answer) => {
  // Simple logic to vary response a bit
  let score = Math.floor(Math.random() * 4 + 6); // 6–9

  let feedback = "Good attempt.";

  if (answer.length < 20) {
    feedback = "Answer is too short. Try to explain more clearly.";
    score = 5;
  } else if (answer.toLowerCase().includes("example")) {
    feedback = "Nice! Including examples makes your answer strong.";
  } else {
    feedback = "Good answer. Try to add more structure and clarity.";
  }

  return `${feedback} Score: ${score}/10`;
};

module.exports = { getFeedback };