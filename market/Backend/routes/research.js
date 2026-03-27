/**
 * routes/research.js
 *
 * POST /api/research
 * Runs a full market research agent using:
 *   1. Tavily web search for live data across 4 research tracks
 *   2. OpenRouter (Claude) to synthesise findings into a structured JSON report
 */

import express from "express";
import axios from "axios";
import { validateString } from "../server.js";

const router = express.Router();

// ── Tavily search helper ─────────────────────────────────────────────────────
async function tavilySearch(query, maxResults = 5) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not configured");

  try {
    const { data } = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: true,
      },
      { timeout: 15000 }
    );
    return {
      answer: data.answer || "",
      results: (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        content: r.content?.slice(0, 800) || "",
      })),
    };
  } catch (err) {
    console.error("[Tavily]", query, err.message);
    return { answer: "", results: [] };
  }
}

// ── OpenRouter (Claude) call ─────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const { data } = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "anthropic/claude-3.5-haiku",
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "MarketLens",
      },
      timeout: 60000,
    }
  );

  return data.choices?.[0]?.message?.content || "";
}

// ── Parallel research tracks ─────────────────────────────────────────────────
async function runResearchTracks(idea, region, segment) {
  const queries = [
    `${idea} market size TAM SAM ${region} 2024 2025`,
    `${idea} competitors landscape ${region} pricing comparison`,
    `${idea} customer pain points problems ${segment}`,
    `${idea} ${region} startup investment funding VC activity 2024`,
  ];

  const [marketData, competitorData, painData, investorData] = await Promise.all(
    queries.map(q => tavilySearch(q, 5))
  );

  return { marketData, competitorData, painData, investorData };
}

// ── System prompt for structured report ─────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert market research analyst. Your task is to synthesise raw web research into a precise, structured JSON market research report.

CRITICAL RULES:
1. Output ONLY valid JSON — no markdown, no code fences, no explanation before or after.
2. Every field must be populated with realistic, specific data. Never use generic placeholders.
3. Use actual numbers, company names, and specific insights from the research data provided.
4. If certain data is not in the research, make educated estimates clearly labelled as "Est." but keep them realistic.
5. TAM/SAM/SOM must be dollar values (e.g. "$2.4B"). Growth must include CAGR.
6. Competitors: include 4–6 real companies. Include pricing in the format "$X–Y/user/mo" or equivalent.
7. Pain points: frequency must be realistic percentages (40–95%). Severity: "high", "medium", or "low".
8. Investor sentiment: "bullish", "neutral", or "bearish".

