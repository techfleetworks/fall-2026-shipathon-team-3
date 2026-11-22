// Proofwork: front end. No framework, no build step.
// State lives in memory only (MVP #1 has no accounts or saving).

const QUESTIONS = [
  { label: "What was your role then?", placeholder: "Example: Retail store manager" },
  { label: "What was the situation or problem?", placeholder: "Example: New staff kept making mistakes at the register in their first weeks.", height: 80 },
  { label: "What did you do, step by step?", placeholder: "Example: Asked new staff where they got stuck, rewrote the training into a one-page checklist, and changed it after watching the first week.", height: 104 },
  { label: "What changed because of it?", placeholder: "Example: Fewer people asked me for help at the register after the first week.", height: 72 },
];

const FORMAT_LABELS = {
  case_study: "Could become a short case study",
  before_after_redesign: "Could become a before-and-after redesign",
};

const state = {
  answers: ["", "", "", ""], // role, situation, what I did, what changed
  result: null,
  decisions: {},      // candidate id -> "added" | "skipped" (absent = undecided)
  edits: {},          // candidate id -> edited explanation
  gapAnswers: {},     // question text -> answer
};

const screenEl = document.getElementById("screen");
const progressEl = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const progressSteps = document.getElementById("progress-steps");
// Home asks first once the person has entered anything.
document.getElementById("home-btn").addEventListener("click", () => { if (hasEnteredAnything()) openLeaveModal(); else renderWelcome(); });
const mainEl = document.getElementById("main");
const topEl = document.querySelector(".top");
const footEl = document.querySelector(".foot");

// ---------- tiny DOM helper (always uses textContent, never innerHTML) ----------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function show(nodes, step, layout = "", { noTop = false } = {}) {
  mainEl.className = layout === true ? "wide" : layout;
  topEl.hidden = noTop;   // Step 4 has only the progress bar
  footEl.hidden = noTop;  // and its own footer line
  screenEl.replaceChildren(...[nodes].flat());
  if (step) {
    progressEl.hidden = false;
    const names = ["Add experience", "Review suggestions", "View your proof guide", "Copy & download"];
    progressLabel.textContent = `Step ${step} of 4`;
    progressSteps.replaceChildren(...names.map((name, i) => {
      const n = i + 1;
      const state = n < step ? "done" : n === step ? "current" : "";
      return h("li", { class: state, "aria-current": n === step ? "step" : null }, n < step ? `✓ ${name}` : `${n}. ${name}`);
    }));
  } else {
    progressEl.hidden = true;
  }
  window.scrollTo({ top: 0 });
  const heading = screenEl.querySelector("h1, h2");
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  else mainEl.focus({ preventScroll: true });
}

// ---------- Pop-ups: one shared component (POPUPS-DESIGN.md) ----------
// openModal({ label, heading, content, buttons, returnTo, initialFocus }) shows one dialog at a time.
// Each button is { text, primary, escape, onclick }: clicking closes the dialog, then runs onclick.
// Escape clicks the button marked `escape` (the safe action), or just closes if none is marked.
const modalMsg = (text) => h("p", { class: "modal-msg" }, text);
const modalLine = (text) => h("p", { class: "modal-line" }, text);
const MODAL_LABEL = "Your work, your choice";
let activeModal = null;

function openModal({ label, heading, content = [], buttons = [], returnTo, initialFocus }) {
  // Replacing a dialog (for example loading -> failed) keeps the original place to return focus to.
  if (activeModal) { returnTo ??= activeModal.returnTo; activeModal.dispose(); }
  returnTo ??= document.activeElement;

  const btnEls = buttons.map((b) => h("button", {
    type: "button",
    class: b.primary ? "primary" : null,
    onclick: () => { close(); b.onclick?.(); },
  }, b.text));
  const box = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", tabindex: "-1" },
    label ? h("p", { class: "modal-label" }, label) : null,
    h("h2", { id: "modal-title" }, heading),
    ...content,
    h("div", { class: "modal-buttons" }, btnEls));
  const backdrop = h("div", { class: "modal-backdrop" }, box);

  // Everything behind the dialog is inert (no focus, no clicks, hidden from screen readers).
  const behind = [topEl, progressEl, mainEl, footEl];
  behind.forEach((el) => { el.inert = true; });

  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      const i = buttons.findIndex((b) => b.escape);
      if (i >= 0) btnEls[i].click(); else close();
    } else if (e.key === "Tab") {
      const items = [...box.querySelectorAll("button, textarea, input, a[href]")].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", onKey, true);

  const dispose = () => {
    document.removeEventListener("keydown", onKey, true);
    behind.forEach((el) => { el.inert = false; });
    backdrop.remove();
    if (activeModal === modal) activeModal = null;
  };
  const close = () => {
    dispose();
    if (returnTo?.isConnected && !returnTo.disabled) returnTo.focus({ preventScroll: true });
  };
  const modal = { close, dispose, returnTo };
  activeModal = modal;

  document.body.append(backdrop);
  (initialFocus || btnEls[0] || box).focus();
  return modal;
}

