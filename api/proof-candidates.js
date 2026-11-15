// Vercel server function: POST /api/proof-candidates
// Body: { answers: [five strings], title?: string }
import { cleanInput, findProof, InputError } from "../lib/engine.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
    const input = cleanInput(body);
    const result = await findProof(input);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof InputError || err instanceof SyntaxError) {
      return res.status(400).json({ error: err instanceof InputError ? err.message : "That request wasn't valid JSON." });
    }
    console.error("proof-candidates failed:", err.message);
    return res.status(500).json({ error: "Something went wrong finding proof. Please try again." });
  }
}
