# Home page — exact spec from Figma ("Hi-fi · Home")

Use STYLE-GUIDE.md tokens and components. Use the copy below word for word; it already includes the team's copy feedback (it replaces any earlier "Free while you build your proof" or "Free. No sign-up needed." wording). Where the design says [Product name], use the same product name the app header uses.

Extra text style: **Display** = Fraunces 600, 52px/56px. **Body-lg** = Inter 400, 18px/29px.
Section eyebrows are Text/label (Inter 600 12px/16px, 0.96px tracking, uppercase) in **--primary** unless noted.
All sections: horizontal padding 120px. Content stays within the 1280px design width.

## 1. Navigation (white background, padding 20px 120px, gap 24px)
- Left, filling the width, 60px tall, 1px bottom border #c9c9c5, space-between: product name (Fraunces 600 20px/26px, --foreground) | links "How it works", "Example guide", "Our approach" (Inter 14px/21px, --foreground, ~24px apart). Links scroll to sections 4, 5 and 6.
- Right: primary button "Start" (48px).

## 2. Hero (padding 80px 120px, two equal columns, gap 40px, vertically centered)
Left column (gap 24px):
- Eyebrow: "FOR CAREER CHANGERS TRAINED IN UX, NOT YET HIRED"
- Display heading: "Your past work already counts. Build a guide to your UX skills."
- Body-lg, --ink-soft: "Tell us about real work from your previous field. We’ll show how it connects to UX, with the reasoning, and you keep only what’s accurate."
- Notice box: --secondary, radius 12px, padding 12px, gap 8px. "We don’t save your work" (Inter 600 16px/26px, --foreground); "Copy or download your guide for your own records before closing or refreshing this page." (14px/21px, --ink-soft)
- Buttons, gap 12px: primary "Start", outline "See an example" (scrolls to section 5)
- "No cost. Just your story." (14px/21px, --muted-foreground)

Right column: outer panel --secondary, radius 20px, padding 24px, gap 20px.
- Inner white card: 1px --border, radius 20px, padding 24px, gap 20px:
  - Row of two labels (--muted-foreground): "EXAMPLE GUIDE" (left, fills) | "01 / RETAIL"
  - h1 (Fraunces 36px/42px): "Redesigning how new staff learn the register"
  - "Retail supervisor → UX evidence" (14px/21px, --muted-foreground)
  - Two rows, each gap 12px, vertically centered: a box (--proof-ground, radius 12px, padding 12px, 14px/21px --foreground) filling the width + a skill chip on the right. Row 1: "Asked new staff where they got stuck" + chip "User research". Row 2: "Rewrote training as a checklist" + chip "Content design".
  - Green box: --accent, radius 12px, padding 20px, gap 8px, text --accent-foreground. Label "THE CONNECTION, NOT JUST THE LABEL." then "You learned where people struggled, then made the instructions easier to use." (14px/21px)
- Under the card, label in --muted-foreground: "YOUR EXPERIENCE. VISIBLE CONNECTIONS. NOTHING INVENTED."

## 3. Promises strip (--secondary background, padding 40px 120px, three equal columns, gap 40px)
Each: h2 (Fraunces 20px/26px) + 8px gap + 14px/21px --muted-foreground.
- Left-aligned: "At your own pace" / "Short tasks. Room to think."
- Center-aligned: "0 invented details" / "Every line starts with your real work."
- Right-aligned: "You stay in control" / "Keep only the connections that fit."

## 4. How it works (padding 80px 120px, gap 40px)
- Intro (gap 12px): eyebrow "HOW IT WORKS"; h1 "From “I used to…” to “Here’s the evidence.”"; body-lg --muted-foreground "No blank-page portfolio. Start with something you actually did."
- Three equal white cards, gap 20px, each 289px tall, 1px --border, radius 20px, padding 24px, gap 24px. Inside: number (Fraunces 36px/42px, --primary), h2 title, body (16px/26px, --ink-soft, grows to fill), footnote (14px/21px, --muted-foreground):
  - "01" · "Start with real work" · "Describe a task, problem, or change from your previous role. Everyday examples count." · "A better handover. A clearer checklist."
  - "02" · "See the connections" · "Review how your actions connect to UX skills, with a plain-language explanation for each suggestion." · "Keep what fits. Question what doesn’t."
  - "03" · "Build your guide" · "Choose the connections that fit your experience, then copy or download a guide you can build on." · "Your words. Your work. Your call."

