import pool from "../config/db.js";
import { hashPassword, verifyPassword, generateToken } from "../utils/auth.js";

// ======================
// Admin/Instructor Auth
// ======================

// Register User (Admin/Instructor)
export async function registerUser(req, res) {
  const { email, password, role } = req.body;
  try {
    const hashed = await hashPassword(password);

    const result = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role",
      [email, hashed, role || "instructor"]
    );

    res.json({ user: result.rows[0], message: "User registered successfully" });
  } catch (err) {
    if (err.code === "23505") { // unique_violation
      return res.status(400).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: err.message });
  }
}

// Login User (Admin/Instructor)
export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await verifyPassword(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Student Auth
// ======================

// Admin creates student
export async function createStudent(req, res) {
  const { student_id, full_name, email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (student_id, full_name, email, role) VALUES ($1, $2, $3, $4) RETURNING id, student_id, full_name, role",
      [student_id, full_name, email || null, "student"]
    );

    res.json({ student: result.rows[0], message: "Student created successfully" });
  } catch (err) {
    if (err.code === "23505") { // unique_violation
      return res.status(400).json({ error: "Student ID or email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
}

// Student login (by student_id only)
export async function studentLogin(req, res) {
  const { student_id } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE student_id = $1 AND role = 'student'",
      [student_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const student = result.rows[0];
    const token = generateToken(student.id, student.role);

    res.json({
      token,
      user: {
        id: student.id,
        student_id: student.student_id,
        full_name: student.full_name,
        role: student.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Course Admin creates a student
export async function createStudentByCourseAdmin(req, res) {
  const { student_id, full_name, email, course_name } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (student_id, full_name, email, course_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, student_id, full_name, course_name, role",
      [student_id, full_name, email || null, course_name, "student"]
    );

    res.json({ student: result.rows[0], message: "Student created successfully" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Student ID already exists" });
    }
    res.status(500).json({ error: err.message });
  }
}

// Course Admin login (by email only)
// (Functionality already implemented above in exported functions)

// Student login (by student_id only)
// (Functionality already implemented above in exported functions)

export default {
  registerUser,
  loginUser,
  createStudent,
  studentLogin,
  createStudentByCourseAdmin,
  hashPassword
};