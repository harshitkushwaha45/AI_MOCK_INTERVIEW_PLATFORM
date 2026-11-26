const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON request body",
    });
  }

  res.status(err.statusCode || 500).json({
    message: err.statusCode && err.statusCode < 500 ? err.message : "Server Error",
  });
};

module.exports = errorHandler;