OUTPUT SCHEMA (output this exact structure):
{
  "marketSize": {
    "summary": "2–3 sentence market overview with specific numbers",
    "tam": "$X.XB",
    "sam": "$XXXM",
    "som": "$XXM",
    "growth": "XX% CAGR",
    "year": "2024",
    "projectedYear": "2029",
    "projectedTam": "$X.XB",
    "keyDrivers": ["driver1", "driver2", "driver3", "driver4"]
  },
  "competitors": [
    {
      "name": "Company Name",
      "pricing": "$X–Y/user/mo",
      "strength": "Key strength",
      "weakness": "Key weakness",
      "market": "Geographic focus",
      "founded": "YEAR",
      "funding": "$XM Series X or Bootstrapped",
      "userBase": "X companies / X users"
    }
  ],
  "pricingModels": [
    {
      "model": "Model name",
      "usage": 72,
      "desc": "Short description of model",
      "avgPrice": "$X/unit",
      "bestFor": "Use case"
    }
  ],
  "painPoints": [
    {
      "point": "Pain point name",
      "severity": "high",
      "freq": 85,
      "detail": "Specific description of the problem with data",
      "opportunity": "How your product addresses this"
    }
  ],
  "entryStrategy": {
    "summary": "2–3 sentence strategic overview",
    "tactics": ["tactic1", "tactic2", "tactic3", "tactic4"],
    "timeline": [
      { "phase": "Month 1–3", "goal": "Goal name", "action": "Specific action" },
      { "phase": "Month 4–6", "goal": "Goal name", "action": "Specific action" },
      { "phase": "Month 7–12", "goal": "Goal name", "action": "Specific action" }
    ],
    "channels": ["channel1", "channel2", "channel3", "channel4"],
    "riskFactors": ["risk1", "risk2"]
  },
  "investmentSignals": {
    "vcActivity": "Specific description of VC activity in this space",
    "recentFunding": "Recent funding rounds mentioned",
    "hotTopics": ["topic1", "topic2", "topic3", "topic4"],
    "sentiment": "bullish",
    "score": 75
  },
  "targetCustomerProfile": {
    "primaryBuyer": "Job title / persona",
    "companySize": "X–Y employees",
    "budget": "$X,000–Y,000/year",
    "buyingProcess": "Decision path description",
    "topPriorities": ["priority1", "priority2", "priority3"],
    "preferredChannels": ["channel1", "channel2", "channel3"]
  },
  "sources": ["source1", "source2", "source3", "source4", "source5"]
}`;

// ── POST /api/research ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { idea, region, segment } = req.body || {};

  // Validate inputs
  const ideaErr = validateString(idea, "Startup idea", 10, 500);
  const regionErr = validateString(region, "Region", 2, 100);
  const segmentErr = validateString(segment, "Segment", 2, 200);

  if (ideaErr || regionErr || segmentErr) {
    return res.status(400).json({ error: ideaErr || regionErr || segmentErr });
  }

  const cleanIdea = idea.trim();
  const cleanRegion = region.trim();
  const cleanSegment = segment.trim();

  console.log(`[Research] idea="${cleanIdea}" region="${cleanRegion}" segment="${cleanSegment}"`);

  try {
    // Run all 4 research tracks in parallel
    const { marketData, competitorData, painData, investorData } =
      await runResearchTracks(cleanIdea, cleanRegion, cleanSegment);

    // Collect all sources
    const allSources = [
      ...marketData.results,
      ...competitorData.results,
      ...painData.results,
      ...investorData.results,
    ]
      .filter(r => r.title)
      .slice(0, 10)
      .map(r => r.title);

    // Build research context for Claude
    const userPrompt = `
STARTUP IDEA: ${cleanIdea}
TARGET REGION: ${cleanRegion}
CUSTOMER SEGMENT: ${cleanSegment}

=== MARKET SIZE RESEARCH ===
${marketData.answer}
${marketData.results.map(r => `• ${r.title}: ${r.content}`).join("\n")}

=== COMPETITOR RESEARCH ===
${competitorData.answer}
${competitorData.results.map(r => `• ${r.title}: ${r.content}`).join("\n")}

=== CUSTOMER PAIN POINTS ===
${painData.answer}
${painData.results.map(r => `• ${r.title}: ${r.content}`).join("\n")}

=== INVESTOR SIGNALS ===
${investorData.answer}
${investorData.results.map(r => `• ${r.title}: ${r.content}`).join("\n")}

KNOWN SOURCES: ${allSources.join(", ")}

Based on ALL the research above, generate a complete market research report for this startup idea. Be specific, use real numbers, and ensure every section is populated with actionable insights.
    `.trim();

    // Synthesise with Claude
    const raw = await callClaude(SYSTEM_PROMPT, userPrompt);

    // Parse JSON — strip any accidental markdown fences
    let report;
    try {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      report = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[Research] JSON parse failed:", raw.slice(0, 500));
      return res.status(502).json({
        error: "The AI returned an unexpected format. Please try again.",
        raw: raw.slice(0, 500),
      });
    }

    // Merge actual web sources into the report
    if (allSources.length > 0) {
      report.sources = [...new Set([...(report.sources || []), ...allSources])].slice(0, 8);
    }

    console.log(`[Research] ✅ Report generated for: ${cleanIdea}`);
    res.json({ report });

  } catch (err) {
    console.error("[Research] Error:", err.message);
    if (err.response?.status === 401) {
      return res.status(401).json({ error: "Invalid API key. Check your OPENROUTER_API_KEY." });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: "AI rate limit hit. Please wait a moment and try again." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Request timed out. The AI is busy — please try again." });
    }
    res.status(500).json({ error: err.message || "Research failed. Please try again." });
  }
});

export default router;