const hasEnteredAnything = () => state.answers.some((a) => a.trim());

// Moves back to the experience form without losing what was typed. Already on it? Just focus the main field.
function backToExperience() {
  const field = document.getElementById("q3");
  if (field) field.focus(); else renderDescribe();
}

// 1. Before you begin: every Start button on Home.
function openBeginModal() {
  openModal({
    label: MODAL_LABEL,
    heading: "Before you begin",
    content: [modalMsg("There is no autosave in this version. Keep this tab open, and copy or download your guide before you close or refresh.")],
    buttons: [
      { text: "Not now", escape: true },
      { text: "Start experience", primary: true, onclick: () => renderDescribe() },
    ],
  });
}

// 2. Leave this session?: Leave session on Step 4 and Home in the header (once something is entered) go home;
// "Create another proof" on Step 4 goes to a fresh Step 1. Either way "Leave anyway" clears everything first.
function openLeaveModal(goTo = () => renderWelcome()) {
  openModal({
    label: MODAL_LABEL,
    heading: "Leave this session?",
    content: [modalMsg("Your experience and guide are not saved. If you haven’t copied or downloaded your guide, leaving will lose your work.")],
    buttons: [
      { text: "Stay here", primary: true, escape: true },
      { text: "Leave anyway", onclick: () => { resetAll(); goTo(); } },
    ],
  });
}

// 6. We couldn’t find connections right now: processing failed.
function openFailedModal(retry) {
  openModal({
    label: MODAL_LABEL,
    heading: "We couldn’t find connections right now",
    content: [modalMsg("Something interrupted processing. Your experience is still on the previous screen. Try again, or return to edit it.")],
    buttons: [
      { text: "Try again", primary: true, onclick: retry },
      { text: "Back to experience", escape: true, onclick: backToExperience },
    ],
  });
}

// 7. Your guide couldn’t be downloaded: printing the preview threw. "Back to guide" returns to Step 4.
function openDownloadFailedModal(retry, back) {
  openModal({
    label: MODAL_LABEL,
    heading: "Your guide couldn’t be downloaded",
    content: [modalMsg("The download didn’t finish. Your guide is still available in this session. Retry, or go back and copy it instead.")],
    buttons: [
      { text: "Try again", primary: true, onclick: retry },
      { text: "Back to guide", escape: true, onclick: back },
    ],
  });
}

// 9. Edit this connection: saves the wording AND adds the connection to the guide.
function openEditModal(c, onSave) {
  const area = h("textarea", { id: "edit-field", class: "modal-field" });
  area.value = explanationOf(c);
  openModal({
    heading: "Edit this connection",
    content: [
      modalLine(`From your experience: “${c.quote}”`),
      modalMsg("Keep the wording accurate. Your original experience will not be changed."),
      h("div", { class: "modal-box" }, h("label", { class: "label", for: "edit-field" }, "Suggested edit"), area),
    ],
    buttons: [
      { text: "Cancel", escape: true },
      { text: "Save to guide", primary: true, onclick: () => onSave(area.value.trim() || c.why_it_matters) },
    ],
    initialFocus: area,
  });
}

// 10. About this connection.
function openAboutModal(c) {
  openModal({
    heading: "About this connection",
    content: [
      modalMsg(explanationOf(c)),
      modalLine("Skill source: Tech Fleet Skills & Practices Framework · CC BY 4.0. This explanation describes the connection; it is not a claim of mastery."),
    ],
    buttons: [{ text: "Done", primary: true, escape: true }],
  });
}

// ---------- Home ----------
const PRODUCT_NAME = "Proofwork";

