// Live AI tests, for when you have a key:
//   ANTHROPIC_API_KEY=sk-ant-... npm run test:ai
// Calls Claude directly (not the fallback) so you see the model's own behavior.
import { FIXTURES } from "./fixtures.js";
import { SYSTEM_PROMPT } from "../lib/system-prompt.js";
import { buildUserText } from "../lib/engine.js";
import { validate, parseModelJson } from "../lib/guardrails.js";

if (!process.env.ANTHROPIC_API_KEY) { console.log("Set ANTHROPIC_API_KEY to run the live AI tests."); process.exit(1); }
const MODEL = process.env.MODEL || "claude-sonnet-5-5";
const RUNS = Number(process.env.RUNS || 1);
let pass = 0, fail = 0;
for (const [name, f] of Object.entries(FIXTURES)) {
  for (let r = 1; r <= RUNS; r++) {
    const userText = buildUserText(f.answers, f.title);
    let out, problems = [];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: SYSTEM_PROMPT, messages: [{ role: "user", content: userText }] }),
      });
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
      const data = await res.json();
      out = parseModelJson(data.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
      problems = validate(userText, out);
      if (!f.expect.includes(out.status)) problems.push(`status ${out.status}, expected ${f.expect.join(" or ")}`);
    } catch (e) { problems = [`error: ${e.message}`]; }
    const label = `${name}${RUNS > 1 ? ` #${r}` : ""}`;
    if (problems.length) { fail++; console.log(`✗ ${label}\n  - ${problems.join("\n  - ")}`); }
    else { pass++; console.log(`✓ ${label}  (${out.status}, ${out.candidates.length} candidates)`); }
    if (out && process.env.VERBOSE) console.log(JSON.stringify(out, null, 2));
  }
}
console.log(`\n${pass} passed, ${fail} failed  [model: ${MODEL}]`);
process.exit(fail ? 1 : 0);
