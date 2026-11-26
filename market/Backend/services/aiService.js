import axios from "axios";
import { buildResearchPrompt, buildChatPrompt } from "../utils/prompts.js";

const GEMINI_OPENAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_FALLBACK_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];
const RETRYABLE_STATUSES = new Set([404, 429, 503]);

/**
 * Sends a chat-completion request using Gemini (preferred when GEMINI_API_KEY is set)
 * with automatic fallback across Gemini Flash models, or OpenRouter free routing.
 */
export async function callLLM({
  systemPrompt,
  userPrompt,
  maxTokens = 4000,
  temperature = 0.3,
  timeout = 60000,
}) {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return callGeminiWithFallback({
      apiKey: geminiKey,
      systemPrompt,
      userPrompt,
      maxTokens,
      temperature,
      timeout,
    });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!openRouterKey) {
    throw new Error("Neither GEMINI_API_KEY nor OPENROUTER_API_KEY is configured.");
  }

  const { data } = await axios.post(
    OPENROUTER_URL,
    {
      model: "openrouter/free",
      max_tokens: maxTokens,
      temperature,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: userPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "MarketLens",
      },
      timeout,
    }
  );

  return data.choices?.[0]?.message?.content || "";
}

async function callGeminiWithFallback({
  apiKey,
  systemPrompt,
  userPrompt,
  maxTokens,
  temperature,
  timeout,
}) {
  const configured = process.env.GEMINI_MODEL?.trim();
  const models = configured
    ? [configured, ...GEMINI_FALLBACK_MODELS.filter(m => m !== configured)]
    : GEMINI_FALLBACK_MODELS;

  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: userPrompt },
  ];

  let lastErr;
  for (const model of models) {
    try {
      const { data } = await axios.post(
        GEMINI_OPENAI_URL,
        { model, max_tokens: maxTokens, temperature, messages },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout,
        }
      );
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (!RETRYABLE_STATUSES.has(status)) throw err;
      console.warn(`[AI] Gemini model "${model}" returned ${status}, trying next fallback...`);
    }
  }
  throw lastErr;
}

/**
 * Maps upstream LLM HTTP/network errors into consistent API responses.
 */
export function handleLLMError(res, err, label, fallbackMessage) {
  console.error(`[${label}] Error:`, err.response?.data || err.message);
  const status = err.response?.status;
  if (status === 401 || status === 403) {
    return res.status(401).json({ error: "Invalid or unauthorized AI API key. Check your .env configuration." });
  }
  if (status === 402) {
    return res.status(402).json({ error: "API credits exhausted. Please check your AI account or use a free model." });
  }
  if (status === 429) {
    return res.status(429).json({ error: "AI rate limit hit. Please wait a moment and try again." });
  }
  if (status === 503) {
    return res.status(503).json({ error: "AI model is temporarily overloaded. Please try again shortly." });
  }
  if (err.code === "ECONNABORTED") {
    return res.status(504).json({ error: "Request timed out. The AI is busy — please try again." });
  }
  return res.status(500).json({ error: err.message || fallbackMessage });
}

export async function generateReport(context, idea, region, segment) {
  const prompt = buildResearchPrompt(context, idea, region, segment);
  const text = await callLLM({ userPrompt: prompt, temperature: 0.7 });
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start === -1 || end <= start) throw new Error("Invalid JSON from AI");
  return JSON.parse(text.slice(start, end));
}

export async function chatWithReport(question, report) {
  const prompt = buildChatPrompt(question, report);
  return callLLM({ userPrompt: prompt, maxTokens: 800, temperature: 0.4, timeout: 30000 });
}
