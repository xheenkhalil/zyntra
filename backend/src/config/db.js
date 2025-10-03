import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ Only attach logs in non-test environments
if (process.env.NODE_ENV !== "test") {
  pool.on("connect", () => {
    console.log(" Connected to Supabase Postgres");
  });

  pool.on("error", (err) => {
    console.error(" Database connection error", err);
  });
} else {
  // ✅ In test mode: swallow pool errors to avoid Jest crashes
  pool.on("error", () => {
    // ignore errors after pool.end()
  });
}

export default pool;
