// Proof from past work: front end. No framework, no build step.
// State lives in memory only (MVP #1 has no accounts or saving).

const QUESTIONS = [
  { label: "One task or project you handled in a past job", hint: "Describe the task, not your job title. Example: “fixing how returns worked at our store.”" },
  { label: "Who it was for, and what they were struggling with", hint: "Customers, coworkers, patients, volunteers… What got in their way?" },
  { label: "What you did, step by step", hint: "Plain steps are perfect: “I watched…, then I asked…, then I changed…”" },
  { label: "What you had to decide along the way, and why", hint: "Any choice counts, even a small one. What did you pick, and what did you pass on?" },
  { label: "What changed afterward", hint: "“Not sure” is a fine answer. Don’t guess numbers." },
];

const FORMAT_LABELS = {
  case_study: "Could become a short case study",
  before_after_redesign: "Could become a before-and-after redesign",
};

const state = {
  answers: ["", "", "", "", ""],
  title: "",
  result: null,
  decisions: {},      // candidate id -> "added" | "skipped" (absent = undecided)
  edits: {},          // candidate id -> edited explanation
  gapAnswers: {},     // question text -> answer
};

const screenEl = document.getElementById("screen");
const progressEl = document.getElementById("progress");
const progressLabel = document.getElementById("progress-label");
const mainEl = document.getElementById("main");

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

function show(nodes, step, wide = false) {
  mainEl.classList.toggle("wide", wide);
  screenEl.replaceChildren(...[nodes].flat());
  if (step) {
    progressEl.hidden = false;
    const names = ["Describe your work", "Find the proof", "Your proof"];
    progressLabel.textContent = `Step ${step} of 3: ${names[step - 1]}`;
    [...progressEl.querySelectorAll("li")].forEach((li, i) => li.classList.toggle("done", i < step));
  } else {
    progressEl.hidden = true;
  }
  window.scrollTo({ top: 0 });
  const heading = screenEl.querySelector("h1, h2");
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  else mainEl.focus({ preventScroll: true });
}

// ---------- Welcome ----------
function renderWelcome() {
  show([
    h("h1", {}, "Turn one piece of past work into proof an employer can judge"),
    h("p", { class: "lede" }, "You already did real work before UX. This tool helps you find the parts that show how you think, using only your own words."),
    h("p", { class: "voice hero-voice" },
      h("mark", {}, "“I watched the returns desk for a week and wrote down where people got stuck.”")),
    h("p", { class: "small" }, "A store manager’s sentence like this one already shows user research."),
    h("ol", { class: "steps" },
      h("li", {}, "Describe one piece of past work by answering five short questions."),
      h("li", {}, "See which parts could become proof, and why employers care."),
      h("li", {}, "Keep what’s accurate, fill in the gaps, and take it with you.")),
    h("div", { class: "honest" },
      h("p", {}, "It takes about 30 minutes here. Finishing a full portfolio piece takes a few more hours on your own."),
      h("p", {}, "It’s free and doesn’t save anything, so copy or download your proof before you leave."),
      h("p", {}, "It can make your proof clearer. It can’t promise interviews or jobs.")),
    h("div", { class: "actions" },
      h("button", { class: "primary", onclick: renderDescribe }, "Start with one piece of work")),
  ]);
}