function renderWelcome() {
  const start = (cls = "primary") => h("button", { class: cls, type: "button", onclick: () => openBeginModal() }, "Start");
  const chip = (name) => h("p", { class: "chip" }, h("span", { class: "chip-kicker" }, "UX skill"), h("span", { class: "chip-name" }, name));
  const eyebrow = (text) => h("p", { class: "label home-eyebrow" }, text);
  const section = (cls, id, ...kids) => h("section", { class: `home-section ${cls}`, id }, h("div", { class: "home-inner" }, ...kids));

  const nav = h("header", { class: "home-nav" },
    h("div", { class: "home-nav-inner" },
      h("div", { class: "home-nav-left" },
        h("img", { class: "logo", src: "/logo.svg", alt: PRODUCT_NAME, height: "34" }),
        h("nav", { class: "home-links", "aria-label": "Sections" },
          h("a", { href: "#how-it-works" }, "How it works"),
          h("a", { href: "#example-guide" }, "Example guide"),
          h("a", { href: "#our-approach" }, "Our approach"))),
      start()));

  const hero = section("hero", "home-top",
    h("div", { class: "hero-copy" },
      eyebrow("For career changers trained in UX, not yet hired"),
      h("h1", { class: "display" }, "Your past work already counts. Build a guide to your UX skills."),
      h("p", { class: "body-lg" }, "Tell us about real work from your previous field. We’ll show how it connects to UX, with the reasoning, and you keep only what’s accurate."),
      h("div", { class: "notice-box" },
        h("p", { class: "notice-title" }, "We don’t save your work"),
        h("p", {}, "Copy or download your guide for your own records before closing or refreshing this page.")),
      h("div", { class: "home-buttons" }, start(), h("a", { class: "btn", href: "#example-guide" }, "See an example")),
      h("p", { class: "small hero-note" }, "No cost. Just your story.")),
    h("div", { class: "hero-visual" },
      h("div", { class: "hero-panel" },
        h("div", { class: "hero-card" },
          h("div", { class: "hero-card-labels" }, h("p", { class: "label" }, "Example guide"), h("p", { class: "label" }, "01 / Retail")),
          h("h2", { class: "t-h1" }, "Redesigning how new staff learn the register"),
          h("p", { class: "small" }, "Retail supervisor → UX evidence"),
          h("div", { class: "ex-row" }, h("p", { class: "ex-box" }, "Asked new staff where they got stuck"), chip("User research")),
          h("div", { class: "ex-row" }, h("p", { class: "ex-box" }, "Rewrote training as a checklist"), chip("Content design")),
          h("div", { class: "green-box" },
            h("p", { class: "label" }, "The connection, not just the label."),
            h("p", {}, "You learned where people struggled, then made the instructions easier to use."))),
        h("p", { class: "label hero-tagline" }, "Your experience. Visible connections. Nothing invented."))));

  const promise = (align, title, text) => h("div", { class: `promise ${align}` }, h("h2", { class: "t-h2" }, title), h("p", {}, text));
  const promises = h("section", { class: "home-section promises" }, h("div", { class: "home-inner" },
    promise("left", "At your own pace", "Short tasks. Room to think."),
    promise("center", "0 invented details", "Every line starts with your real work."),
    promise("right", "You stay in control", "Keep only the connections that fit.")));

  const step = (num, title, body, note) => h("li", { class: "step-card" },
    h("p", { class: "step-num" }, num), h("h3", { class: "t-h2" }, title), h("p", { class: "step-body" }, body), h("p", { class: "small" }, note));
  const how = section("how", "how-it-works",
    h("div", { class: "how-intro" },
      eyebrow("How it works"),
      h("h2", { class: "t-h1" }, "From “I used to…” to “Here’s the evidence.”"),
      h("p", { class: "body-lg muted" }, "No blank-page portfolio. Start with something you actually did.")),
    h("ol", { class: "steps-grid" },
      step("01", "Start with real work", "Describe a task, problem, or change from your previous role. Everyday examples count.", "A better handover. A clearer checklist."),
      step("02", "See the connections", "Review how your actions connect to UX skills, with a plain-language explanation for each suggestion.", "Keep what fits. Question what doesn’t."),
      step("03", "Build your guide", "Choose the connections that fit your experience, then copy or download a guide you can build on.", "Your words. Your work. Your call.")));

  const showItem = (name, line, text) => h("div", { class: "show-item" }, chip(name), h("p", { class: "show-line" }, line), h("p", { class: "small" }, text));
  const example = section("example", "example-guide",
    h("div", { class: "example-copy" },
      eyebrow("An example guide"),
      h("h2", { class: "t-h1" }, "Not a new story.", h("br"), "A new way to see yours."),
      h("p", { class: "body-lg" }, "You don’t need to pretend your last job was a UX role. Make the relevant work visible, and be clear about what it does—and doesn’t—show."),
      h("div", { class: "experience-group" },
        h("p", { class: "label" }, "The experience"),
        h("h3", { class: "t-h2" }, "“New staff kept asking the same questions at the register. I asked what was confusing and rewrote our training as a checklist.”"),
        h("p", { class: "small" }, "Illustrative example · Retail supervisor"))),
    h("div", { class: "example-card" },
      h("h3", { class: "t-h2" }, "What that work can show"),
      showItem("User research", "You asked before you changed.", "Speaking with new staff helped you understand where they struggled. That is the connection to user research."),
      showItem("Content design", "You made information easier to use.", "Turning training into a checklist made the instructions clearer and easier to follow. That is the connection to content design."),
      h("div", { class: "ground-box" },
        h("p", { class: "label dark" }, "A connection is not a claim of mastery."),
        h("p", {}, "This example doesn’t invent research methods, project results, or a UX job title."))));

  const principle = (num, title, text) => h("li", { class: "principle" },
    h("p", { class: "label home-num" }, num), h("div", { class: "principle-text" }, h("h3", { class: "t-h2" }, title), h("p", {}, text)));
  const approach = section("approach", "our-approach",
    h("div", { class: "approach-cols" },
      h("div", { class: "approach-copy" },
        eyebrow("Our approach"),
        h("h2", { class: "t-h1" }, "More confidence.", h("br"), "Less make-believe."),
        h("p", { class: "body-lg" }, "See the value of your experience without stretching the truth.")),
      h("ol", { class: "principles" },
        principle("01", "Real experience is the starting point.", "Not a fictional client or an invented project. You bring the work; we help you make sense of it."),
        principle("02", "The reasoning stays visible.", "See why a UX skill is suggested, rather than accepting a label without context."),
        principle("03", "Your judgement comes first.", "You decide what feels accurate. A suggestion isn’t something you have to claim."))),
    h("div", { class: "limits-box" },
      h("h3", { class: "t-h2" }, "Honest limits"),
      h("p", {}, "Strong proof improves your odds of being noticed. It can’t create jobs or guarantee that employers respond.")));

  const faq = (q, a) => h("div", { class: "faq-item" }, h("h3", { class: "t-h2" }, q), h("p", {}, a));
  const questions = section("questions", "questions",
    h("div", { class: "faq-head" },
      eyebrow("A few good questions"),
      h("h2", { class: "t-h1" }, "Before you", h("br"), "get started.")),
    h("div", { class: "faq-list" },
      faq("Is this for me if I’ve never had a UX job?", "This is for career changers trained in UX who are not yet hired. Start with real work from your previous field, not a UX job title."),
      faq("What if my experience feels too ordinary?", "Start small. Explaining a process, improving instructions, or asking people where they get stuck can be worth examining. Keep only the connections that are accurate."),
      faq("Will it invent details to fill the gaps?", "No. Every line comes from what you tell us. Missing evidence stays missing; it doesn’t become a made-up outcome."),
      faq("How much does it cost?", "Nothing—it’s completely free. Work through short tasks at your own pace.")));

  const invite = h("section", { class: "home-section invite" }, h("div", { class: "home-inner" },
    h("div", { class: "invite-box" },
      h("div", { class: "invite-copy" },
        h("p", { class: "label" }, "You’re not starting from nothing."),
        h("h2", { class: "t-h1" }, "Start with something", h("br"), "you’ve already done."),
        h("p", {}, "Your next step is one real story from your past work.")),
      h("div", { class: "invite-action" },
        start("on-dark"),
        h("p", {}, "Free. No autosave."),
        h("p", {}, "Copy or download before leaving.")))));

  const footer = h("footer", { class: "home-footer" }, h("div", { class: "home-inner" },
    h("div", { class: "home-footer-row" }, h("span", { class: "home-brand" }, PRODUCT_NAME), h("p", { class: "small" }, "Real experience. Nothing invented.")),
    h("p", { class: "small" }, "Skill names come from Tech Fleet’s Skills & Practices Framework (CC BY 4.0).")));

  show([nav, hero, promises, how, example, approach, questions, invite, footer], null, "home", { noTop: true });
}

