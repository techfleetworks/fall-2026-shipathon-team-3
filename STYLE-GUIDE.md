# Proof — Style Guide (EXACT values from the Figma hi-fi file)

All values below were read directly from the Figma file (frame "Hi-fi · 2. Review suggestions"), not estimated. Use them exactly. Do not substitute other fonts, colors, radii or sizes.

## Design tokens (put these in :root)
```css
:root {
  --background: #fbf6ee;        /* page background */
  --card: #ffffff;              /* cards, header, panels */
  --border: #e8dfd2;            /* card/panel/header borders */
  --input: #d8cdbf;             /* outline button border */
  --foreground: #23201c;        /* main text, current-step pill */
  --ink-soft: #4a443d;          /* body copy, quotes */
  --muted-foreground: #6a6259;  /* labels, eyebrow text, ghost buttons, badge text */
  --primary: #b44a26;           /* terracotta: primary buttons, links, logo tile */
  --primary-foreground: #ffffff;
  --secondary: #f6efe5;         /* "Why we suggested this" box, badges, table header, future-step pills */
  --accent: #ddefe4;            /* skill chip, info note, done-step pill */
  --accent-foreground: #1f5a3e; /* text on accent */
  --success: #2f7a55;           /* skill chip border, "Step X of 4", "Your choices" */
  --radius-md: 12px;
  --radius-xl: 20px;
  --radius-full: 999px;
}
```

## Fonts (load from Google Fonts)
- **Fraunces** SemiBold (600), with `font-variation-settings: "SOFT" 0, "WONK" 1;` Load Fraunces with its SOFT and WONK axes, e.g.
  `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,600,0,1&display=swap`
- **Inter** Regular 400, Medium 500, Semi Bold 600, Bold 700.

## Text styles
| Name | Font | Size / line-height | Use |
|---|---|---|---|
| Display/h1 | Fraunces 600 | 36px / 42px | Page titles |
| Display/h2 | Fraunces 600 | 20px / 26px | Card titles, panel titles, logo "P" and product name |
| Text/body | Inter 400 | 16px / 26px, color --ink-soft | Page intro text |
| Text/body-sm | Inter 400 | 14px / 21px | Card text, quotes, notes |
| Text/label | Inter 600 | 12px / 16px, letter-spacing 0.96px, UPPERCASE, color --muted-foreground | Eyebrows ("STEP 2 · REVIEW SUGGESTIONS"), "FROM YOUR EXPERIENCE", "CONNECTS TO", table headers |

## Components

**Button** (Figma note: "Primary = terra (one per area). Outline = secondary actions. Ghost = quiet actions. Default 48px, Small 40px (card actions).")
- All: Inter 600, radius 12px, no shadow.
- Default size: height 48px, padding 0 24px, font 15px.
- Small size (inside cards): height 40px, padding 0 16px, font 14px.
- Primary: background --primary, text white.
- Outline: background white, 2px solid --input, text --foreground.
- Ghost: no background or border, text --muted-foreground.

**Status badge**: pill, padding 5px 12px, radius 999px, Inter 700 12px. Default: background --secondary, text --muted-foreground. Always has text, never color only.

**Skill chip**: background --accent, 1px solid --success, radius 12px, padding 8px 12px, text --accent-foreground, Inter 700. Two lines with 2px gap: "UX SKILL" at 10px with 0.8px letter-spacing, then the skill name at 14px.

**Link** ("About this connection" / "About this skill"): Inter 400 14px/21px, color --primary, no underline.

**Info box** ("Why we suggested this"): background --secondary, radius 12px, padding 14px 16px, gap 4px, Inter 14px/21px. Title in --foreground, body in --ink-soft.

**Info note** ("Only added connections are included"): background --accent, radius 12px, padding 14px 16px, text --accent-foreground 14px/21px; title Inter 600, body Inter 500.

## Shared header (every step screen)
1. **Top bar**: white, 1px bottom border --border, padding 18px 40px, space-between.
   - Left (gap 12px): 34×34 logo tile (background --primary, radius 12px) with "P" in Fraunces 600 20px white; then product name in Fraunces 600 20px --foreground.
   - Right (gap 12px): "Home" ghost button (40px, Inter 600 14px, --muted-foreground) and "Nothing invented" Inter 400 14px --muted-foreground.
2. **Progress bar**: white, 1px bottom border --border, padding 24px 64px, space-between.
   - Left: four status badges, gap 8px: "✓ Add experience", "2. Review suggestions", "3. View your proof guide", "4. Copy & download".
     - Done: background --accent, text --accent-foreground.
     - Current: background --foreground, text white.
     - Future: background --secondary, text --muted-foreground.
   - Right: "Step X of 4", Inter 400 14px, color --success.

## Step 2 · Review suggestions layout
- Content: padding 56px 64px 64px, vertical gap 24px.
- Heading block (gap 8px): label eyebrow, h1 title, body intro.
- Two columns, gap 24px: suggestion cards (flexible width, gap 16px) | right column 400px wide (gap 16px).
- **Suggestion card**: white, radius 20px, padding 22px, gap 14px.
  - Added card: 2px solid --border. Not-yet-added card: 1px solid #000000 (as in the design).
  - Row 1: h2 title left, status badge right ("Added to guide" / "Not added yet").
  - Row 2 (two equal columns, gap 16px, each column gap 6px): "FROM YOUR EXPERIENCE" label + quote (body-sm, --ink-soft) | "CONNECTS TO" label + skill chip + link.
  - Row 3: "Why we suggested this" info box.
  - Row 4 (gap 8px, small buttons): when added → Primary "Remove from guide"; when not added → Outline "Add to guide". Then Outline "Edit first", then Ghost "Skip".
- Under the cards: attribution line, body-sm, --muted-foreground.
- **Right column**:
  - "Included in your guide" panel: white, 1px --border, radius 20px, padding 22px, gap 14px. Header row: h2 title + "Your choices" (14px, --success). Table: 1px --border, radius 12px; header row background --secondary with two label cells (padding 10px 14px) "WHAT I DID" | "WHAT IT SHOWS"; body rows white with 1px top border, cells padding 10px 14px, 14px/21px; left cell --foreground, right cell --accent-foreground.
  - Info note below it.
- **Bottom bar**: white, 1px --border, radius 20px, padding 22px, space-between. Left: "Ready to preview your guide?" Inter 16px/26px. Right (gap 12px, default-size buttons): Outline "Back to experience", Primary "View your proof guide".

## Other screens
Use exactly the same tokens, fonts, text styles, components and shared header on Home, Step 1, Step 3 and Step 4. Layouts for those screens are described in BUILD-BRIEF.md.
