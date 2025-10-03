import pool from "../config/db.js";

// utils/logger.js
export async function logAction(user, action, details = {}) {
  try {
    const userId = user.id === "superadmin" ? null : user.id;
    await pool.query(
      `INSERT INTO audit_logs (user_id, role, action, details) 
       VALUES ($1, $2, $3, $4)`,
      [userId, user.role, action, details]
    );
  } catch (err) {
    console.error("Failed to log action:", err.message);
  }
}

