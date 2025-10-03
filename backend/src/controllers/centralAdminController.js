import pool from "../config/db.js";
import crypto from "crypto";
import { hashPassword } from "../utils/auth.js";
import { logAction } from "../utils/logger.js";

// ======================
// SuperAdmin creates Central Admin link
// ======================
export async function createCentralAdminLink(req, res) {
  const { email } = req.body;

  try {
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 30 * 60000); // 30 minutes

    // Insert pending Central Admin (password = null until registration)
    const result = await pool.query(
      `INSERT INTO users (email, password, role, registration_token, token_expiry) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, role`,
      [email, null, "central_admin", token, expiry]
    );

    // Log action (SuperAdmin creating Central Admin link)
    await logAction(req.user, "CREATE_CENTRAL_ADMIN_LINK", {
      central_admin_email: email,
      central_admin_id: result.rows[0].id
    });

    res.json({
      message: "Central Admin registration link created",
      link: `/api/auth/register-central/${token}`
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
}

// ======================
// Central Admin registers with token
// ======================
export async function registerCentralAdmin(req, res) {
  const { token } = req.params;
  const { password } = req.body;

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

    // Hash password securely
    const hashed = await hashPassword(password);

    // Finalize registration
    await pool.query(
      `UPDATE users 
       SET password=$1, registration_token=NULL, token_expiry=NULL 
       WHERE id=$2`,
      [hashed, user.id]
    );

    // Log action (Central Admin self-registration)
    await logAction({ id: user.id, role: "central_admin" }, "REGISTER_CENTRAL_ADMIN", {
      email: user.email
    });

    res.json({ message: "Central Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
