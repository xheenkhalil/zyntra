import argon2 from "argon2";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Hash password with Argon2id
export async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64MB
    timeCost: 3,
    parallelism: 1,
  });
}

// ✅ Verify password
export async function verifyPassword(password, hash) {
  return await argon2.verify(hash, password);
}

// ✅ Generate JWT (always object payload)
export function generateToken(userId, role) {
  return jwt.sign(
    { id: userId, role }, // 👈 must be object
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}
