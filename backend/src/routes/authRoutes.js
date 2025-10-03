import express from "express";
import { body, validationResult } from "express-validator";

// Controllers
import { superAdminLogin } from "../controllers/superAdminController.js";
import { createCentralAdminLink, registerCentralAdmin } from "../controllers/centralAdminController.js";
import { createCourseAdminLink, registerCourseAdmin } from "../controllers/courseAdminController.js";
import { createStudentByCourseAdmin, studentLogin, loginUser, registerUser } from "../controllers/authController.js";
import { getCurrentUser } from "../controllers/userController.js";
import { createStudent } from "../controllers/studentController.js";

// Middleware
import { authenticate, authorize, enforceCourseBound } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================
// Validation Middleware
// ======================
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// ======================
// Password Regex Rule
// ======================
const passwordRule = body("password")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/)
  .withMessage(
    "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
  );

// ======================
// SuperAdmin Routes
// ======================

// SuperAdmin login (no complexity check, just notEmpty)
router.post(
  "/superadmin-login",
  body("email").isEmail(),
  body("password").notEmpty(),
  validate,
  superAdminLogin
);

// SuperAdmin generates registration link for Central Admin
router.post(
  "/create-central-link",
  authenticate,
  authorize("superadmin"),
  body("email").isEmail(),
  validate,
  createCentralAdminLink
);

// Central Admin registers via token link
router.post(
  "/register-central/:token",
  passwordRule,
  validate,
  registerCentralAdmin
);

// ======================
// Central Admin Routes
// ======================

// Central Admin generates Course Admin link
router.post(
  "/create-course-link",
  authenticate,
  authorize("central_admin"),
  body("email").isEmail(),
  body("course_name").notEmpty(),
  validate,
  createCourseAdminLink
);

// Course Admin registers via token link
router.post(
  "/register-course/:token",
  passwordRule,
  body("course_admin_id").notEmpty(),
  validate,
  registerCourseAdmin
);

// ======================
// Course Admin Routes
// ======================

// Course Admin creates Student (bound to own course)
router.post(
  "/create-student",
  authenticate,
  authorize("course_admin"),
  enforceCourseBound,
  body("student_id").notEmpty(),
  body("full_name").notEmpty(),
  body("course_name").notEmpty(),
  validate,
  createStudentByCourseAdmin
);

// ======================
// Student Routes
// ======================

// Student login (via student_id only, no password)
router.post(
  "/student-login",
  body("student_id").notEmpty(),
  validate,
  studentLogin
);

// ======================
// General Auth Routes
// ======================

// Generic register (fallback)
router.post(
  "/register",
  body("email").isEmail(),
  passwordRule,
  validate,
  registerUser
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  validate,
  loginUser
);

// ======================
// User Profile
// ======================
router.get(
  "/me",
  authenticate, // must be logged in
  getCurrentUser
);

// ======================
// Student Routes (again - for explicit create/login endpoints)
// ======================
router.post(
  "/create-student",
  authenticate,
  authorize("course_admin"),
  enforceCourseBound,
  body("student_id").notEmpty(),
  body("full_name").notEmpty(),
  body("course_name").notEmpty(),
  validate,
  createStudent
);

router.post(
  "/student-login",
  body("student_id").notEmpty(),
  validate,
  studentLogin
);

import { loginLimiter } from "../middleware/rateLimiter.js";

// SuperAdmin login
router.post(
  "/superadmin-login",
  loginLimiter,
  body("email").isEmail(),
  body("password").notEmpty(),
  validate,
  superAdminLogin
);

// Normal login
router.post(
  "/login",
  loginLimiter,
  body("email").isEmail(),
  body("password").notEmpty(),
  validate,
  loginUser
);

export default router;