// ---------- Step 1: Describe ----------
function renderDescribe(errorText) {
  const inputs = [];
  const fields = QUESTIONS.map((q, i) => {
    const id = `q${i + 1}`;
    const input = q.height
      ? h("textarea", { id, name: id, maxlength: "2000", required: true, "aria-required": "true", placeholder: q.placeholder, style: `height:${q.height}px` })
      : h("input", { type: "text", id, name: id, maxlength: "200", required: true, "aria-required": "true", placeholder: q.placeholder });
    input.value = state.answers[i];
    input.addEventListener("input", () => { state.answers[i] = input.value; input.removeAttribute("aria-invalid"); });
    inputs.push(input);
    return h("div", { class: "field" }, h("label", { for: id }, q.label), input);
  });

  const submit = h("button", { class: "primary", type: "submit" }, "See suggestions");
  const status = h("p", { class: "error", role: "alert" }, errorText || "");

  const form = h("form", { class: "form-stack", novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      // Basic validation only: every field is required. Nothing after this step blocks the person.
      const empty = inputs.filter((input, i) => !state.answers[i].trim());
      inputs.forEach((input, i) => { if (!state.answers[i].trim()) input.setAttribute("aria-invalid", "true"); });
      if (empty.length) {
        status.textContent = "Please fill in every field to continue.";
        empty[0].focus();
        return;
      }
      status.textContent = "";
      await fetchProof();
    } },
    h("div", { class: "form-panel" }, ...fields),
    status,
    h("div", { class: "button-row" },
      h("button", { type: "button", onclick: () => renderWelcome() }, "Back to home"),
      submit));

  show(h("div", { class: "form-layout" },
    h("div", { class: "form-main" },
      h("div", { class: "form-head" },
        h("p", { class: "eyebrow" }, "Step 1"),
        h("h1", {}, "Tell us about one piece of work from your past field"),
        h("p", { class: "intro" }, "Describe what you did, not your job title. Messy notes are fine. We only use what you write.")),
      h("div", { class: "warn-box" },
        h("p", { class: "warn-title" }, "Your experience is not saved automatically"),
        h("p", {}, "Keep this tab open. Closing or refreshing will lose your work. You can copy or download your guide at the end.")),
      form),
    h("aside", { class: "form-side" },
      h("div", { class: "side-box" },
        h("p", { class: "side-title" }, "Your experience"),
        h("p", {}, "Your own words, before any connections are suggested.")),
      h("div", { class: "side-card" },
        h("p", { class: "side-title" }, "Good starting points"),
        h("p", {}, "A process you improved, a tool you helped people adopt, or a problem you solved for customers or coworkers.")))),
    1, "wide form");
}

