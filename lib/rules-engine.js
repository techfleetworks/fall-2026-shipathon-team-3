// Rule-based proof finder. Used when there is no API key, or when the AI call
// fails or breaks a guardrail. It never writes new claims: every quote is one
// of the person's own sentences, matched to a UX skill by the words it uses.

import { toGerund, looksPastTense } from "./verbs.js";

// Checked in order. The first skill whose pattern matches a sentence wins.
const SKILL_PATTERNS = [
  ["user_research", /\b(watched|observed|shadowed|interviewed|surveyed|listened to|asked (?:the |our |my )?\w+|talked (?:to|with)|spoke (?:to|with))\b/i],
  ["testing_and_iterating", /\b(tested|tried (?:it|out|a|the)|piloted|trialed|adjusted|tweaked|iterated|went back and)\b/i],
  ["accessibility_and_inclusion", /\b(accessib\w*|large print|translated|in (?:spanish|their language)|wheelchair|disabilit\w*|easier to read)\b/i],
  ["information_architecture", /\b(labeled|labelled|categori[sz]ed|organi[sz]ed|sorted (?:into|by)|signs?|menu|layout|grouped (?:them|the|items))\b/i],
  ["synthesizing_feedback", /\b(noticed|noticing|wrote down|took notes|collected|compared|tracked|grouped|found that|realized|realised|patterns?)\b/i],
  ["prioritization", /\b(?<![-\w])(decided|chose|picked|prioriti[sz]ed|instead of|rather than|focused on|because)\b/i],
  ["designing_for_constraints", /\b(no budget|budget|limited|short[- ]staffed|on a deadline|constraint\w*|with what we had)\b/i],
  ["stakeholder_communication", /\b(convinced|presented|pitched|explained|negotiated|trained|got (?:my )?(?:manager|boss|team)|shared (?:it|this) with)\b/i],
  ["process_or_service_design", /\b(changed|moved|reorgani[sz]ed|rewrote|redesigned|simplified|streamlined|made (?:a|an) \w+|created (?:a|an) \w+|set up|built|wrote (?:a|an) \w+)\b/i],
  ["problem_framing", /\b(figured out|identified|the (?:real |main )?problem was|root cause|why (?:people|customers|staff))\b/i],
];

export const SKILL_LABELS = {
  user_research: "Learning from the people you serve",
  synthesizing_feedback: "Spotting patterns",
  problem_framing: "Defining the real problem",
  process_or_service_design: "Redesigning how something works",
  prioritization: "Making trade-offs",
  testing_and_iterating: "Trying, checking and adjusting",
  stakeholder_communication: "Bringing people along",
  information_architecture: "Organizing information",
  accessibility_and_inclusion: "Making it work for more people",
  designing_for_constraints: "Working within real limits",
};

const WHY = {
  user_research: "You went to the people involved and learned from what they did and said, before deciding what to change. That's the starting point of UX research.",
  synthesizing_feedback: "You turned scattered observations into a clear pattern. UX teams call this synthesis, and it's how research becomes a direction.",
  problem_framing: "You looked past the symptom to what was really going wrong. Framing the right problem is what keeps a design team from fixing the wrong thing.",
  process_or_service_design: "You made a purposeful change to how something worked, with the aim of helping the people using it. That shows you can improve an experience on purpose.",
  prioritization: "You weighed options and made a call with a reason behind it. Employers want to hear how you decide, not only what you made.",
  testing_and_iterating: "You tried something, checked how it went and adjusted. That loop is how UX work gets better over time.",
  stakeholder_communication: "You got other people to understand or support a change. Most design work only ships when others are brought along.",
  information_architecture: "You arranged information with the aim of helping people find what they needed. That's information architecture, a core UX skill.",
  accessibility_and_inclusion: "You made a change intended to make something easier for more kinds of people to use. Inclusive design is a skill employers look for.",
  designing_for_constraints: "You worked within real limits, like time, money or staff. Every real design project has constraints, and handling them well is a skill.",
};

