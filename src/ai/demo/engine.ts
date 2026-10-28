import { QUESTION_CAP, counts } from "@/game/rules";
import type { AiTurn, Answer, AnsweredTurn, Candidate } from "@/game/types";
import { ATTRIBUTES, ITEMS, type AttributeId, type Item } from "./items";

/*
 * Rule-based 20Q engine (FR-22). Pure and stateless: every turn is derived
 * from the answered history, so rewinds need no special handling.
 *
 * Items are scored with soft penalties rather than hard elimination, so one
 * mistaken answer doesn't make the right item unreachable. Questions are
 * chosen greedily by how evenly they split the remaining probability mass.
 */

type Value = "yes" | "no" | "sometimes";

const PENALTY: Record<Exclude<Answer, "unsure">, Record<Value, number>> = {
  yes: { yes: 0, sometimes: -0.5, no: -3 },
  no: { no: 0, sometimes: -0.5, yes: -3 },
  sometimes: { sometimes: 0, yes: -0.7, no: -0.7 },
};

const GUESS_CONFIDENCE = 0.8;
/** Below this best score, every item contradicts at least two answers. */
const STUMPED_SCORE = -5.5;

const attributeByQuestion = new Map<string, (typeof ATTRIBUTES)[number]>(ATTRIBUTES.map((a) => [a.question, a]));
const itemByGuess = new Map<string, Item>(ITEMS.map((i) => [guessText(i), i]));

export const DEMO_CONCEDE_TEXT =
  `I'm stumped! My demo brain only knows about ${ITEMS.length} things, and yours isn't one of them. ` +
  "Switch to live AI to play against the real thing.";

export function guessText(item: Item): string {
  return `Is it ${item.phrase}?`;
}

export function valueOf(item: Item, attr: AttributeId): Value {
  if (item.t.includes(attr)) return "yes";
  if (item.s?.includes(attr)) return "sometimes";
  return "no";
}

type Ranked = { item: Item; p: number; score: number };

export function rankItems(history: AnsweredTurn[]): Ranked[] {
  const asked = new Map<AttributeId, Answer>();
  const rejected = new Set<string>();
  for (const turn of history) {
    if (turn.ai.kind === "guess") {
      const item = itemByGuess.get(turn.ai.text);
      if (item && turn.answer === "no") rejected.add(item.id);
      continue;
    }
    const attr = attributeByQuestion.get(turn.ai.text);
    if (attr) asked.set(attr.id, turn.answer);
  }

  const scored = ITEMS.filter((item) => !rejected.has(item.id)).map((item) => {
    let score = 0;
    for (const [attr, answer] of asked) {
      if (answer !== "unsure") score += PENALTY[answer][valueOf(item, attr)];
    }
    return { item, score };
  });

  const max = Math.max(...scored.map((s) => s.score));
  const weights = scored.map((s) => Math.exp(s.score - max));
  const total = weights.reduce((a, b) => a + b, 0);
  return scored
    .map((s, i) => ({ ...s, p: weights[i] / total }))
    .sort((a, b) => b.p - a.p);
}

/** Entropy of the yes / no / sometimes split for an attribute, in bits. */
function splitEntropy(ranked: Ranked[], attr: AttributeId): number {
  const mass: Record<Value, number> = { yes: 0, no: 0, sometimes: 0 };
  for (const { item, p } of ranked) mass[valueOf(item, attr)] += p;
  return Object.values(mass).reduce((h, m) => (m > 0 ? h - m * Math.log2(m) : h), 0);
}

export function decideTurn(history: AnsweredTurn[], random: () => number = Math.random): AiTurn {
  const ranked = rankItems(history);
  const remaining = QUESTION_CAP - history.filter((t) => counts(t.answer)).length;
  const candidates = toCandidates(ranked);
  const statusLine = describeProgress(history);

  if (ranked.length === 0 || ranked[0].score < STUMPED_SCORE) {
    return { kind: "concede", text: DEMO_CONCEDE_TEXT, statusLine: "Out of ideas…", candidates };
  }

  // Unsure answers are never re-asked: pivot to a different property.
  const asked = new Set(history.map((t) => t.ai.text));
  const options = ATTRIBUTES.filter((a) => !asked.has(a.question))
    .map((a) => ({ attr: a, h: splitEntropy(ranked, a.id) }))
    .sort((a, b) => b.h - a.h);
  const best = options[0];

  const top = ranked[0];
  const shouldGuess =
    top.p >= GUESS_CONFIDENCE ||
    remaining <= 1 ||
    (remaining <= 3 && top.p >= 0.4) ||
    !best ||
    best.h < 0.1;

  if (shouldGuess) {
    return { kind: "guess", text: guessText(top.item), statusLine: "I think I've got it…", candidates };
  }

  // Break near-ties randomly so repeat games don't feel scripted.
  const nearBest = options.filter((o) => o.h >= best.h - 0.05);
  const pick = nearBest[Math.floor(random() * nearBest.length)];
  return { kind: "question", text: pick.attr.question, statusLine, candidates };
}

function toCandidates(ranked: Ranked[]): Candidate[] {
  return ranked.slice(0, 4).map(({ item, p }) => ({ label: item.label, confidence: Math.round(p * 100) / 100 }));
}

function describeProgress(history: AnsweredTurn[]): string {
  const last = history.at(-1);
  if (!last) return "Wide open. Starting broad…";
  if (last.ai.kind === "guess") {
    const item = itemByGuess.get(last.ai.text);
    return `Not ${item?.phrase ?? "that"}. Back to narrowing down…`;
  }
  if (last.answer === "unsure") return "No problem — trying a different angle…";

  const facts: string[] = [];
  for (let i = history.length - 1; i >= 0 && facts.length < 2; i--) {
    const turn = history[i];
    const attr = attributeByQuestion.get(turn.ai.text);
    if (!attr || turn.answer === "unsure" || turn.answer === "sometimes") continue;
    facts.push(turn.answer === "yes" ? attr.yes : attr.no);
  }
  return facts.length ? `Narrowing down: ${facts.reverse().join(", ")}…` : "Narrowing down…";
}
