# Proof from past work

Proof helps UX-trained career changers turn one piece of past, non-UX work into evidence an employer can judge, using only their own words.

The flow is: Welcome → describe past work in four fields (role, situation, what you did, what changed) → review proof candidates → fill gaps and complete a privacy check → copy the result or download it as a Word document.

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
- The Word export loads `docx` version 9.5.1 from jsDelivr when a user requests a download, so that action needs internet access.