const MISSING = {
  user_research: ["Who exactly did you learn from, and what surprised you?"],
  synthesizing_feedback: ["What pattern did you see, in a sentence?"],
  problem_framing: ["How did you know this was the real problem?"],
  process_or_service_design: ["What did it look like before and after the change?"],
  prioritization: ["What other option did you consider, and why not that one?"],
  testing_and_iterating: ["What did you change after trying it?"],
  stakeholder_communication: ["Who did you need to convince, and what worked?"],
  information_architecture: ["How did you decide how to organize it for the people using it?"],
  accessibility_and_inclusion: ["Who could use it more easily afterward?"],
  designing_for_constraints: ["What limit shaped your decision the most?"],
};

const REDESIGN_SKILLS = new Set(["process_or_service_design", "information_architecture", "accessibility_and_inclusion"]);
const INSTRUCTION = /\b(ignore (?:all |any |the |previous |your )|instructions?|system prompt|write my (?:full )?case study|pretend|you are an? )/i;
// Short card title built only from the person's own sentence: drop the leading "I"/"We",
// stop at the first clause break, keep at most 8 words.
function titleFrom(sentence) {
  let t = sentence.trim().replace(/^(?:I|We)\s+(?:also\s+|then\s+|first\s+)?/i, "");
  t = t.split(/[,;:]|\s+(?:and then|and|then|because|so)\s+/i)[0].replace(/[.!?"\u201d]+$/, "").trim();
  const words = t.split(/\s+/).filter(Boolean).slice(0, 8);
  // Do not end on a dangling word like "the" or "even though".
  while (words.length > 2 && /^(?:the|a|an|of|to|on|in|for|with|that|when|while|if|than|or|but|every|over|even|though|my|our|their|by|at|as|from|into|about)$/i.test(words[words.length - 1])) words.pop();
  const out = words.join(" ");
  return out ? out[0].toUpperCase() + out.slice(1) : sentence.trim().split(/\s+/).slice(0, 8).join(" ");
}

// ---- Guide title: a one-line summary of the task, built only from the person's own words ----
// Shapes, in the order they are tried for each sentence:
//   "I moved the front shelves"         -> "Moving the front shelves"            (their own action, as -ing)
//   "Fixing the returns process"        -> "Fixing the returns process"          (already a task name)
//   "Staff swapped shifts in a chat"    -> "Improving how staff swapped shifts in a chat"
//   "The returns process at our store"  -> "Improving the returns process at our store"
// It stops at a natural break, never mid-thought, and never adds a fact: only the opener
// ("Improving") is ours, and it is on the guardrail's allowed list.
const BREAK_WORDS = new Set(["and", "but", "because", "so", "which", "while", "after", "when", "until", "since", "although", "though", "then"]);
const DANGLING = /^(?:the|a|an|of|to|on|in|for|with|that|when|while|if|than|or|but|every|over|even|though|my|our|their|by|at|as|from|into|about|how|and|so|because|after|before|each|its|his|her)$/i;
const NOT_GERUNDS = new Set(["during", "morning", "evening", "ceiling", "something", "anything", "nothing", "everything", "meeting", "feeling"]);
const MAX_TITLE_WORDS = 10;

const lowerFirst = (w) => (/^[A-Z][a-z-]+$/.test(w) && w !== "I" ? w[0].toLowerCase() + w.slice(1) : w);
const upperFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Words that start a tail we can cut off cleanly: "...swapped shifts | through a group chat", "...asked | where it was".
const CUT_BEFORE = /^(?:in|at|on|for|with|from|during|through|by|into|over|to|of|across|between|where|who|whom|whose|what|why|that|whether|if|as|than)$/i;
const HARD_MAX_WORDS = 12;
const endsOnVerb = (w) => (/ing$/i.test(w) && w.length > 4) || looksPastTense(w);
const trimDangling = (arr) => {
  let out = arr;
  while (out.length > 2 && DANGLING.test(out[out.length - 1])) out = out.slice(0, -1);
  return out;
};

// Aim for MAX_TITLE_WORDS words. Over that, cut before a prepositional phrase or "where/who/that..." tail, but not if
// that leaves a verb hanging ("kept asking"). With no clean cut, keep the whole clause if it fits in HARD_MAX_WORDS.
// Never end on a small connecting word.
function endCleanly(words) {
  if (words.length <= MAX_TITLE_WORDS) return trimDangling(words);
  for (let i = MAX_TITLE_WORDS; i >= 4; i--) {
    if (CUT_BEFORE.test(words[i]) && !endsOnVerb(words[i - 1])) return trimDangling(words.slice(0, i));
  }
  return trimDangling(words.slice(0, words.length <= HARD_MAX_WORDS ? words.length : MAX_TITLE_WORDS));
}

const isGerundStart = (w) => /ing$/i.test(w) && w.length >= 6 && !NOT_GERUNDS.has(w.toLowerCase());

// The first clause of a sentence: stop at a comma or a joining word ("because", "and", "which"...),
// but only AFTER the main verb. That keeps a subject like "Servers and kitchen staff" whole instead
// of cutting it at its own "and". When the sentence starts with the verb itself, any break counts.
function firstClause(text, startsWithVerb) {
  const raw = text.split(/\s+/).filter(Boolean);
  const words = raw.map((w) => w.replace(/[,;:]+$/, ""));
  const verbAt = startsWithVerb ? 0 : words.findIndex((w, i) => i >= 1 && i <= 8 && looksPastTense(w));
  // No verb at all means a plain noun phrase, where "and" joins its parts ("sign-in sheets and name tags").
  const nounPhrase = verbAt === -1 && !startsWithVerb;
  for (let i = Math.max(verbAt, 1) + 1; i < words.length; i++) {
    const w = words[i].toLowerCase();
    if ((BREAK_WORDS.has(w) && !(nounPhrase && w === "and")) || /[,;:]$/.test(raw[i - 1])) return words.slice(0, i);
  }
  return words;
}

function summaryFrom(sentence) {
  let s = sentence.trim().replace(/[.!?"”]+$/, "");
  if (wordCount(s) < 3 || /\?\s*$/.test(sentence) || INSTRUCTION.test(s)) return "";
  const firstPerson = /^(?:I|We)\s/.test(s);
  s = s.replace(/^(?:I|We)\s+(?:also\s+|then\s+|first\s+|just\s+)*/i, "");
  const words = firstClause(s, firstPerson || isGerundStart(s.split(/\s+/)[0]));
  if (words.length < 2) return "";

  let title;
  const first = words[0];
  if (firstPerson) {
    // Their own action as a task name: "I moved the front shelves" -> "Moving the front shelves".
    const gerund = toGerund(first);
    if (!gerund) return "";
    title = [upperFirst(gerund), ...words.slice(1)];
  } else if (isGerundStart(first)) {
    title = [upperFirst(first), ...words.slice(1)]; // already a task name: "Fixing the returns process"
  } else {
    const hasVerb = words.slice(1, 6).some(looksPastTense);
    title = hasVerb
      ? ["Improving", "how", lowerFirst(first), ...words.slice(1)]   // "Improving how staff swapped shifts"
      : ["Improving", lowerFirst(first), ...words.slice(1)];         // "Improving the returns process"
  }
  const out = endCleanly(title);
  return out.length >= 3 ? out.join(" ") : "";
}

// Short title for the whole story. It comes from the FIRST sentence of the situation (it says what the task was).
// Only if that sentence can't be used at all (too short, a question, text aimed at the tool) does it look at
// the next one, then at what they did.
export function guideTitleFrom(answers, picked = []) {
  const all = answers.map((a) => String(a || ""));
  for (const qi of [1, 2]) {
    for (const s of sentences(all[qi])) {
      const t = summaryFrom(s);
      if (t) return t;
    }
  }
  return picked[0]?.title || "";
}

const UNSURE =/^\s*(not sure|n\/?a|no idea|don'?t know|unknown|idk)?\.?\s*$/i;

function projectContext(answers) {
  const text = answers.join(" ");
  const describesNewProject = /\b(new (?:website|site|app|project|service|page)|from scratch|first (?:website|site|app)|launch(?:ed|ing)? a)\b/i.test(text);
  const describesExistingThing = /\b(redesign(?:ed|ing)?|revamp(?:ed|ing)?|existing|old|previous|current|before|used to|was hard to|was confusing)\b/i.test(text);
  const describesChange = /\b(changed|moved|rewrote|reorgani[sz]ed|redesigned|simplified|streamlined|replaced|updated)\b/i.test(text);

  if (describesNewProject && !describesExistingThing) return "new";
  if (describesExistingThing && describesChange && !describesNewProject) return "redesign";
  return "unclear";
}

function missingFor(skill, context) {
  if (skill !== "information_architecture") return [...MISSING[skill]];
  if (context === "new") return ["How did you decide what the people using it needed?"];
  if (context === "redesign") return ["What was hard for people before the change?"];
  return [...MISSING[skill]];
}

function sentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wordCount(s) {
  return s.split(/\s+/).filter(Boolean).length;
}

function firstWords(s, n) {
  const words = s.split(/\s+/);
  return words.length <= n ? s : words.slice(0, n).join(" ");
}

const FOLLOW_UP = {
  question: "Could you walk through what you actually did, one step at a time?",
  examples: [
    "I noticed customers kept asking the same question at checkout, so I…",
    "I rewrote the sign-in sheet after volunteers kept skipping a field…",
    "I asked the drivers what slowed them down, then…",
  ],
};

/**
 * @param {string[]} answers four answers: role, situation, what they did, what changed
 * @returns proof-candidate result in the same shape the AI returns
 */
export function findProofWithRules(answers) {
  const all = answers.map((a) => String(a || ""));
  const totalWords = wordCount(all.join(" "));
  const context = projectContext(all);

  // Prefer what they did (Q3), then the situation (Q2).
  // Q1 is only a role and Q4 is the outcome, not an action, so neither is quoted.
  const order = [2, 1];
  const picked = [];
  const usedSkills = new Set();

  for (const qi of order) {
    for (const s of sentences(all[qi])) {
      if (picked.length >= 3) break;
      if (wordCount(s) < 5) continue;
      if (!/\bI\b/.test(s) && !/\bwe\b/i.test(s)) continue; // must be something they did
      if (/\?\s*$/.test(s)) continue; // questions aren't actions
      if (INSTRUCTION.test(s)) continue; // ignore text aimed at the tool
      const match = SKILL_PATTERNS.find(([skill, re]) => !usedSkills.has(skill) && re.test(s));
      if (!match) continue;
      const skill = match[0];
      usedSkills.add(skill);
      const missing = missingFor(skill, context);
      if (UNSURE.test(all[3])) missing.push("What changed afterward, even informally?");
      picked.push({
        id: `c${picked.length + 1}`,
        title: titleFrom(s),
        quote: firstWords(s, 40),
        ux_skill: skill,
        why_it_matters: WHY[skill],
        could_become: context === "redesign" && REDESIGN_SKILLS.has(skill) ? "before_after_redesign" : "case_study",
        missing,
      });
    }
  }

  if (totalWords < 20 || picked.length === 0) {
    return {
      status: "needs_more_detail",
      message: "There isn't enough here yet to find proof without guessing. A little more about what you did will help.",
      follow_up: FOLLOW_UP,
      candidates: [],
    };
  }
  if (picked.length === 1) {
    return {
      status: "too_few_candidates",
      message: "Your story has one strong thread. Adding more about what you did or decided could reveal more.",
      follow_up: null,
      guide_title: guideTitleFrom(all, picked),
      candidates: picked,
    };
  }
  return {
    status: "ok",
    message: "Here are parts of your own story that could become proof. Choose the ones that feel true to you.",
    follow_up: null,
    guide_title: guideTitleFrom(all, picked),
    candidates: picked,
  };
}
