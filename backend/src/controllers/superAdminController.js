import { superAdmin, verifySuperAdminPassword } from "../config/superAdmin.js";
import { generateToken } from "../utils/auth.js";
import { logAction } from "../utils/logger.js";

// ======================
// SuperAdmin Login
// ======================
export async function superAdminLogin(req, res) {
  const { email, password } = req.body;

  try {
    // Validate email
    if (email !== superAdmin.email) {
      await logAction({ id: "superadmin", role: "superadmin" }, "FAILED_SUPERADMIN_LOGIN", {
        attempted_email: email
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Validate password
    const match = await verifySuperAdminPassword(password);
    if (!match) {
      await logAction({ id: "superadmin", role: "superadmin" }, "FAILED_SUPERADMIN_LOGIN", {
        email,
        reason: "wrong_password"
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({ id: "superadmin", role: superAdmin.role });

    // Log successful login
    await logAction({ id: "superadmin", role: "superadmin" }, "SUPERADMIN_LOGIN", {
      email
    });

    // Respond
    res.json({
      token,
      user: { email: superAdmin.email, role: superAdmin.role },
      message: "SuperAdmin logged in successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
