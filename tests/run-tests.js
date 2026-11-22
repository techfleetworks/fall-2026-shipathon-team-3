// Offline tests: no API key, no network. Runs every fixture through the
// rule-based path of the engine and checks the result with the guardrails.
//   npm test
import { FIXTURES } from "./fixtures.js";
import { findProof, buildUserText } from "../lib/engine.js";
import { validate } from "../lib/guardrails.js";

delete process.env.ANTHROPIC_API_KEY; // force the no-key path
let pass = 0, fail = 0;
for (const [name, f] of Object.entries(FIXTURES)) {
  const out = await findProof({ answers: f.answers });
  const problems = validate(buildUserText(f.answers), out);
  if (out.source !== "rules") problems.push(`expected source rules, got ${out.source}`);
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
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
