// tests/setup.js
import { jest } from "@jest/globals";
import pool from "../src/config/db.js";

jest.setTimeout(20000);

beforeAll(() => {
  console.log("✅ Jest setup initialized");
});

afterAll(async () => {
  console.log("🛑 Closing DB pool after tests...");
  await pool.end();
});
