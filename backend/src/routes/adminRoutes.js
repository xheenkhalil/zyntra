import express from "express";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import pool from "../config/db.js";

const router = express.Router();

// View audit logs (SuperAdmin only)
router.get("/logs", authenticate, authorize("superadmin"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100"
    );
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
