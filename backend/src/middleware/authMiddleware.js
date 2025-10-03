import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in .env");
  process.exit(1);
}

// ======================
// Authenticate Middleware
// ======================
export function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Must be "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid token format. Expected 'Bearer <token>'" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains id, role, plus role-specific claims
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// ======================
// Authorization Middleware
// ======================
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user in request" });
    }

    const userRole = String(req.user.role).toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden: ${req.user.role} cannot access this resource`,
      });
    }

    next();
  };
}

// Enforce Course Admin bound to their own course
export function enforceCourseBound(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: No user context" });
  }

  if (req.user.role === "course_admin") {
    const requestedCourse = req.body.course_name;

    if (!requestedCourse) {
      return res.status(400).json({ error: "course_name is required" });
    }

    if (requestedCourse !== req.user.course_name) {
      return res.status(403).json({
        error: `Forbidden: You can only manage students in your own course (${req.user.course_name})`
      });
    }
  }

  next();
}

