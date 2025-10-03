import express from "express";
import { body, validationResult } from "express-validator";
import {
  createExam,
  getExams,
  addQuestion,
  submitExam,
} from "../controllers/examController.js";

import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================
// Validation Helper
// ======================
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// ======================
// Exam Routes
// ======================

// Create exam (only Course Admins)
router.post(
  "/create",
  authenticate,
  authorize("course_admin"),
  body("title").notEmpty(),
  body("description").optional(),
  validate,
  createExam
);

// Get all exams (all authenticated users)
router.get("/", authenticate, getExams);

// Add question (only Course Admins)
router.post(
  "/:examId/questions",
  authenticate,
  authorize("course_admin"),
  body("question_text").notEmpty(),
  body("options").isObject(),
  body("correct_answer").notEmpty(),
  validate,
  addQuestion
);

// Submit exam (only Students)
router.post(
  "/:examId/submit",
  authenticate,
  authorize("student"),
  body("answers").isObject(),
  validate,
  submitExam
);

export default router;
