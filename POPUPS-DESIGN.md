# Pop-ups — exact spec from Figma ("State · …" frames)

Use STYLE-GUIDE.md tokens and components. Use the copy word for word.

## Shared pop-up box
- Centered on screen, 560px wide (max 100% minus 32px on small screens), over a dim backdrop rgba(35,32,28,0.4).
- White, 1px solid --border, radius 20px, padding 24px, vertical gap 24px between all items.
- Order: label (Inter 600 12px/16px, 0.96px tracking, uppercase, --foreground) → heading (Fraunces 600 20px/26px, --foreground) → message (Inter 400 16px/26px, --foreground) → button row (gap 12px, left-aligned, default 48px buttons).
- Accessible dialog: role="dialog", aria-modal, focus moves into it, Escape = the safe/cancel action, focus returns afterwards.

## 1. Before you begin
When: a visitor clicks any Start button on Home.
- Label: YOUR WORK, YOUR CHOICE
- Heading: Before you begin
- Message: There is no autosave in this version. Keep this tab open, and copy or download your guide before you close or refresh.
- Buttons: outline "Not now" (closes) · primary "Start experience" (goes to Step 1)

## 2. Leave this session?
When: "Leave session" on Step 4 (replace the browser confirm), and the header Home button when the user has entered anything.
- Label: YOUR WORK, YOUR CHOICE
- Heading: Leave this session?
- Message: Your experience and guide are not saved. If you haven’t copied or downloaded your guide, leaving will lose your work.
- Buttons: primary "Stay here" (closes) · outline "Leave anyway" (clears data, goes Home)

## 3. Finding UX connections…
When: after "See suggestions", while waiting for results.
- Label: PLEASE WAIT
- Heading: Finding UX connections…
- Message: I’m checking your experience for possible UX connections. Your words stay on the previous screen.
- Buttons: outline "Cancel" (stops the request, stays on Step 1 with answers kept)

## 4. Add a little more detail
When: the answers are too short to work with (use the app's existing "too short" check).
- Label: YOUR WORK, YOUR CHOICE
- Heading: Add a little more detail
- Message: Describe the situation and at least one specific action you took. For example: “I asked new staff where they got stuck.” Your experience has not been cleared.
- Buttons: primary "Back to experience"

## 5. No connections found yet
When: the engine returns zero suggestions.
- Label: YOUR WORK, YOUR CHOICE
- Heading: No connections found yet
- Message: There isn’t enough specific evidence to suggest a connection confidently. Add what you did, who it helped, and what changed. Nothing will be invented.
- Buttons: primary "Edit experience" (back to Step 1, answers kept) · outline "Return home"

## 6. We couldn’t find connections right now
When: processing fails completely (both AI and rule-based).
- Label: YOUR WORK, YOUR CHOICE
- Heading: We couldn’t find connections right now
- Message: Something interrupted processing. Your experience is still on the previous screen. Try again, or return to edit it.
- Buttons: primary "Try again" · outline "Back to experience"

## 7. Your guide couldn’t be downloaded
When: the download throws an error.
- Label: YOUR WORK, YOUR CHOICE
- Heading: Your guide couldn’t be downloaded
- Message: The download didn’t finish. Your guide is still available in this session. Retry, or go back and copy it instead.
- Buttons: primary "Try again" · outline "Back to guide" (closes, stays on Step 4)

## 8. Add a connection first
When: "View your proof guide" is clicked with nothing added (replace the current inline message).
- Label: YOUR WORK, YOUR CHOICE
- Heading: Add a connection first
- Message: Your guide only includes the connections you add. Add at least one, then preview your guide. Skipped and undecided connections are left out.
- Buttons: primary "Keep reviewing"

## 9. Edit this connection
When: "Edit first" on a suggestion (replace the current inline editor with this pop-up). No label line.
- Heading: Edit this connection
- Line (Inter 14px/21px, --foreground): From your experience: “[the original quote]”
- Message: Keep the wording accurate. Your original experience will not be changed.
- Box: --secondary background, radius 12px, padding 12px, gap 8px. Label "SUGGESTED EDIT" (Inter 600 12px, uppercase), then an editable text field (Inter 16px/26px) prefilled with the current wording. Keep the field visually inside the box (no heavy border; a subtle focus outline is fine).
- Buttons: outline "Cancel" · primary "Save to guide" (saves the wording AND adds the connection to the guide)

## 10. About this connection
When: the "About this connection" link on a suggestion (replace the inline panel). No label line.
- Heading: About this connection
- Message (16px/26px): the "why we suggested this" reasoning for that suggestion
- Line (14px/21px): Skill source: Tech Fleet Skills & Practices Framework · CC BY 4.0. This explanation describes the connection; it is not a claim of mastery.
- Buttons: primary "Done"
