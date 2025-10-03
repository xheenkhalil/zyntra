// Centralized Error Handling Middleware
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
}
