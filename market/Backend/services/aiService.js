import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import { buildResearchPrompt, buildChatPrompt } from "../utils/prompts.js";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// 🧠 Generate Market Research Report
export async function generateReport(context, idea, region, segment) {
  try {
    const prompt = buildResearchPrompt(context, idea, region, segment);

    const res = await axios.post(
      BASE_URL,
      {
        model: "openrouter/auto", // ✅ auto free working model
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let text = res.data.choices[0].message.content;

    // 🔥 Extract JSON safely
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;

    if (start === -1 || end === -1) {
      throw new Error("Invalid JSON from AI");
    }

    const jsonString = text.slice(start, end);

    return JSON.parse(jsonString);

  } catch (err) {
    console.error("❌ OpenRouter Error:", err.response?.data || err.message);
    throw new Error("AI generation failed");
  }
}


// 💬 Chat with Report
export async function chatWithReport(question, report) {
  try {
    const prompt = buildChatPrompt(question, report);

    const res = await axios.post(
      BASE_URL,
      {
        model: "openrouter/auto", // ✅ same model
        messages: [
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;

  } catch (err) {
    console.error("❌ Chat Error:", err.response?.data || err.message);
    throw new Error("Chat failed");
  }
}