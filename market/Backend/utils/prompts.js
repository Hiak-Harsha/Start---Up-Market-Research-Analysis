export function buildResearchPrompt(context, idea, region, segment) {
  return `
You are a market research expert.

Startup Idea: ${idea}
Region: ${region}
Segment: ${segment}

Generate JSON:

{
  "marketSize": {
    "summary": "",
    "tam": "",
    "sam": "",
    "som": "",
    "growth": ""
  },
  "competitors": [
    {
      "name": "",
      "pricing": "",
      "strength": "",
      "weakness": "",
      "market": ""
    }
  ],
  "pricingModels": [
    {
      "model": "",
      "usage": 0,
      "desc": ""
    }
  ],
  "painPoints": [
    {
      "point": "",
      "severity": "high|medium|low",
      "freq": 0
    }
  ],
  "entryStrategy": {
    "summary": "",
    "tactics": []
  },
  "sources": []
}

Data:
${context}

ONLY return JSON.
`;
}

export function buildChatPrompt(question, report) {
  return `
You are a startup advisor.

Report:
${JSON.stringify(report)}

Question:
${question}

Answer clearly and practically.
`;
}