/**
 * routes/chat.js
 *
 * POST /api/chat
 * Handles follow-up questions about a market research report.
 * Passes the full report as context and returns a plain-text answer.
 */

import express from "express";
import axios from "axios";
import { validateString } from "../server.js";

const router = express.Router();

const CHAT_SYSTEM_PROMPT = `You are MarketLens AI — a senior market research analyst and startup advisor.

You have been given a structured market research report and must answer follow-up questions about it.

RULES:
- Answer concisely but with depth. Aim for 2–4 paragraphs maximum.
- Always reference specific data from the report (TAM, SAM, competitor names, pain points, etc.).
- Be direct and actionable — give real recommendations, not generic advice.
- If a question is not answerable from the report, use your general expertise and label it clearly.
- Never make up statistics. If unsure, say "Based on the report…" or "Generally speaking…"
- Format answers in plain text. Do not use markdown headers or bullet points — write in flowing paragraphs.`;

router.post("/", async (req, res) => {
  const { question, report } = req.body || {};

  const questionErr = validateString(question, "Question", 3, 500);
  if (questionErr) return res.status(400).json({ error: questionErr });
  if (!report || typeof report !== "object") {
    return res.status(400).json({ error: "A valid report object is required." });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not configured." });

  console.log(`[Chat] question="${question.trim().slice(0, 80)}..."`);

  try {
    const reportContext = JSON.stringify(report, null, 2).slice(0, 6000); // token guard

    const { data } = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 800,
        temperature: 0.4,
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `MARKET RESEARCH REPORT:\n${reportContext}\n\nUSER QUESTION: ${question.trim()}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "MarketLens",
        },
        timeout: 30000,
      }
    );

    const answer = data.choices?.[0]?.message?.content?.trim() || "No response generated.";
    console.log(`[Chat] ✅ answered`);
    res.json({ answer });

  } catch (err) {
    console.error("[Chat] Error:", err.message);
    if (err.response?.status === 401) {
      return res.status(401).json({ error: "Invalid API key." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request timed out. Please try again." });
    }
    res.status(500).json({ error: err.message || "Chat failed. Please try again." });
  }
});

export default router;