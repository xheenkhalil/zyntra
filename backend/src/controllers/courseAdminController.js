import pool from "../config/db.js";
import crypto from "crypto";
import { hashPassword } from "../utils/auth.js";
import { logAction } from "../utils/logger.js";

// ======================
// Central Admin generates Course Admin link
// ======================
export async function createCourseAdminLink(req, res) {
  const { email, course_name } = req.body;

  try {
    // Secure token generation
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 30 * 60000); // expires in 30 minutes

    // Insert pending Course Admin (password = null until registration)
    const result = await pool.query(
      `INSERT INTO users (email, password, role, course_name, registration_token, token_expiry) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, course_name, role`,
      [email, null, "course_admin", course_name, token, expiry]
    );

    // Log action (Central Admin creating Course Admin link)
    await logAction(req.user, "CREATE_COURSE_ADMIN_LINK", {
      course_admin_email: email,
      course_name,
      generated_id: result.rows[0].id
    });

    res.json({
      message: "Course Admin registration link created",
      link: `/api/auth/register-course/${token}`
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Course Admin registers with password + unique ID
// ======================
export async function registerCourseAdmin(req, res) {
  const { token } = req.params;
  const { password, course_admin_id } = req.body;

  try {
    // Validate token
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE registration_token=$1 
       AND token_expiry > now()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired link" });
    }

    const user = result.rows[0];

    // Securely hash password
    const hashed = await hashPassword(password);

    // Ensure course_admin_id is unique
    const checkId = await pool.query(
      `SELECT * FROM users WHERE course_admin_id=$1`,
      [course_admin_id]
    );
    if (checkId.rows.length > 0) {
      return res.status(400).json({ error: "Course Admin ID already exists" });
    }

    // Finalize registration
    await pool.query(
      `UPDATE users 
       SET password=$1, course_admin_id=$2, registration_token=NULL, token_expiry=NULL 
       WHERE id=$3`,
      [hashed, course_admin_id, user.id]
    );

    // Log action (Course Admin registration success)
    await logAction({ id: user.id, role: "course_admin" }, "REGISTER_COURSE_ADMIN", {
      course_name: user.course_name,
      email: user.email,
      course_admin_id
    });

    res.json({
      message: `Course Admin for ${user.course_name} registered successfully`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
