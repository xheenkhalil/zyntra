import pool from "../config/db.js";

// Get current user profile from JWT and DB
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id; // from authenticate middleware

    // Always fetch fresh data from DB
    const result = await pool.query(
      `SELECT id, email, role, course_name, course_admin_id, student_id, full_name 
       FROM users 
       WHERE id=$1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const dbUser = result.rows[0];

    // Combine DB record + JWT payload (for debugging and traceability)
    const response = {
      db: dbUser,
      token: req.user
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
