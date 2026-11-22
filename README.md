# Proofwork

Proof helps UX-trained career changers turn one piece of past, non-UX work into evidence an employer can judge, using only their own words.

The flow is: Home → describe past work in four fields (role, situation, what you did, what changed) → review suggested connections → view the proof guide → copy it, or download it as a PDF (a preview screen, and the PDF is saved straight away as "[guide title].pdf").

## Setup

This project needs Node.js 18 or later. It has no local package dependencies or build step.

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The local server uses native filesystem paths, so the normal command works on Windows as well as other supported platforms.

## Tests

Run the offline rule-engine and guardrail tests with:

```sh
npm test
```

## Optional AI assistance

Without an API key, Proof uses its built-in rule-based engine. It matches the person's submitted words to UX skills and runs guardrails to prevent invented claims.

To enable Claude suggestions, set `ANTHROPIC_API_KEY` in your shell or deployment environment before starting the app. You can optionally set `MODEL`; it defaults to `claude-sonnet-5-5`.

On Vercel: Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` for **Production** (and Preview if you test preview links), then redeploy, because a new variable only applies to new deployments. To tell whether the AI is running: on the review screen, AI-made suggestions show the line "Suggested by AI, using only your words. Check every line." If the AI failed or broke a guardrail, a note above the suggestions says they come from matching your own words. If neither appears, the key isn't set and the rule-based engine is answering. The function logs (Vercel → Logs) show `AI call failed: …` or `AI output failed guardrails: …` with the reason, and never include the person's answers. Locally, `npm run dev` prints "AI mode: on (key found)" or "AI mode: off".

```sh
# PowerShell
$env:ANTHROPIC_API_KEY = "your-key"
npm run dev

# Optional live AI checks
npm run test:ai
```

Keep API keys out of source control, `.env` files committed to the repository, and client-side code. AI output is still validated against the person's submitted text; if it fails validation or the API is unavailable, the app falls back to the rule-based engine.

## Current limitations

- No accounts, saved progress, or cross-session persistence.
- No PDF export, sharing links, analytics, feedback, or mentor collaboration.
- AI assistance requires an Anthropic API key; the app remains usable without one.
- The PDF download loads html2pdf.js 0.10.2 from cdnjs (pinned, with an integrity hash) when a user downloads, so that action needs internet access. There is no print dialog, so no browser prompt. The text in the PDF is an image of the page, so it can't be selected or searched. The page's fonts load from Google Fonts.
