import pool from "../config/db.js";
import { logAction } from "../utils/logger.js";

// ======================
// Create Exam (Course-bound)
// ======================
export async function createExam(req, res) {
  const { title, description } = req.body;

  try {
    // Ensure this course_admin is only creating exams for their course
    const courseAdmin = await pool.query(
      "SELECT course_name FROM users WHERE id=$1 AND role='course_admin'",
      [req.user.id]
    );

    if (courseAdmin.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized as course admin" });
    }

    const courseName = courseAdmin.rows[0].course_name;

    const result = await pool.query(
      "INSERT INTO exams (title, description, created_by, course_name) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description || null, req.user.id, courseName]
    );

    await logAction(req.user, "CREATE_EXAM", {
      exam_id: result.rows[0].id,
      title,
      course_name: courseName,
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Get Exams (course-bound for admins/students)
// ======================
export async function getExams(req, res) {
  try {
    let result;

    if (req.user.role === "course_admin") {
      result = await pool.query(
        "SELECT * FROM exams WHERE course_name=(SELECT course_name FROM users WHERE id=$1) ORDER BY created_at DESC",
        [req.user.id]
      );
    } else if (req.user.role === "student") {
      result = await pool.query(
        "SELECT * FROM exams WHERE course_name=(SELECT course_name FROM users WHERE id=$1) ORDER BY created_at DESC",
        [req.user.id]
      );
    } else {
      // fallback for superadmin/central_admin
      result = await pool.query("SELECT * FROM exams ORDER BY created_at DESC");
    }

    await logAction(req.user, "FETCH_EXAMS", { count: result.rows.length });

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Add Question (only to exams in own course)
// ======================
export async function addQuestion(req, res) {
  const { examId } = req.params;
  const { question_text, options, correct_answer } = req.body;

  try {
    // Ensure exam belongs to the course of this admin
    const check = await pool.query(
      "SELECT course_name FROM exams WHERE id=$1",
      [examId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const examCourse = check.rows[0].course_name;

    const adminCourse = (
      await pool.query("SELECT course_name FROM users WHERE id=$1", [req.user.id])
    ).rows[0].course_name;

    if (examCourse !== adminCourse) {
      return res.status(403).json({ error: "You cannot modify exams outside your course" });
    }

    const result = await pool.query(
      "INSERT INTO questions (exam_id, question_text, options, correct_answer) VALUES ($1, $2, $3, $4) RETURNING *",
      [examId, question_text, JSON.stringify(options), correct_answer]
    );

    await logAction(req.user, "ADD_QUESTION", {
      exam_id: examId,
      question_id: result.rows[0].id,
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Submit Exam (only students of same course)
// ======================
export async function submitExam(req, res) {
  const { examId } = req.params;
  const { answers } = req.body;

  try {
    // Verify exam belongs to student’s course
    const exam = await pool.query("SELECT course_name FROM exams WHERE id=$1", [examId]);
    if (exam.rows.length === 0) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const studentCourse = (
      await pool.query("SELECT course_name FROM users WHERE id=$1", [req.user.id])
    ).rows[0].course_name;

    if (exam.rows[0].course_name !== studentCourse) {
      return res.status(403).json({ error: "You cannot submit exams outside your course" });
    }

    // Fetch correct answers
    const qRes = await pool.query(
      "SELECT id, correct_answer FROM questions WHERE exam_id = $1",
      [examId]
    );

    let score = 0;
    qRes.rows.forEach((q) => {
      if (answers[q.id] && answers[q.id] === q.correct_answer) {
        score++;
      }
    });

    const result = await pool.query(
      "INSERT INTO submissions (exam_id, user_id, answers, score) VALUES ($1, $2, $3, $4) RETURNING *",
      [examId, req.user.id, JSON.stringify(answers), score]
    );

    await logAction({ id: req.user.id, role: "student" }, "SUBMIT_EXAM", {
      exam_id: examId,
      submission_id: result.rows[0].id,
      score,
    });

    res.json({ submission: result.rows[0], score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
