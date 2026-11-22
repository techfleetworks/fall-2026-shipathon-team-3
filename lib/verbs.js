// Small helpers for turning "I moved the shelves" into "Moving the shelves", and for checking
// that an opening action word in a guide title is either on the allowed list or the person's own verb.
// Shared by the rule-based title builder and the guide-title guardrail.

// A guide title may open with one of these short action words, even if the person didn't write it.
export const TITLE_OPENERS = new Set([
  "improving", "redesigning", "fixing", "simplifying", "organizing", "organising",
  "streamlining", "reorganizing", "reorganising", "creating", "building", "rewriting",
  "clarifying", "updating", "changing",
]);

// Small words that carry no facts, so they don't need to come from the person's text.
export const FUNCTION_WORDS = new Set([
  "that", "with", "from", "into", "their", "they", "them", "when", "while", "what", "where",
  "which", "about", "over", "than", "then", "this", "your", "onto", "between", "through",
  "across", "during", "before", "after",
]);

// Past tense -> -ing for verbs that don't follow the plain "-ed" rule.
const IRREGULAR = {
  wrote: "writing", made: "making", took: "taking", found: "finding", kept: "keeping",
  gave: "giving", chose: "choosing", ran: "running", set: "setting", put: "putting",
  sent: "sending", led: "leading", taught: "teaching", told: "telling", spoke: "speaking",
  met: "meeting", drew: "drawing", built: "building", held: "holding", brought: "bringing",
  began: "beginning", went: "going", came: "coming", saw: "seeing", felt: "feeling",
  lost: "losing", left: "leaving", said: "saying", knew: "knowing", thought: "thinking",
  forgot: "forgetting", spent: "spending", paid: "paying", sat: "sitting", stood: "standing",
  heard: "hearing", understood: "understanding", fell: "falling", grew: "growing",
};

// Helping verbs and states, not actions the person took.
export const NOT_ACTIONS = new Set([
  "was", "were", "had", "did", "would", "could", "should", "been", "being", "is", "am", "are",
  "has", "have", "got", "didn't", "wasn't", "couldn't", "wouldn't", "can't", "don't",
]);

/** "moved" -> "moving", "wrote" -> "writing". Returns null when the word isn't a past-tense verb we can convert. */
export function toGerund(word) {
  const w = String(word).toLowerCase();
  if (NOT_ACTIONS.has(w)) return null;
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (/ied$/.test(w) && w.length > 4) return w.slice(0, -3) + "ying";
  if (/ed$/.test(w) && w.length > 4 && !/eed$/.test(w)) return w.slice(0, -2) + "ing";
  return null;
}

/** True for words that look like a past-tense verb ("asked", "kept"), used to spot "<who> <did what>" clauses. */
export const looksPastTense = (word) => {
  const w = String(word).toLowerCase();
  return w in IRREGULAR || w === "was" || w === "were" || w === "had" || w === "got" ||
    (/ed$/.test(w) && w.length > 4 && !/eed$/.test(w));
};

// Loose word stem: "moving", "moved", "moves" and "move" all become "mov".
export const stemOf = (word) => String(word).toLowerCase().replace(/(ing|ied|ed|es|s|e)$/, "").slice(0, 4);

/** Did the person write a form of this -ing verb? ("Moving" is fine if they wrote "moved".) */
export function gerundInWords(gerund, words) {
  const g = String(gerund).toLowerCase();
  const pastForms = Object.entries(IRREGULAR).filter(([, ger]) => ger === g).map(([past]) => past);
  return words.some((w) => stemOf(w) === stemOf(g) || pastForms.includes(w.toLowerCase()));
}