## 5. Example guide (--secondary background, padding 80px 120px; two equal columns, gap 40px, vertically centered)
Left (gap 24px):
- Eyebrow "AN EXAMPLE GUIDE"
- h1 on two lines: "Not a new story." / "A new way to see yours."
- Body-lg --ink-soft: "You don’t need to pretend your last job was a UX role. Make the relevant work visible, and be clear about what it does—and doesn’t—show."
- Group (gap 12px): label "THE EXPERIENCE" (--muted-foreground); h2 "“New staff kept asking the same questions at the register. I asked what was confusing and rewrote our training as a checklist.”"; "Illustrative example · Retail supervisor" (14px/21px --muted-foreground)

Right: white card, 1px --border, radius 20px, padding 24px, gap 24px:
- h2 "What that work can show"
- Item (gap 12px): chip "User research"; "You asked before you changed." (16px/26px --foreground); "Speaking with new staff helped you understand where they struggled. That is the connection to user research." (14px/21px --muted-foreground)
- Item: chip "Content design"; "You made information easier to use."; "Turning training into a checklist made the instructions clearer and easier to follow. That is the connection to content design."
- Box: --proof-ground, radius 12px, padding 20px, gap 8px. Label in --foreground "A CONNECTION IS NOT A CLAIM OF MASTERY."; "This example doesn’t invent research methods, project results, or a UX job title." (14px/21px --ink-soft)

## 6. Our approach (padding 80px 120px, gap 40px)
Two equal columns, gap 40px:
- Left (gap 20px): eyebrow "OUR APPROACH"; h1 on two lines "More confidence." / "Less make-believe."; body-lg --ink-soft "See the value of your experience without stretching the truth."
- Right (gap 24px): three rows, each a number label in --primary ("01", "02", "03") + 20px gap + a column (gap 8px) with h2 and body (16px/26px --muted-foreground):
  - "Real experience is the starting point." / "Not a fictional client or an invented project. You bring the work; we help you make sense of it."
  - "The reasoning stays visible." / "See why a UX skill is suggested, rather than accepting a label without context."
  - "Your judgement comes first." / "You decide what feels accurate. A suggestion isn’t something you have to claim."
Below: "Honest limits" box: --secondary, radius 12px, padding 24px, gap 24px, in one row: h2 "Honest limits" | "Strong proof improves your odds of being noticed. It can’t create jobs or guarantee that employers respond." (14px/21px --ink-soft)

## 7. Questions (white background, padding 80px 120px; columns: 320px left, rest right, gap 40px)
- Left (gap 20px): eyebrow "A FEW GOOD QUESTIONS"; h1 on two lines "Before you" / "get started."
- Right (gap 24px): four items, each gap 12px: question h2, answer (16px/26px --muted-foreground), then a 1px divider in --border.
  - "Is this for me if I’ve never had a UX job?" — "This is for career changers trained in UX who are not yet hired. Start with real work from your previous field, not a UX job title."
  - "What if my experience feels too ordinary?" — "Start small. Explaining a process, improving instructions, or asking people where they get stuck can be worth examining. Keep only the connections that are accurate."
  - "Will it invent details to fill the gaps?" — "No. Every line comes from what you tell us. Missing evidence stays missing; it doesn’t become a made-up outcome."
  - "How much does it cost?" — "Nothing—it’s completely free. Work through short tasks at your own pace."

## 8. Start invitation (padding 80px 120px)
Terracotta box: --primary background, radius 20px, padding 40px, gap 40px, vertically centered, white text.
- Left (fills, gap 20px): label "YOU’RE NOT STARTING FROM NOTHING."; h1 on two lines "Start with something" / "you’ve already done."; body 16px/26px "Your next step is one real story from your past work."
- Right (centered column, gap 12px): outline button "Start" (white background, 2px --input border, --foreground text); "Free. No autosave." (14px/21px white); "Copy or download before leaving." (14px/21px white)

## 9. Footer (--secondary background, padding 40px 120px, gap 24px)
- Row: product name (Fraunces 20px/26px, fills) | "Real experience. Nothing invented." (14px/21px --muted-foreground)
- "Skill names come from Tech Fleet’s Skills & Practices Framework (CC BY 4.0)." (14px/21px --muted-foreground)

All "Start" buttons go to Step 1. Below ~960px wide, columns stack into one.
