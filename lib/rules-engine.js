// Rule-based proof finder. Used when there is no API key, or when the AI call
// fails or breaks a guardrail. It never writes new claims: every quote is one
// of the person's own sentences, matched to a UX skill by the words it uses.

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
  process_or_service_design: "You changed how something worked for the people using it. That's the core of design: improving an experience on purpose, not by accident.",
  prioritization: "You weighed options and made a call with a reason behind it. Employers want to hear how you decide, not only what you made.",
  testing_and_iterating: "You tried something, checked how it went and adjusted. That loop is how UX work gets better over time.",
  stakeholder_communication: "You got other people to understand or support a change. Most design work only ships when others are brought along.",
  information_architecture: "You arranged information so people could find what they needed. That's information architecture, a core UX skill.",
  accessibility_and_inclusion: "You made something easier for more kinds of people to use. Inclusive design is a skill employers look for.",
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
  information_architecture: ["What was hard to find before?"],
  accessibility_and_inclusion: ["Who could use it more easily afterward?"],
  designing_for_constraints: ["What limit shaped your decision the most?"],
};

const REDESIGN_SKILLS = new Set(["process_or_service_design", "information_architecture", "accessibility_and_inclusion"]);
const INSTRUCTION = /\b(ignore (?:all |any |the |previous |your )|instructions?|system prompt|write my (?:full )?case study|pretend|you are an? )/i;
const UNSURE = /^\s*(not sure|n\/?a|no idea|don'?t know|unknown|idk)?\.?\s*$/i;

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
 * @param {string[]} answers five answers (Q1–Q5)
 * @returns proof-candidate result in the same shape the AI returns
 */
export function findProofWithRules(answers) {
  const all = answers.map((a) => String(a || ""));
  const totalWords = wordCount(all.join(" "));

  // Prefer what they did (Q3) and decided (Q4), then Q1 and Q2.
  const order = [2, 3, 0, 1]; // Q5 is the outcome, not an action, so it is never quoted
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
      const missing = [...MISSING[skill]];
      if (UNSURE.test(all[4])) missing.push("What changed afterward, even informally?");
      picked.push({
        id: `c${picked.length + 1}`,
        quote: firstWords(s, 40),
        ux_skill: skill,
        why_it_matters: WHY[skill],
        could_become: REDESIGN_SKILLS.has(skill) ? "before_after_redesign" : "case_study",
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
      candidates: picked,
    };
  }
  return {
    status: "ok",
    message: "Here are parts of your own story that could become proof. Choose the one that feels most true to you.",
    follow_up: null,
    candidates: picked,
  };
}
