import pool from "./src/config/db.js";

async function testDB() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log(" DB Connection successful:", result.rows[0]);
  } catch (err) {
    console.error(" DB Connection failed:", err.message);
  } finally {
    pool.end();
  }
}

testDB();