async function fetchProof() {
  const controller = new AbortController();
  // 3. Finding UX connections…: Cancel stops the request and leaves the person where they were, answers kept.
  const loading = openModal({
    label: "Please wait",
    heading: "Finding UX connections…",
    content: [modalMsg("I’m checking your experience for possible UX connections. Your words stay on the previous screen.")],
    buttons: [{ text: "Cancel", escape: true, onclick: () => controller.abort() }],
  });
  try {
    const res = await fetch("/api/proof-candidates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: state.answers }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    if (controller.signal.aborted) return;
    loading.close();
    // Never block progress: even with no suggestions the person goes on to Step 2, which explains and lets them continue.
    state.result = data;
    state.decisions = {};
    state.edits = {};
    state.gapAnswers = {};
    renderProof();
  } catch (err) {
    if (controller.signal.aborted) return; // cancelled on purpose
    openFailedModal(() => fetchProof()); // replaces the loading pop-up
  }
}

// ---------- Step 2: Review suggestions ----------
const STATUS_LABELS = { undecided: "Not added yet", added: "Added to guide", skipped: "Skipped" };
const statusOf = (c) => state.decisions[c.id] || "undecided";
const explanationOf = (c) => state.edits[c.id] ?? c.why_it_matters;
const addedCandidates = () => (state.result?.candidates || []).filter((c) => state.decisions[c.id] === "added");

let refreshProof = () => {};

function renderProof() {
  const r = state.result;
  const list = h("ul", { class: "candidates" });
  const panel = h("div", { class: "guide-panel" });

  // Re-render the cards and the side panel in place (no scroll jump), then restore focus.
  refreshProof = (focusId) => {
    list.replaceChildren(...r.candidates.map(renderCandidate));
    panel.replaceChildren(...renderIncludedPanel());
    const el = focusId && document.getElementById(focusId);
    if (el) el.focus();
  };
  refreshProof();

  const main = [
    h("div", { class: "review-head" },
      h("p", { class: "eyebrow" }, "Step 2 · Review suggestions"),
      h("h1", {}, "Choose the connections for your guide"),
      h("p", { class: "intro" }, "Add only what fits your experience. Edit first if needed, or skip. Every decision can be undone."),
      r.source === "ai" && r.candidates.length ? h("p", { class: "small" }, "Suggested by AI, using only your words. Check every line.") : null),
    r.note ? h("p", { class: "notice warn" }, r.note) : null,
    r.candidates.length ? list : h("div", { class: "empty-card" },
      h("p", {}, "Not enough specific evidence to suggest a connection. Try adding what you did, who it helped, and what changed."),
      h("div", { class: "actions" }, h("button", { onclick: () => renderDescribe() }, "Back to experience"))),
    r.candidates.length ? h("p", { class: "attribution" }, "Skill names: Tech Fleet Skills & Practices Framework, CC BY 4.0") : null,
  ];

  const side = [
    panel,
    h("div", { class: "info-note" },
      h("p", { class: "info-title" }, "Only added connections are included"),
      h("p", {}, "Undecided and skipped connections stay out of your guide. You can change your choices before leaving.")),
  ];

  const bottom = h("div", { class: "bottom-bar" },
    h("p", {}, "Ready to preview your guide?"),
    h("div", { class: "actions" },
      // With no suggestions the card above already has "Back to experience", so don't repeat it.
      r.candidates.length ? h("button", { onclick: () => renderDescribe() }, "Back to experience") : null,
      // Never blocked: the guide can be viewed with nothing added.
      h("button", { class: "primary", onclick: () => renderGuide() }, "View your proof guide")));

  show([
    h("div", { class: "review-layout" },
      h("div", { class: "review-main" }, main),
      h("div", { class: "review-side" }, side)),
    h("div", { class: "review-bottom" }, bottom),
  ], 2, true);
}

function renderIncludedPanel() {
  const added = addedCandidates();
  const nodes = [h("div", { class: "panel-head" }, h("h2", { id: "included-h" }, "Included in your guide"), h("span", {}, "Your choices"))];
  if (!added.length) {
    nodes.push(h("p", { class: "small" }, state.result?.candidates?.length
      ? "Nothing added yet. Choose “Add to guide” on a suggestion to include it here."
      : "No connections added yet."));
  } else {
    nodes.push(h("table", {},
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "What I did"), h("th", { scope: "col" }, "What it shows"))),
      h("tbody", {}, added.map((c) => h("tr", {},
        h("td", {}, `“${c.quote}”`),
        h("td", {}, c.ux_skill_label))))));
  }
  return nodes;
}

