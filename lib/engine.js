// Decides how to find proof candidates:
//   - ANTHROPIC_API_KEY set  -> ask Claude, then check the answer with the guardrails
//   - no key, AI error, or a guardrail violation -> rule-based engine
// The result always says which one produced it ("source"), so the UI can be honest.
import { SYSTEM_PROMPT } from "./system-prompt.js";
import { validate, parseModelJson, FALLBACK } from "./guardrails.js";
import { findProofWithRules, SKILL_LABELS } from "./rules-engine.js";

export const QUESTIONS = [
  "One task or project you handled in a past job",
  "Who it was for, and what they were struggling with",
  "What you did, step by step",
  "What you had to decide along the way, and why",
  "What changed afterward",
];

const MAX_ANSWER = 2000;
const MAX_TITLE = 100;

export function cleanInput(body) {
  const answers = Array.isArray(body?.answers) ? body.answers : null;
  if (!answers || answers.length !== 5) throw new InputError("Send exactly five answers.");
  const clean = answers.map((a) => String(a ?? "").trim());
  if (clean.some((a) => a.length > MAX_ANSWER)) throw new InputError("One of the answers is too long. Please shorten it.");
  const title = String(body?.title ?? "").trim().slice(0, MAX_TITLE);
  return { answers: clean, title };
}

export class InputError extends Error {}

export function buildUserText(answers, title) {
  const lines = [];
  if (title) lines.push(`Optional job title: ${title}`);
  answers.forEach((a, i) => lines.push(`Q${i + 1}. ${QUESTIONS[i]}\nA: ${a || "(no answer)"}`));
  return lines.join("\n\n");
}

async function askClaude(userText) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.MODEL || "claude-sonnet-5-5",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userText }],
      }),
    });
    if (!res.ok) throw new Error(`API status ${res.status}`);
    const data = await res.json();
    return data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  } finally {
    clearTimeout(timer);
  }
}

function withLabels(result, source, note) {
  return {
    ...result,
    source, // "ai" or "rules"
    note: note || null,
    candidates: (result.candidates || []).map((c) => ({ ...c, ux_skill_label: SKILL_LABELS[c.ux_skill] || c.ux_skill })),
  };
}

export async function findProof({ answers, title }) {
  const userText = buildUserText(answers, title);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const out = parseModelJson(await askClaude(userText));
      const problems = validate(userText, out);
      if (problems.length === 0) return withLabels(out, "ai");
      // Never log the person's answers. Only log what rule broke.
      console.warn("AI output failed guardrails:", problems.join("; "));
      return rulesResult(answers, userText, "The AI's suggestion didn't pass our honesty checks, so these come from matching your own words.");
    } catch (err) {
      console.warn("AI call failed:", err.message);
      return rulesResult(answers, userText, "The AI wasn't available, so these come from matching your own words.");
    }
  }
  return rulesResult(answers, userText);
}

function rulesResult(answers, userText, note) {
  const out = findProofWithRules(answers);
  // The rules engine should always pass. If it ever doesn't, use the safe fallback.
  const problems = validate(userText, out);
  if (problems.length) {
    console.warn("Rules output failed guardrails:", problems.join("; "));
    return withLabels(FALLBACK, "rules", note);
  }
  return withLabels(out, "rules", note);
}