// ---------- Step 1: Describe ----------
function renderDescribe(errorText) {
  const fields = QUESTIONS.map((q, i) => {
    const id = `q${i + 1}`;
    const area = h("textarea", { id, name: id, maxlength: "2000", "aria-describedby": `${id}-hint` });
    area.value = state.answers[i];
    const count = h("span", { class: "count", "aria-hidden": "true" }, `${area.value.length} / 2000`);
    area.addEventListener("input", () => { state.answers[i] = area.value; count.textContent = `${area.value.length} / 2000`; });
    return h("div", { class: "field" },
      h("label", { for: id }, q.label),
      h("span", { class: "hint", id: `${id}-hint` }, q.hint),
      area, count);
  });

  const title = h("input", { type: "text", id: "title", maxlength: "100", "aria-describedby": "title-hint" });
  title.value = state.title;
  title.addEventListener("input", () => { state.title = title.value; });

  const submit = h("button", { class: "primary", type: "submit" }, "Find proof in my answers");
  const status = h("p", { class: "error", role: "alert" }, errorText || "");

  const form = h("form", { novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      const filled = state.answers.filter((a) => a.trim()).length;
      if (filled < 2) { status.textContent = "Answer at least two questions, especially what you did, so there’s something real to work with."; return; }
      submit.disabled = true;
      submit.replaceChildren(h("span", { class: "loading" }, "Reading your answers…"));
      status.textContent = "";
      await fetchProof();
    } },
    h("h2", {}, "Describe one piece of past work"),
    h("p", {}, "Pick something you actually did, in any job. Write the way you’d tell a friend. There’s no need to use UX words."),
    ...fields,
    h("div", { class: "field" },
      h("label", { for: "title" }, "Job title (optional)"),
      h("span", { class: "hint", id: "title-hint" }, "Only for context. Your proof comes from what you did, not your title."),
      title),
    status,
    h("div", { class: "actions" },
      submit,
      h("button", { class: "quiet", type: "button", onclick: renderWelcome }, "Back")));

  show(form, 1);
}

async function fetchProof() {
  try {
    const res = await fetch("/api/proof-candidates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers: state.answers, title: state.title }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    state.result = data;
    state.decisions = {};
    state.edits = {};
    state.gapAnswers = {};
    renderProof();
  } catch (err) {
    renderDescribe(`${err.message} Your answers are still here.`);
  }
}

// Which question did this quote come from?
function sourceQuestion(quote) {
  const norm = (s) => s.toLowerCase().replace(/\s+/g, " ");
  const i = state.answers.findIndex((a) => norm(a).includes(norm(quote)));
  return i >= 0 ? QUESTIONS[i].label : null;
}

// ---------- Step 2: Review suggestions ----------
const STATUS_LABELS = { undecided: "Undecided", added: "Added", skipped: "Skipped" };
const statusOf = (c) => state.decisions[c.id] || "undecided";
const explanationOf = (c) => state.edits[c.id] ?? c.why_it_matters;
const addedCandidates = () => (state.result?.candidates || []).filter((c) => state.decisions[c.id] === "added");

let refreshProof = () => {};

function renderProof() {
  const r = state.result;
  const list = h("ul", { class: "candidates" });
  const panel = h("aside", { class: "guide-panel", "aria-labelledby": "included-h" });
  const warning = h("p", { class: "error", role: "alert" });

  // Re-render the cards and the side panel in place (no scroll jump), then restore focus.
  refreshProof = (focusId) => {
    list.replaceChildren(...r.candidates.map(renderCandidate));
    panel.replaceChildren(...renderIncludedPanel());
    if (addedCandidates().length) warning.textContent = "";
    const el = focusId && document.getElementById(focusId);
    if (el) el.focus();
  };
  refreshProof();

  const main = [
    h("h2", {}, "Choose the connections for your guide"),
    h("p", {}, "Add only what fits your experience. Edit first if needed, or skip. Every decision can be undone."),
    h("p", {}, r.message),
    h("p", { class: "small" },
      r.source === "ai"
        ? "Suggested by AI, using only your words. Check every line."
        : "Found by matching the words you used to UX skills. Nothing was added."),
    r.note ? h("p", { class: "notice warn" }, r.note) : null,
    r.follow_up ? renderFollowUp(r.follow_up) : null,
    r.candidates.length ? list : null,
    warning,
    h("div", { class: "actions" },
      h("button", { class: "quiet", onclick: () => renderDescribe() }, "Edit my answers"),
      r.candidates.length ? h("button", { class: "primary", onclick: () => {
          if (!addedCandidates().length) {
            warning.textContent = "Choose at least one connection to continue. Use “Add to guide” on a suggestion that fits your experience.";
            return;
          }
          renderResult();
        } }, "Preview guide") : null),
  ];

  show(h("div", { class: "review-layout" }, h("div", { class: "review-main" }, main), panel), 2, true);
}

function renderIncludedPanel() {
  const added = addedCandidates();
  const nodes = [h("h3", { id: "included-h" }, "Included in your guide")];
  if (!added.length) {
    nodes.push(h("p", { class: "small" }, "Nothing added yet. Choose “Add to guide” on a suggestion to include it here."));
  } else {
    nodes.push(h("table", {},
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "What I did"), h("th", { scope: "col" }, "What it shows"))),
      h("tbody", {}, added.map((c) => h("tr", {},
        h("td", {}, `“${c.quote}”`),
        h("td", {}, c.ux_skill_label))))));
  }
  nodes.push(h("p", { class: "small" }, "Only added connections are included in your guide."));
  return nodes;
}