function renderCandidate(c) {
  const status = statusOf(c);
  const whyP = h("p", {}, explanationOf(c));
  const actions = h("div", { class: "card-actions" });

  const decide = (value) => { state.decisions[c.id] = value; refreshProof(`undo-${c.id}`); };
  const undo = () => { delete state.decisions[c.id]; refreshProof(`add-${c.id}`); };

  // "Edit first" opens the Edit pop-up. Saving keeps the wording and adds the connection to the guide.
  const editBtn = h("button", { class: "sm", id: `edit-${c.id}`, "aria-haspopup": "dialog", onclick: () => {
      openEditModal(c, (wording) => {
        state.edits[c.id] = wording;
        state.decisions[c.id] = "added";
        refreshProof(`undo-${c.id}`);
      });
    } }, "Edit first");
  const skipBtn = h("button", { class: "quiet sm", onclick: () => decide("skipped") }, "Skip");

  if (status === "undecided") {
    actions.append(h("button", { class: "sm", id: `add-${c.id}`, onclick: () => decide("added") }, "Add to guide"), editBtn, skipBtn);
  } else if (status === "added") {
    actions.append(h("button", { class: "primary sm", id: `undo-${c.id}`, onclick: undo }, "Remove from guide"), editBtn, skipBtn);
  } else {
    actions.append(h("button", { class: "sm", id: `undo-${c.id}`, onclick: undo }, "Undo"), editBtn);
  }

  const aboutLink = h("button", { class: "link", id: `about-${c.id}`, "aria-haspopup": "dialog",
    onclick: () => openAboutModal(c) }, "About this connection");

  return h("li", { class: `candidate ${status}` },
    h("div", { class: "card-head" },
      h("h2", {}, c.title || c.ux_skill_label),
      h("span", { class: `badge badge-${status}` }, STATUS_LABELS[status])),
    h("div", { class: "card-cols" },
      h("div", { class: "col" },
        h("p", { class: "label" }, "From your experience"),
        h("p", { class: "quote" }, `“${c.quote}”`)),
      h("div", { class: "col" },
        h("p", { class: "label" }, "Connects to"),
        h("p", { class: "chip" },
          h("span", { class: "chip-kicker" }, "UX skill"),
          h("span", { class: "chip-name" }, c.ux_skill_label)),
        aboutLink)),
    h("div", { class: "info-box" }, h("p", { class: "info-title" }, "Why we suggested this"), whyP),
    actions);
}

// ---------- Step 3: Result ----------
// All added connections go into the guide. Gap questions are shared, so ask each only once.
function allGaps() {
  return [...new Set(addedCandidates().flatMap((c) => c.missing || []))];
}

