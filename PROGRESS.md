# Progress vs. BUILD-BRIEF.md

Reviewed `public/app.js`, `public/index.html`, `api/proof-candidates.js`, `README.md`, `package.json`. Only the review suggestions step (`public/app.js`, `public/styles.css`) has been changed since. I did not open `lib/*` or the tests, so I haven't checked engine and guardrail details.

## Matches the brief
- **Review suggestions step (done):** Add to guide / Edit / Skip on each card, an Undecided / Added / Skipped badge, and Undo after a decision. Several suggestions can be added. An "Included in your guide" panel on the right lists added items in a What I did | What it shows table, with an empty message. Continuing with nothing added shows "Choose at least one connection to continue." The next screen, Copy as text and the Word export include every added item. Stack stays vanilla JS.
- No login, no database; state is in memory only. There is a "nothing is saved" footer and a `beforeunload` warning.
- Serverless function (`api/proof-candidates.js`, Vercel-style) with the AI key kept server-side.
- AI step is already wired, with a rule-based fallback (not in the brief) when there's no key or validation fails.
- Output is built from the user's own words (quotes are checked against their text) plus skill labels, so "nothing invented" is honored in spirit.
- Copy-to-clipboard works.
- Edit wording on a suggestion (existing logic kept).
- Short-input handling exists, as a follow-up question.
- **Styling from STYLE-GUIDE.md (first pass):** `styles.css` now uses only the guide's tokens, Fraunces and Inter, the three button styles (outline default, primary, ghost; 48px, 40px in cards), status badges and the 20px/12px radii. Done for the shared header (logo tile, Home, "Nothing invented"), the four progress badges with "Step X of 4", and the review screen (cards, skill chip, info box, right column with table and note, bottom bar, attribution line). Other screens only inherit the new tokens, fonts and buttons; their layouts are not redone yet.
- **Copy fixes:** no more "[object PointerEvent]" on Step 1 (the Start button passed the click event in as an error message). The review intro now says "Choose the ones that feel true to you." Gap questions are general ("How did you decide what the people using it needed?"). Free wording is "Free. No sign-up needed." CSS has `text-wrap: balance` on headings and `pretty` on paragraphs.

## Missing
- **Home landing page:** only a simple welcome. Missing the nav with Start, the eyebrow, the example proof card, the three promises, How it works, the Example section, Our approach / Honest limits, the FAQ, the final CTA and the Tech Fleet CC BY 4.0 footer attribution.
- **Shared header:** no "Nothing invented" label or button, and no 4-step badges.
- **Step 3 "Your proof guide":** no background/role, problem, what-changed or next-steps tip, and no table of added connections.
- **Styling gaps vs. STYLE-GUIDE.md:** Home, Step 1 and the result screen still use their old layouts (page titles are 20px, not the 36px h1). Card titles show the skill name because suggestions have no separate title. Badge text stays Undecided / Added / Skipped and Undo stays (the guide says "Added to guide" / "Not added yet" and "Remove from guide"), because earlier instructions asked for them. "About this connection" link is left out until its panel exists. The result screen is steps 3 and 4 combined, so it shows "Step 3 of 4".
- **Step 4 "Copy & download":** no dedicated screen, no "Leave session", no "Keep your summary" reminder.
- **Printable guide preview + PDF (`window.print()`).**
- **Pop-ups:** Before you begin, Leave session, Finding connections (with Cancel), No connections found, Processing failed screens, Download failed, Edit connection modal, About connection panel. (The "Choose a connection" state is inline text, not a modal.) The app only has inline loading text, an inline error and a `confirm()` on start over.
- **Per-card:** "Connects to" chip with the framework definition and link, and the "About this connection" panel. Edit is still inline, not the brief's Edit connection modal.
- **Tech Fleet attribution:** the app has no "Tech Fleet skill" label and no "Skill names: Tech Fleet Skills & Practices Framework, CC BY 4.0" line anywhere. It still needs adding (landing footer and guide). There is also no FAQ yet, so the cost answer ("Nothing—it's completely free. Work through short tasks at your own pace.") has nowhere to go.
- **Framework skill list:** I haven't checked whether the Tech Fleet skills list is in the prompt (look in `lib/`).
- **Deploy:** no Vercel/Netlify config or shareable link.

## Different from the brief
- **Stack:** vanilla JS, no build step, no React/Vite (the brief says React + Vite).
- **Flow:** 3 steps, not 4. The brief's steps 3 (guide) and 4 (copy/download) are combined on one screen. The brief has Add experience → Review suggestions → Proof guide → Copy & download.
- **Input form:** 5 questions (task, who it was for, steps, decisions, what changed) plus a "Job title (optional)". The brief has 4 fields: role, situation/problem, what you did, what changed.
- **Suggestions:** fields are `ux_skill_label`/`why_it_matters`/`could_become`, not the brief's `title`/`skill`/`why`.
- **Download:** Word `.docx` loaded from a CDN, not PDF.
- **Extras not in the brief:** gap questions, a privacy checkbox, and a "what done looks like" checklist.
- **Copy and names:** product is called "Proof from past work", not "Proof". The wording differs from the Figma copy.
- **Short input rule:** requires 2 of 5 answers filled in, not the brief's under 20 words in "What did you do".
- **Fallback:** the rule-based engine runs without an API key, instead of the brief's 3 fixed mock connections.
