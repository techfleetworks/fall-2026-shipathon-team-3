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
  cut: "cutting", began: "beginning", went: "going", came: "coming", saw: "seeing", felt: "feeling",
  lost: "losing", left: "leaving", said: "saying", knew: "knowing", thought: "thinking",
  forgot: "forgetting", spent: "spending", paid: "paying", sat: "sitting", stood: "standing",
  heard: "hearing", understood: "understanding", fell: "falling", grew: "growing",
};

// Helping verbs and states, not actions the person took.
export const NOT_ACTIONS = new Set([
  "was", "were", "had", "did", "would", "could", "should", "been", "being", "is", "am", "are",
  "has", "have", "got", "didn't", "wasn't", "couldn't", "wouldn't", "can't", "don't",
]);

// Irregular verbs also work with a prefix: "rewrote" -> "re" + "wrote", "rebuilt" -> "re" + "built".
const PREFIX = /^(re|un|over|out|mis)(?=\w{3})/;
function irregularGerund(w) {
  if (IRREGULAR[w]) return IRREGULAR[w];
  const m = w.match(PREFIX);
  return m && IRREGULAR[w.slice(m[1].length)] ? m[1] + IRREGULAR[w.slice(m[1].length)] : null;
}

/** "moved" -> "moving", "wrote" -> "writing", "rewrote" -> "rewriting". Returns null when the word isn't a past-tense verb we can convert. */
export function toGerund(word) {
  const w = String(word).toLowerCase();
  if (NOT_ACTIONS.has(w)) return null;
  const irregular = irregularGerund(w);
  if (irregular) return irregular;
  if (/ied$/.test(w) && w.length > 4) return w.slice(0, -3) + "ying";
  if (/ed$/.test(w) && w.length > 4 && !/eed$/.test(w)) return w.slice(0, -2) + "ing";
  return null;
}

// Helping verbs that still mark "<who> <verb> ..." in a sentence ("students did not understand the worksheet").
const VERB_MARKERS = new Set(["was", "were", "had", "got", "did", "didn't", "could", "couldn't", "would", "wouldn't"]);

/** True for words that look like a past-tense verb ("asked", "kept", "rewrote"), used to spot "<who> <did what>" clauses. */
export const looksPastTense = (word) => {
  const w = String(word).toLowerCase();
  return VERB_MARKERS.has(w) || irregularGerund(w) !== null ||
    (/ed$/.test(w) && w.length > 4 && !/eed$/.test(w));
};

// Loose word stem: "moving", "moved", "moves" and "move" all become "mov".
export const stemOf = (word) => String(word).toLowerCase().replace(/(ing|ied|ed|es|s|e)$/, "").slice(0, 4);

/** Did the person write a form of this -ing verb? ("Moving" is fine if they wrote "moved"; "Rewriting" if they wrote "rewrote".) */
export function gerundInWords(gerund, words) {
  const g = String(gerund).toLowerCase();
  return words.some((w) => stemOf(w) === stemOf(g) || toGerund(w) === g);
}