// The person's own words from the form, in the order the guide shows them.
function storySections() {
  const [role, problem, did, changed] = state.answers.map((a) => a.trim());
  return [
    ["Background", role],
    ["The problem", problem],
    ["What I did", did],
    ["What changed", changed],
  ].filter(([, text]) => text);
}

function proofAsText() {
  const lines = [guideTitle(), ""];
  storySections().forEach(([label, text]) => lines.push(`${label}:`, text, ""));
  lines.push("How my work connects to UX skills:", "");
  if (!addedCandidates().length) lines.push("No connections added yet.", "");
  addedCandidates().forEach((c, i) => {
    lines.push(
      `${i + 1}. Skill it shows: ${c.ux_skill_label}`,
      "",
      "What I did, in my own words:",
      `“${c.quote}”`,
      "",
      "Why it matters:",
      explanationOf(c));
    if (FORMAT_LABELS[c.could_become]) lines.push("", FORMAT_LABELS[c.could_become]);
    lines.push("");
  });
  const gaps = allGaps().filter((q) => state.gapAnswers[q]?.trim());
  if (gaps.length) {
    lines.push("More detail:");
    gaps.forEach((q) => lines.push(`${q}`, state.gapAnswers[q].trim(), ""));
  }
  lines.push(`Made with ${PRODUCT_NAME}. ${SKILL_ATTRIBUTION}.`);
  return lines.join("\n").trim() + "\n";
}

// ---------- Steps 3 and 4: the guide, then copy & download ----------
const SKILL_ATTRIBUTION = "Skill names: Tech Fleet Skills & Practices Framework, CC BY 4.0";
const TIP = "Next: gather notes or a checklist, if you have them. Don’t invent missing evidence.";

// Short title for the whole story. It comes from the engine (AI or rules); fall back to the first card's title.
const guideTitle = () => state.result?.guide_title?.trim() || addedCandidates()[0]?.title || "My proof guide";

function guideEyebrow() {
  const role = state.answers[0].trim();
  return h("p", { class: "label" }, role ? `Your guide · Background: ${role}` : "Your guide");
}

const NO_CONNECTIONS = "No connections added yet";

// "What I did | UX skill connection": one row per added connection, or a plain note when none were added.
function connectionsTable() {
  if (!addedCandidates().length) return h("p", { class: "conn-empty" }, NO_CONNECTIONS);
  return h("table", { class: "conn-table" },
    h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "What I did"), h("th", { scope: "col" }, "UX skill connection"))),
    h("tbody", {}, addedCandidates().map((c) => h("tr", {},
      h("td", {}, `“${c.quote}”`),
      h("td", {}, c.ux_skill_label)))));
}

function resetAll() {
  Object.assign(state, { answers: ["", "", "", ""], result: null, decisions: {}, edits: {}, gapAnswers: {}, privacyChecked: false });
}

function renderGuide() {
  const [, problem, did, changed] = state.answers.map((a) => a.trim());
  const cell = (heading, text) => text ? h("div", { class: "guide-cell" }, h("h3", {}, heading), h("p", {}, text)) : null;

  show(h("div", { class: "guide-wrap" },
    h("div", { class: "guide-head" },
      h("p", { class: "eyebrow" }, "Step 3 · View your proof guide"),
      h("h1", {}, "Your proof guide"),
      h("p", { class: "intro" }, "Only the connections you added are included. Go back to edit your choices, or continue to copy or download your guide.")),
    h("article", { class: "guide-card" },
      guideEyebrow(),
      h("h2", { class: "guide-title" }, guideTitle()),
      h("div", { class: "guide-grid" },
        cell("The problem", problem),
        cell("What I did", did),
        cell("What changed", changed),
        h("p", { class: "tip-box" }, TIP)),
      h("h3", { class: "guide-sub" }, "Connections in your guide"),
      connectionsTable(),
      h("p", { class: "attribution" }, SKILL_ATTRIBUTION)),
    h("div", { class: "button-row" },
      h("button", { onclick: renderProof }, "Back to connections"),
      h("button", { class: "primary", onclick: renderDownload }, "Copy & download"))),
  3, "guide");
}

// ---------- Guide document preview + PDF ----------
// "Download" shows the printable page, then opens the browser's print dialog (choose "Save as PDF").
// The print CSS in styles.css hides everything except the white document page.
async function printGuide() {
  const prevTitle = document.title;
  const restore = () => { document.title = prevTitle; };
  try {
    await document.fonts?.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.title = guideTitle(); // becomes the default PDF file name
    window.addEventListener("afterprint", restore, { once: true });
    window.print();
  } catch {
    window.removeEventListener("afterprint", restore);
    restore();
    openDownloadFailedModal(() => printGuide(), () => renderDownload());
  }
}

