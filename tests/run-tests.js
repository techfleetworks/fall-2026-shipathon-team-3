// Offline tests: no API key, no network. Runs every fixture through the
// rule-based path of the engine and checks the result with the guardrails.
//   npm test
import { FIXTURES } from "./fixtures.js";
import { findProof, buildUserText } from "../lib/engine.js";
import { validate, checkGuideTitle } from "../lib/guardrails.js";
import { findProofWithRules } from "../lib/rules-engine.js";

delete process.env.ANTHROPIC_API_KEY; // force the no-key path
let pass = 0, fail = 0;
for (const [name, f] of Object.entries(FIXTURES)) {
  const out = await findProof({ answers: f.answers });
  const problems = validate(buildUserText(f.answers), out);
  if (out.source !== "rules") problems.push(`expected source rules, got ${out.source}`);
  if (out.candidates.length && checkGuideTitle(buildUserText(f.answers), out.guide_title).length) problems.push(`bad guide_title: ${JSON.stringify(out.guide_title)}`);
  if (!f.expect.includes(out.status)) problems.push(`status ${out.status}, expected ${f.expect.join(" or ")}`);
  if (problems.length) { fail++; console.log(`✗ ${name}\n  - ${problems.join("\n  - ")}`); }
  else { pass++; console.log(`✓ ${name}  (${out.status}: ${out.candidates.map((c) => c.ux_skill).join(", ") || "no candidates"})`); }
  if (process.env.VERBOSE) console.log(JSON.stringify(out, null, 2));
}

const sparkle = await findProof({ answers: FIXTURES.sparkleclean_new_website.answers });
const sparkleInfo = sparkle.candidates.find((candidate) => candidate.ux_skill === "information_architecture");
if (!sparkleInfo) { fail++; console.log("✗ sparkleclean_new_website regression\n  - missing information architecture candidate"); }
else {
  const problems = [];
  if (sparkleInfo.could_become !== "case_study") problems.push("new project was presented as a before-and-after redesign");
  if (!sparkleInfo.missing.includes("How did you decide what the people using it needed?")) problems.push("new project follow-up did not ask about what the people using it needed");
  if (problems.length) { fail++; console.log(`✗ sparkleclean_new_website regression\n  - ${problems.join("\n  - ")}`); }
  else { pass++; console.log("✓ sparkleclean_new_website regression  (new project wording)"); }
}
// Guide title: shape of the rule-based title, and what the guardrail lets through.
const check = (name, problems) => {
  if (problems.length) { fail++; console.log(`✗ ${name}\n  - ${problems.join("\n  - ")}`); }
  else { pass++; console.log(`✓ ${name}`); }
};
const DANGLING_END = /\b(?:the|a|an|of|to|on|in|for|with|that|when|while|if|than|or|but|how|and|so|because|after|before|our|my|their)$/i;
for (const [name, f] of Object.entries(FIXTURES)) {
  const title = findProofWithRules(f.answers).guide_title;
  if (!title) continue;
  const problems = [];
  if (DANGLING_END.test(title)) problems.push(`title ends mid-thought: "${title}"`);
  if (title.split(/\s+/).length > 10) problems.push(`title over 10 words: "${title}"`);
  if (/[.!?]$/.test(title)) problems.push(`title ends with punctuation: "${title}"`);
  check(`guide title shape: ${name}  ("${title}")`, problems);
}
const shifts = ["Shift lead", "Staff swapped shifts through a messy group chat and messages got buried.", "I made a shared swap board and asked everyone to post there first.", "Fewer missed shifts."];
const shiftsTitle = findProofWithRules(shifts).guide_title;
check("guide title reads as a summary, not a fragment", /^Improving how staff swapped shifts/.test(shiftsTitle) ? [] : [`got "${shiftsTitle}"`]);
const reg = buildUserText(FIXTURES.store_manager.answers);
check("guardrail: action opener + the person's own words passes", ["Redesigning the returns process", "Improving how new cashiers got the steps wrong", "Fixing the returns process at our store"].flatMap((t) => checkGuideTitle(reg, t)));
const rejected = ["Messages got buried", "Increasing sales at our store", "Improving how managers handled refunds"];
check("guardrail: invented words are still rejected", rejected.filter((t) => checkGuideTitle(reg, t).length === 0).map((t) => `accepted "${t}"`));
check("guardrail: a made-up number is still rejected", validate(reg, { status: "needs_more_detail", message: "x", follow_up: { question: "q" }, guide_title: "Improving returns for 300 customers", candidates: [] }).some((p) => /invented number/.test(p)) ? [] : ["number 300 was accepted"]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
