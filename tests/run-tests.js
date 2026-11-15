// Offline tests: no API key, no network. Runs every fixture through the
// rule-based path of the engine and checks the result with the guardrails.
//   npm test
import { FIXTURES } from "./fixtures.js";
import { findProof, buildUserText } from "../lib/engine.js";
import { validate } from "../lib/guardrails.js";

delete process.env.ANTHROPIC_API_KEY; // force the no-key path
let pass = 0, fail = 0;
for (const [name, f] of Object.entries(FIXTURES)) {
  const out = await findProof({ answers: f.answers, title: f.title });
  const problems = validate(buildUserText(f.answers, f.title), out);
  if (out.source !== "rules") problems.push(`expected source rules, got ${out.source}`);
  if (!f.expect.includes(out.status)) problems.push(`status ${out.status}, expected ${f.expect.join(" or ")}`);
  if (problems.length) { fail++; console.log(`✗ ${name}\n  - ${problems.join("\n  - ")}`); }
  else { pass++; console.log(`✓ ${name}  (${out.status}: ${out.candidates.map((c) => c.ux_skill).join(", ") || "no candidates"})`); }
  if (process.env.VERBOSE) console.log(JSON.stringify(out, null, 2));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
