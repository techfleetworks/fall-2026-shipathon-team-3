# Proof MVP #1 — Build Brief

Source: Figma file "Proof MVP #1 — Low-fi wireframes", page "Hi-fi prototype".
Deadline: hackathon, ~24 hours. Working demo beats perfect code.

## What the product does

Proof helps career changers who are trained in UX (but not yet hired) turn one piece of real work from their past job into UX evidence. The user describes what they did, the app suggests connections between their actions and UX skills from Tech Fleet's Skills & Practices Framework, the user keeps only the ones that fit, and they get a "proof guide" they can copy or download.

Core promise, repeated across the design: **"Nothing invented."** The app only uses the user's own words. Suggested skills come only from the framework's list.

## Tech choices (keep it simple)

- React + Vite, plain CSS (or Tailwind if faster for you)
- No login, no database. All state lives in memory. The design says outright that work is NOT saved, so no persistence is needed.
- One AI call to suggest connections (see "AI step" below). Build with fake/mock suggestions FIRST, wire AI last.
- Deploy on Vercel or Netlify so there is a shareable link.

## Screens (build in this order)

### 0. Home (landing page)
Sections top to bottom:
1. Nav: logo "Proof" + "Start" button
2. Hero: eyebrow "FOR CAREER CHANGERS TRAINED IN UX, NOT YET HIRED", headline "Your past work already counts. Let's turn it into UX…", short intro, a "We don't save your work" notice box, two buttons (Start / see example), "Free while you build your proof." On the right: an example proof card (retail supervisor example).
3. Three promises: "At your own pace" / "0 invented details" / "You stay in control"
4. How it works: 01 Start with real work, 02 See the connections, 03 Build a proof you own
5. Example proof section ("Not a new story. A new way to see yours.")
6. Our approach: three commitments + "Honest limits" box
7. FAQ: 4 questions
8. Final call to action ("Start with something you've already done.") + no-autosave reminder
9. Footer with Tech Fleet framework attribution (CC BY 4.0)

Copy exact text from the Figma file where possible.

### Shared header on steps 1–3
- Logo + "[Product name]", a button + "Nothing invented" label on the right
- Four-step progress badges + "Step X of 4"

### 1. Add experience
Heading: "Tell us about one piece of work from your past field". Subtext: "Describe what you did, not your job title. Messy notes are fine. We only use what you write."
An "unsaved experience" warning box.
Four fields:
- What was your role then? (optional) — single line
- What was the situation or problem? — textarea
- What did you do, step by step? — textarea
- What changed because of it? — textarea
Buttons: Back (left), Find connections (right).
Right sidebar: "Your experience" note + "Good starting points" tips.

### 2. Review suggestions
Heading: "Choose the connections for your guide". Subtext: "Add only what fits your experience. Edit first if needed, or skip. Every decision can be undone."
One card per suggestion (the design shows 3):
- Title (short summary of the action)
- Status badge (undecided / added / skipped)
- "From your experience": a direct quote from what the user wrote
- "Connects to": a skill chip + "About this connection" link (opens a small panel with the framework's definition + "Open in the framework ↗")
- "Why we suggested this": one or two sentences
- Buttons: Add to guide / Edit / Skip, plus an Undo button that appears after a decision
Right sidebar: "Included in your guide" table (What I did | What it shows), only showing added items. Empty message when nothing added. Note: "Only added connections are included…"
Bottom bar: "Ready to preview your guide?" with Back + Preview guide buttons.
If the user tries to continue with zero added → show "Choose a connection" state.

### 3. View your proof guide
Heading: "Your proof guide". Card shows: background (role), a title, The problem, What I did, What changed, a "Next: gather notes or a checklist if you have them. Don't invent missing evidence." tip, and a table of added connections (What I did | UX skill connection). Attribution line. Buttons: Back to edit / Continue.

### 4. Copy & download
Heading "Copy & download your proof guide", "Leave session" button.
Shared proof card (same content as step 3, compact). "Keep your summary" reminder (because nothing is saved).
Buttons: Back, Copy guide (copies plain text to clipboard), Download (PDF).
Plus a "Guide document preview" page showing the printable layout: title, author/background, problem, what I did, numbered skill evidence, attribution, page number.
Fastest PDF route: a print-styled preview page + `window.print()`. Use a real PDF library only if time allows.

## States / pop-ups (small modal or inline cards)

- Before you begin (Not now / Start experience)
- Leave session (Stay here / Leave anyway) — warns that work will be lost
- Finding connections (loading, with Cancel)
- More detail needed (input too short → Back to experience)
- No connections found (Edit experience / Return home)
- Processing failed (Try again / Back to experience)
- Download failed (Try again / Back to guide)
- Choose a connection (tried to continue with none added → Keep reviewing)
- Edit connection (shows original experience, guidance, editable wording, Cancel / Save to guide)
- About connection (reasoning + framework attribution, Done)

## AI step (do this LAST)

On "Find connections", send the four fields to an AI model and ask for JSON:

```json
{
  "connections": [
    {
      "title": "Finding out where new staff got stuck",
      "quote": "Asked new staff where they got stuck",
      "skill": "User research",
      "why": "One or two sentences explaining the link."
    }
  ]
}
```

Rules for the prompt:
- `quote` must be copied word for word from the user's text.
- `skill` must come ONLY from the provided list of Tech Fleet framework skills (pass the list in the prompt).
- Never add facts the user did not write.
- Return an empty list if nothing fits (→ "No connections found" state).
- If the "What did you do" field is very short (e.g. under ~20 words), skip the AI call and show "More detail needed".

Keep the API key on a server (Vercel/Netlify serverless function), never in the browser code.
Until this is wired, return the 3 example connections from the design (User research, Content design, Iterating on feedback) as mock data.

## If time runs short, cut in this order
1. Keep: Home (hero only), Steps 1–4, mock suggestions, Copy guide
2. Then add: real AI call
3. Then: Edit / About modals, error states
4. Last: full landing page sections, PDF download polish