function renderFollowUp(fu) {
  const area = h("textarea", { id: "followup" });
  const btn = h("button", { class: "primary", onclick: async () => {
      if (!area.value.trim()) { area.focus(); return; }
      state.answers[2] = [state.answers[2], area.value.trim()].filter(Boolean).join("\n");
      btn.disabled = true;
      btn.replaceChildren(h("span", { class: "loading" }, "Reading your answers…"));
      await fetchProof();
    } }, "Add this and try again");
  return h("section", { class: "notice" },
    h("label", { for: "followup" }, h("strong", {}, fu.question)),
    fu.examples?.length ? h("ul", { class: "missing" }, fu.examples.map((e) => h("li", {}, e))) : null,
    h("p", { class: "small" }, "This gets added to your answer about what you did."),
    area,
    h("div", { class: "actions" }, btn));
}

function renderCandidate(c) {
  const from = sourceQuestion(c.quote);
  const status = statusOf(c);
  const whyP = h("p", {}, explanationOf(c));
  const actions = h("div", { class: "actions" });

  const decide = (value) => { state.decisions[c.id] = value; refreshProof(`undo-${c.id}`); };
  const undo = () => { delete state.decisions[c.id]; refreshProof(`add-${c.id}`); };

  const editBtn = h("button", { id: `edit-${c.id}`, onclick: () => {
      const area = h("textarea", { "aria-label": "Edit the explanation" });
      area.value = explanationOf(c);
      const save = h("button", { class: "primary", onclick: () => { state.edits[c.id] = area.value.trim() || c.why_it_matters; refreshProof(`edit-${c.id}`); } }, "Save wording");
      whyP.replaceWith(h("div", {}, area, h("div", { class: "actions" }, save,
        h("button", { class: "quiet", onclick: () => refreshProof(`edit-${c.id}`) }, "Cancel"))));
      actions.hidden = true;
      area.focus();
    } }, "Edit");

  if (status === "undecided") {
    actions.append(
      h("button", { class: "primary", id: `add-${c.id}`, onclick: () => decide("added") }, "Add to guide"),
      editBtn,
      h("button", { onclick: () => decide("skipped") }, "Skip"));
  } else {
    actions.append(h("button", { id: `undo-${c.id}`, onclick: undo }, "Undo"), editBtn);
  }

  return h("li", { class: `candidate ${status}` },
    h("p", { class: "badge-row" }, h("span", { class: `badge badge-${status}` }, STATUS_LABELS[status])),
    h("p", { class: "voice" }, h("mark", {}, `“${c.quote}”`)),
    from ? h("p", { class: "from" }, `Your answer to: ${from}`) : null,
    h("p", { class: "skill" }, c.ux_skill_label),
    whyP,
    h("p", { class: "format" }, FORMAT_LABELS[c.could_become] || ""),
    actions);
}

