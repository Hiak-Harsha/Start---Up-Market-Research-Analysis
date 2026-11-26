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
import { callLLM, handleLLMError } from "../services/aiService.js";

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

// ── AI synthesis call ─────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  return callLLM({
    systemPrompt,
    userPrompt,
    maxTokens: 4000,
    temperature: 0.3,
    timeout: 60000,
  });
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
6. Competitors: include 4–6 real companies. Include pricing format "$X–Y/user/mo". Also provide a realistic "marketShare" (integer 1-100) indicating their dominance.
7. Pain points: frequency must be realistic percentages (40–95%). Severity: "high", "medium", or "low".
8. Investor sentiment: "bullish", "neutral", or "bearish".
9. Strictly adapt all financial values (TAM, SAM, pricing, budget) to match the standard currency of the TARGET REGION (e.g. use INR '₹' and local grouping formats like Lakhs/Crores for India). Do not default to USD unless appropriate.
10. At the root, generate a "confidenceScore" (integer 0-100) based on the depth and reliability of the data sources.

OUTPUT SCHEMA (output this exact structure):
{
  "confidenceScore": 85,
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
      "marketShare": 45,
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
      .slice(0, 20)
      .map(r => r.title);

    // Calculate real-time programmatic confidence rating based on data fetch success
    let sourceCount = allSources.length;
    let volumeScore = Math.min((sourceCount / 16) * 50, 50); // Up to 50% for finding enough varied sources (16+ is perfect)

    let answerScore = 0;
    if (marketData.answer?.length > 50) answerScore += 5;
    if (competitorData.answer?.length > 50) answerScore += 5;
    if (painData.answer?.length > 50) answerScore += 5;
    if (investorData.answer?.length > 50) answerScore += 5; // Up to 20% for direct AI summary answers from Tavily

    let combinedContent = [
      ...marketData.results,
      ...competitorData.results,
      ...painData.results,
      ...investorData.results
    ].map(r => r.content || "").join(" ");
    let contentScore = Math.min((combinedContent.length / 5000) * 30, 30); // Up to 30% for data depth

    const realConfidenceScore = Math.round(Math.max(12, volumeScore + answerScore + contentScore));

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

    // Parse JSON — strip any <think> blocks, markdown fences, or surrounding prose
    let report;
    try {
      const stripped = raw
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();
      const firstBrace = stripped.indexOf("{");
      const lastBrace = stripped.lastIndexOf("}");
      const jsonText = firstBrace !== -1 && lastBrace > firstBrace
        ? stripped.slice(firstBrace, lastBrace + 1)
        : stripped;
      report = JSON.parse(jsonText);
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
    
    // Overwrite any hallucinated AI score with our math-backed real-time score
    report.confidenceScore = realConfidenceScore;

    console.log(`[Research] ✅ Report generated for: ${cleanIdea} | Real Confidence: ${realConfidenceScore}%`);
    res.json({ report });

  } catch (err) {
    return handleLLMError(res, err, "Research", "Research failed. Please try again.");
  }
});

export default router;