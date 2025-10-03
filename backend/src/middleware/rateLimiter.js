import rateLimit from "express-rate-limit";

// Apply to login routes
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max attempts
  message: { error: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