// ---------- Step 3: Result ----------
// All added connections go into the guide. Gap questions are shared, so ask each only once.
function allGaps() {
  return [...new Set(addedCandidates().flatMap((c) => c.missing || []))];
}

function proofAsText() {
  const lines = ["Proof from my past work", ""];
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
  return lines.join("\n").trim() + "\n";
}

// ---------- Word export ----------
// The docx library loads only when someone downloads, so the page stays fast.
const DOCX_URL = "https://cdn.jsdelivr.net/npm/docx@9.5.1/dist/index.iife.js";
let docxPromise = null;
function loadDocx() {
  if (window.docx) return Promise.resolve(window.docx);
  docxPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = DOCX_URL;
    s.onload = () => (window.docx ? resolve(window.docx) : reject(new Error("docx missing")));
    s.onerror = () => { docxPromise = null; reject(new Error("docx failed to load")); };
    document.head.append(s);
  });
  return docxPromise;
}

function proofParts() {
  const gaps = allGaps().filter((q) => state.gapAnswers[q]?.trim())
    .map((q) => ({ heading: q, text: state.gapAnswers[q].trim() }));
  return {
    title: `Proof from my past work: ${state.answers[0].trim().replace(/[.!]+$/, "") || "one piece of work"}`,
    items: addedCandidates().map((c) => ({
      skill: c.ux_skill_label,
      format: FORMAT_LABELS[c.could_become] || "",
      quote: `“${c.quote}”`,
      why: explanationOf(c).trim(),
    })),
    gaps,
  };
}

