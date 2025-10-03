import { generateToken } from "../utils/auth.js";
import { logAction } from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

// ======================
// SuperAdmin Login
// ======================
export async function superAdminLogin(req, res) {
  const { email, password } = req.body;

  try {
    // Validate email
    if (email !== process.env.SUPERADMIN_EMAIL) {
      await logAction({ id: "superadmin", role: "superadmin" }, "FAILED_SUPERADMIN_LOGIN", {
        attempted_email: email
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Validate password
    if (password !== process.env.SUPERADMIN_PASSWORD) {
      await logAction({ id: "superadmin", role: "superadmin" }, "FAILED_SUPERADMIN_LOGIN", {
        email,
        reason: "wrong_password"
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({ id: "superadmin", role: "superadmin" });

    // Log successful login
    await logAction({ id: "superadmin", role: "superadmin" }, "SUPERADMIN_LOGIN", {
      email
    });

    // Respond
    res.json({
      token,
      user: { email: process.env.SUPERADMIN_EMAIL, role: "superadmin" },
      message: "SuperAdmin logged in successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
