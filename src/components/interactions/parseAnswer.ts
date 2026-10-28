import type { Answer } from "@/game/types";

/*
 * Free-text answer parsing for the Voice and Type interactions.
 * Order matters: "not sure" must win over "no"/"not", and "sometimes"
 * phrases over a bare "yes"/"no".
 */

const LETTERS: Record<string, Answer> = { y: "yes", n: "no", s: "sometimes", u: "unsure" };

const PATTERNS: [Answer, RegExp][] = [
  ["unsure", /\b(not sure|unsure|don'?t know|dunno|no idea|no clue|idk|skip|pass)\b/],
  ["sometimes", /\b(sometimes|kinda|kind of|sort of|sorta|maybe|partly|partially|occasionally|depends|a bit|a little)\b/],
  ["no", /\b(no|nope|nah|not|never|wrong|negative)\b/],
  ["yes", /\b(yes|yeah|yep|yup|yea|ya|sure|correct|right|definitely|absolutely|of course|that'?s it|got it)\b/],
];

export const ALL_ANSWERS: Answer[] = ["yes", "no", "sometimes", "unsure"];

export function parseAnswer(text: string, allowed: Answer[] = ALL_ANSWERS): Answer | null {
  const t = text.trim().toLowerCase().replace(/[’]/g, "'");
  if (!t) return null;
  const answer = LETTERS[t] ?? PATTERNS.find(([, re]) => re.test(t))?.[0] ?? null;
  return answer && allowed.includes(answer) ? answer : null;
}