function renderPreview() {
  const role = state.answers[0].trim();
  const [, problem, did] = state.answers.map((a) => a.trim());
  const cell = (heading, text) => text ? h("div", { class: "doc-cell" }, h("h3", {}, heading), h("p", {}, text)) : null;

  show(h("div", { class: "preview-wrap" },
    h("div", { class: "preview-head" },
      h("div", { class: "preview-bar" },
        h("button", { class: "sm", onclick: renderDownload }, "Back to copy & download"),
        h("p", { class: "label doc-label" }, "Document preview / 1 page")),
      h("h1", {}, "Your guide, ready to keep."),
      h("p", { class: "intro" }, "Your guide brings together your experience and the connections you added. Build on it with evidence from your real work.")),
    h("article", { class: "doc-page", "aria-label": "Guide document" },
      h("div", { class: "doc-identity" },
        h("p", { class: "label doc-label" }, "UX proof-building guide"),
        h("h2", { class: "doc-title" }, guideTitle()),
        role ? h("p", { class: "doc-background" }, `Background: ${role}`) : null),
      h("div", { class: "doc-cols" }, cell("The problem", problem), cell("What I did", did)),
      h("div", { class: "doc-connections" },
        h("h3", { class: "doc-heading" }, "UX connections to build on"),
        addedCandidates().length
          ? h("ul", { class: "doc-list" }, addedCandidates().map((c, i) => h("li", { class: "conn-box" },
              h("span", { class: "conn-num" }, String(i + 1).padStart(2, "0")),
              h("div", { class: "conn-text" },
                h("p", { class: "conn-did" }, `“${c.quote}”`),
                h("p", { class: "conn-skill" }, c.ux_skill_label)))))
          : h("p", { class: "conn-empty" }, NO_CONNECTIONS)),
      h("div", { class: "doc-foot" },
        h("div", { class: "doc-divider" }),
        h("p", { class: "doc-credit" }, `Made with ${PRODUCT_NAME}. ${SKILL_ATTRIBUTION}.`),
        h("div", { class: "doc-foot-row" },
          h("p", { class: "label doc-label" }, "UX guide"),
          h("p", { class: "label doc-label" }, "01 / 01")))),
    h("p", { class: "preview-foot" }, role ? `Your guide · ${role}` : "Your guide")),
  null, "preview", { noTop: true });
}

function renderDownload() {
  const [, problem, did] = state.answers.map((a) => a.trim());
  const status = h("p", { class: "status-msg", role: "status" });
  const cell = (heading, text) => text ? h("div", { class: "proof-cell" }, h("h3", {}, heading), h("p", {}, text)) : null;

  show(h("div", { class: "download-wrap" },
    h("div", { class: "download-top" },
      h("h1", {}, "Copy & download your proof guide"),
      h("button", { class: "quiet sm", "aria-haspopup": "dialog", onclick: () => openLeaveModal() }, "Leave session")),
    h("article", { class: "proof-card" },
      guideEyebrow(),
      h("h2", { class: "proof-title" }, guideTitle()),
      h("div", { class: "proof-cols" }, cell("The problem", problem), cell("What I did", did)),
      connectionsTable()),
    h("p", { class: "reminder" }, "No autosave: copy or download your guide before closing this tab. Your experience and guide won’t be kept after you leave."),
    h("div", { class: "download-actions" },
      h("div", { class: "button-row" },
        // Asks first (everything is cleared), then starts a fresh Step 1.
        h("button", { "aria-haspopup": "dialog", onclick: () => openLeaveModal(() => renderDescribe()) }, "Create another proof"),
        h("div", { class: "actions" },
          h("button", { onclick: async () => {
              try { await navigator.clipboard.writeText(proofAsText()); status.textContent = "Copied. Paste it into your portfolio notes."; }
              catch { status.textContent = "Copy didn’t work in this browser. Use Download instead."; }
            } }, "Copy guide"),
          h("button", { class: "primary", onclick: () => { renderPreview(); printGuide(); } }, "Download"))),
      status),
    h("p", { class: "made-with" }, `Made with ${PRODUCT_NAME}. ${SKILL_ATTRIBUTION}.`)),
  4, "download", { noTop: true });
}


window.addEventListener("beforeunload", (e) => {
  if (state.answers.some((a) => a.trim())) { e.preventDefault(); e.returnValue = ""; }
});

renderWelcome();
