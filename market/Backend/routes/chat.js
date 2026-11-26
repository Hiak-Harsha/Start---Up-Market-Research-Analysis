/**
 * routes/chat.js
 *
 * POST /api/chat
 * Handles follow-up questions about a market research report.
 * Passes the full report as context and returns a plain-text answer.
 */

import express from "express";
import { validateString } from "../server.js";
import { callLLM, handleLLMError } from "../services/aiService.js";

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

  console.log(`[Chat] question="${question.trim().slice(0, 80)}..."`);

  try {
    const reportContext = JSON.stringify(report, null, 2).slice(0, 6000); // token guard
    const raw = await callLLM({
      systemPrompt: CHAT_SYSTEM_PROMPT,
      userPrompt: `MARKET RESEARCH REPORT:\n${reportContext}\n\nUSER QUESTION: ${question.trim()}`,
      maxTokens: 800,
      temperature: 0.4,
      timeout: 30000,
    });

    const answer = raw.trim() || "No response generated.";
    console.log(`[Chat] ✅ answered`);
    res.json({ answer });
  } catch (err) {
    return handleLLMError(res, err, "Chat", "Chat failed. Please try again.");
  }
});

export default router;
