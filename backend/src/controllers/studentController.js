import pool from "../config/db.js";
import { logAction } from "../utils/logger.js";

// ======================
// Course Admin creates Student
// ======================
export async function createStudent(req, res) {
  const { student_id, full_name, course_name } = req.body;

  try {
    // Ensure unique student_id
    const check = await pool.query(
      "SELECT * FROM users WHERE student_id=$1",
      [student_id]
    );
    if (check.rows.length > 0) {
      return res.status(400).json({ error: "Student ID already exists" });
    }

    const result = await pool.query(
      `INSERT INTO users (student_id, full_name, email, role, course_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, student_id, full_name, course_name, role`,
      [student_id, full_name, null, "student", course_name]
    );

    // Log action (Course Admin created a student)
    await logAction(req.user, "CREATE_STUDENT", {
      created_student_id: student_id,
      full_name,
      course_name,
      generated_id: result.rows[0].id
    });

    res.json({
      message: "Student created successfully",
      student: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Student Login
// ======================
export async function studentLogin(req, res) {
  const { student_id } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE student_id=$1 AND role='student'",
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = result.rows[0];

    // Log action (Student logged in)
    await logAction(
      { id: student.id, role: "student" },
      "STUDENT_LOGIN",
      { student_id, full_name: student.full_name }
    );

    res.json({
      message: "Login successful",
      student: {
        id: student.id,
        student_id,
        full_name: student.full_name,
        course_name: student.course_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
