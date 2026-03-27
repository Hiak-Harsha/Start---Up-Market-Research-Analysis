/**
 * utils/api.js
 * All API calls to the MarketLens backend.
 */

const BASE = "/api"; // proxied by Vite in dev

function getAuthHeader() {
  const token = localStorage.getItem("ml_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Server error ${res.status}`);
  }
  return data;
}

// ── Research ────────────────────────────────────────────────────────────────
export async function runMarketResearch(idea, region, segment) {
  const res = await fetch(`${BASE}/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ idea, region, segment }),
  });
  const data = await handleResponse(res);
  return data.report;
}

// ── Chat ────────────────────────────────────────────────────────────────────
export async function askFollowUp(question, report) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ question, report }),
  });
  const data = await handleResponse(res);
  return data.answer;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export async function signUp(name, email, password) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
}

export async function signIn(email, password) {
  const res = await fetch(`${BASE}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: getAuthHeader(),
  });
  return handleResponse(res);
}