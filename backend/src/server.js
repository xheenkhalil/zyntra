import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/exams.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { swaggerDocs } from "./swagger.js";

dotenv.config();

const app = express();

// ======================
// Security & Middleware
// ======================
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(mongoSanitize()); // prevent NoSQL injection
app.use(xss()); // sanitize against XSS

// Rate limiting (100 requests / 15 min)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ======================
// DB Connection Test
// ======================
pool.connect()
  .then(client => {
    console.log("✅ Connected to Supabase Postgres");
    client.release();
  })
  .catch(err => console.error("❌ Database connection error", err.stack));

// ======================
// Routes
// ======================
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Zyntra Backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);

// ======================
// Swagger Docs
// ======================
swaggerDocs(app);

// ======================
// Error Handling
// ======================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});
app.use(errorHandler);

// ======================
// Server Start w/ Auto Port Switching
// ======================
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${port} in use, retrying on ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down gracefully...");
    await pool.end();
    server.close(() => {
      console.log("Server closed. DB connection released.");
      process.exit(0);
    });
  });

  process.on("SIGTERM", async () => {
    console.log("Received kill signal, shutting down...");
    await pool.end();
    server.close(() => {
      console.log("Server closed. DB connection released.");
      process.exit(0);
    });
  });
}

if (process.env.NODE_ENV !== "test") {
  const PORT = parseInt(process.env.PORT, 10) || 5000;
  startServer(PORT);
}

export default app;
