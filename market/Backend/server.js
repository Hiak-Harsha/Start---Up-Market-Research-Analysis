import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import researchRoute from "./routes/research.js";
import chatRoute from "./routes/chat.js";

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));
app.use(express.json({ limit: "50kb" }));

// Simple in-memory rate limiter (per IP)
const rateLimitMap = new Map();
function rateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = (rateLimitMap.get(ip) || []).filter(t => t > windowStart);
    if (requests.length >= maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
    }
    requests.push(now);
    rateLimitMap.set(ip, requests);
    next();
  };
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [ip, times] of rateLimitMap.entries()) {
    const filtered = times.filter(t => t > cutoff);
    if (filtered.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, filtered);
  }
}, 5 * 60 * 1000);

// ── Input validation helper ─────────────────────────────────────────────────
export function validateString(val, name, min = 1, max = 1000) {
  if (typeof val !== "string") return `${name} must be a string.`;
  const trimmed = val.trim();
  if (trimmed.length < min) return `${name} must be at least ${min} characters.`;
  if (trimmed.length > max) return `${name} must be at most ${max} characters.`;
  return null;
}

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/research", rateLimit(10, 60 * 60 * 1000), researchRoute); // 10/hour
app.use("/api/chat", rateLimit(60, 60 * 60 * 1000), chatRoute);         // 60/hour

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      openrouter: !!process.env.OPENROUTER_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
    },
  });
});

app.get("/", (req, res) => res.send("🚀 MarketLens Backend Running"));

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ MarketLens backend running → http://localhost:${PORT}`);
  if (!process.env.OPENROUTER_API_KEY) console.warn("⚠️  OPENROUTER_API_KEY not set");
  if (!process.env.TAVILY_API_KEY) console.warn("⚠️  TAVILY_API_KEY not set");
});