// Deterministic rule tests for the proof-candidate prompt.
// These checks are used in the test runner AND can run in the app at runtime.
// If validate() returns violations, show the fallback message instead of the model output.

export const UX_SKILLS = [
  "user_research", "synthesizing_feedback", "problem_framing",
  "process_or_service_design", "prioritization", "testing_and_iterating",
  "stakeholder_communication", "information_architecture",
  "accessibility_and_inclusion", "designing_for_constraints",
];
export const FORMATS = ["case_study", "before_after_redesign"];
export const STATUSES = ["ok", "needs_more_detail", "too_few_candidates", "off_topic"];

const HIRING_PROMISES = [
  /guarantee/i, /you(?:'| wi)ll (?:get|land) (?:a |the )?(?:job|interview|offer|hired)/i,
  /(?:get|gets|getting) you hired/i, /land (?:a|your) (?:job|role)/i,
  /employers will (?:hire|want)/i, /secure (?:a|an) (?:job|interview|offer)/i,
];

const norm = (s) => String(s ?? "")
  .toLowerCase()
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
  .replace(/\s+/g, " ").trim();

const numbersIn = (s) => (String(s ?? "").match(/\d+(?:[.,]\d+)?/g) || [])
  .map((n) => n.replace(",", ""));

export function parseModelJson(text) {
  const clean = String(text).replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

/**
 * @param {string} userText  all of the person's answers joined together
 * @param {object} out       parsed model JSON
 * @returns {string[]}       list of violations (empty = passed)
 */
export function validate(userText, out) {
  const v = [];
  const src = norm(userText);
  const srcNums = new Set(numbersIn(userText));

  if (!out || typeof out !== "object") return ["output is not an object"];
  if (!STATUSES.includes(out.status)) v.push(`bad status: ${out.status}`);
  if (typeof out.message !== "string" || !out.message.trim()) v.push("missing message");

  const cands = Array.isArray(out.candidates) ? out.candidates : null;
  if (!cands) v.push("candidates is not an array");
  const n = cands ? cands.length : 0;

  // Status <-> candidate count consistency
  if (out.status === "ok" && (n < 2 || n > 3)) v.push(`status ok needs 2–3 candidates, got ${n}`);
  if (out.status === "too_few_candidates" && n !== 1) v.push(`too_few_candidates needs exactly 1, got ${n}`);
  if (["needs_more_detail", "off_topic"].includes(out.status) && n !== 0) v.push(`${out.status} must have 0 candidates`);
  if (out.status === "needs_more_detail" && !out.follow_up?.question) v.push("needs_more_detail without a follow-up question");

  // Every number anywhere in the output must come from the input (no invented figures)
  const outText = JSON.stringify(out);
  for (const num of numbersIn(outText)) {
    // ignore candidate ids like "c1"
    if (!srcNums.has(num) && !new RegExp(`"c${num}"`).test(outText)) {
      v.push(`invented number: ${num}`);
    }
  }

  // No hiring promises anywhere
  for (const re of HIRING_PROMISES) if (re.test(outText)) v.push(`hiring promise: ${re}`);

  (cands || []).forEach((c, i) => {
    const tag = `candidate ${i + 1}`;
    if (!c.quote || !src.includes(norm(c.quote))) v.push(`${tag}: quote is not verbatim from the user`);
    if (c.quote && c.quote.split(/\s+/).length > 40) v.push(`${tag}: quote over 40 words`);
    if (!UX_SKILLS.includes(c.ux_skill)) v.push(`${tag}: bad ux_skill ${c.ux_skill}`);
    if (!FORMATS.includes(c.could_become)) v.push(`${tag}: bad could_become ${c.could_become}`);
    if (!c.why_it_matters?.trim()) v.push(`${tag}: missing why_it_matters`);
  });

  // No duplicate quotes
  const quotes = (cands || []).map((c) => norm(c.quote));
  if (new Set(quotes).size !== quotes.length) v.push("duplicate quotes");

  return v;
}

export const FALLBACK = {
  status: "needs_more_detail",
  message: "We couldn't find proof in this yet without guessing. Could you add a little more about what you did, step by step?",
  follow_up: {
    question: "Walk us through what you actually did, one step at a time.",
    examples: [
      "I noticed customers kept asking the same question at checkout, so I…",
      "I rewrote the intake form after nurses kept skipping a field…",
    ],
  },
  candidates: [],
};
