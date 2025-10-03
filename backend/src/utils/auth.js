import argon2 from "argon2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Hash password
export async function hashPassword(password) {
  return await argon2.hash(password);
}

// Verify password
export async function verifyPassword(password, hash) {
  return await argon2.verify(hash, password);
}

// Generate JWT
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}