async function proofAsDocx() {
  const d = await loadDocx();
  const p = proofParts();
  const INK = "1D2B4F";
  const paras = (text) => text.split(/\n+/).filter((t) => t.trim())
    .map((t) => new d.Paragraph({ children: [new d.TextRun(t.trim())] }));
  const heading = (t, level = d.HeadingLevel.HEADING_1) => new d.Paragraph({ heading: level, children: [new d.TextRun(t)] });

  const children = [
    new d.Paragraph({ heading: d.HeadingLevel.TITLE, children: [new d.TextRun(p.title)] }),
  ];
  for (const item of p.items) {
    children.push(
      new d.Paragraph({ children: [new d.TextRun({ text: "Skill it shows: ", bold: true }), new d.TextRun(item.skill)] }),
      new d.Paragraph({
        spacing: { before: 240, after: 240 },
        indent: { left: 240 },
        border: { left: { style: d.BorderStyle.SINGLE, size: 24, color: "C9D23A", space: 10 } },
        shading: { type: d.ShadingType.CLEAR, color: "auto", fill: "F6F8C8" },
        children: [new d.TextRun({ text: item.quote, italics: true, size: 26, font: "Georgia" })],
      }),
      heading("Why it matters"),
      ...paras(item.why));
    if (item.format) children.push(new d.Paragraph({ children: [new d.TextRun({ text: item.format, italics: true, color: "545E74" })] }));
  }
  if (p.gaps.length) {
    children.push(heading("More detail"));
    for (const g of p.gaps) children.push(heading(g.heading, d.HeadingLevel.HEADING_2), ...paras(g.text));
  }

  const doc = new d.Document({
    creator: "Proof from past work",
    title: p.title,
    styles: {
      default: { document: { run: { font: "Arial", size: 22, color: "222222" }, paragraph: { spacing: { after: 120, line: 300 } } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 40, bold: true, color: INK },
          paragraph: { spacing: { before: 0, after: 200 }, keepNext: true } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 28, bold: true, color: INK },
          paragraph: { spacing: { before: 320, after: 100 }, keepNext: true, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { font: "Arial", size: 23, bold: true, color: INK },
          paragraph: { spacing: { before: 200, after: 60 }, keepNext: true, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });
  return d.Packer.toBlob(doc);
}

function fileSlug() {
  const base = (state.answers[0] || "my-proof").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${base || "my-proof"}.docx`;
}

function renderResult() {
  const added = addedCandidates();
  const gapQuestions = allGaps();
  const status = h("p", { class: "status-msg", role: "status" });
  const checklist = h("ul", { class: "checklist" });

  const updateChecklist = () => {
    const gaps = gapQuestions;
    const filled = gaps.filter((q) => state.gapAnswers[q]?.trim()).length;
    checklist.replaceChildren(
      h("li", { class: "met" }, "Uses only your own words"),
      h("li", { class: "met" }, "Names the skill and why an employer cares"),
      h("li", { class: gaps.length && filled === gaps.length ? "met" : "" },
        gaps.length ? "Gaps filled in with details only you know" : "No gaps flagged"),
      h("li", { class: state.privacyChecked ? "met" : "" }, "Names of people and places removed"));
  };

  const gapFields = gapQuestions.map((q, i) => {
    const id = `gap${i}`;
    const area = h("textarea", { id });
    area.value = state.gapAnswers[q] || "";
    area.addEventListener("input", () => { state.gapAnswers[q] = area.value; updateChecklist(); });
    return h("div", { class: "field" }, h("label", { for: id }, q), area);
  });

  const privacy = h("input", { type: "checkbox", id: "privacy" });
  privacy.checked = !!state.privacyChecked;
  privacy.addEventListener("change", () => { state.privacyChecked = privacy.checked; updateChecklist(); });

  updateChecklist();

  show([
    h("h2", {}, "Your proof"),
    h("p", {}, "This is yours to keep. Fill in what only you know, then copy it or download it as a Word file."),
    ...added.map((c) => h("article", { class: "proof" },
      h("p", { class: "skill" }, c.ux_skill_label),
      h("p", { class: "voice" }, h("mark", {}, `“${c.quote}”`)),
      h("h3", {}, "Why it matters"),
      h("p", {}, explanationOf(c)),
      h("p", { class: "format" }, FORMAT_LABELS[c.could_become] || ""))),
    gapFields.length ? h("section", {}, h("h3", {}, "Needs your input"), ...gapFields) : null,
    h("h3", {}, "What done looks like"),
    checklist,
    h("p", {}, h("label", {}, privacy, " I’ve removed names of people and places I wouldn’t want shared")),
    h("div", { class: "actions" },
      h("button", { class: "primary", onclick: async () => {
          try { await navigator.clipboard.writeText(proofAsText()); status.textContent = "Copied. Paste it into your portfolio notes."; }
          catch { status.textContent = "Copy didn’t work in this browser. Use Download instead."; }
        } }, "Copy as text"),
      h("button", { onclick: async (ev) => {
          const btn = ev.currentTarget;
          btn.disabled = true;
          status.textContent = "Preparing your Word file…";
          try {
            const blob = await proofAsDocx();
            const filename = fileSlug();
            const a = h("a", { href: URL.createObjectURL(blob), download: filename });
            document.body.append(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            status.textContent = `Downloaded ${filename}. It opens in Word, Google Docs and Pages.`;
          } catch {
            status.textContent = "The Word file couldn’t be made right now. Use Copy instead, or try again.";
          } finally { btn.disabled = false; }
        } }, "Download Word file (.docx)")),
    status,
    h("div", { class: "actions" },
      h("button", { class: "quiet", onclick: renderProof }, "Back to suggestions"),
      h("button", { class: "quiet", onclick: () => {
          if (!confirm("Start over? Your answers and proof will be cleared.")) return;
          Object.assign(state, { answers: ["", "", "", "", ""], title: "", result: null, decisions: {}, edits: {}, gapAnswers: {}, privacyChecked: false });
          renderWelcome();
        } }, "Start over")),
  ], 3);
}

window.addEventListener("beforeunload", (e) => {
  if (state.answers.some((a) => a.trim())) { e.preventDefault(); e.returnValue = ""; }
});

renderWelcome();
