import { describe, expect, it } from "vitest";
import { QUESTION_CAP, counts } from "@/game/rules";
import type { Answer, AnsweredTurn } from "@/game/types";
import { ATTRIBUTES, ITEMS, type AttributeId, type Item } from "./items";
import { decideTurn, guessText, valueOf } from "./engine";

const questionToAttr = new Map<string, AttributeId>(ATTRIBUTES.map((a) => [a.question, a.id]));

/** Plays a full game as an honest player thinking of `secret`. */
function play(secret: Item | null, answerFor?: (question: string) => Answer) {
  const history: AnsweredTurn[] = [];
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 60; i++) {
    const ai = decideTurn(history, random);
    if (ai.kind === "concede") return { result: "conceded" as const, history };
    const answer: Answer =
      ai.kind === "guess"
        ? secret && ai.text === guessText(secret) ? "yes" : "no"
        : answerFor?.(ai.text) ?? (secret ? valueOf(secret, questionToAttr.get(ai.text)!) : "no");
    history.push({ id: String(i), ai, answer });
    if (ai.kind === "guess" && answer === "yes") return { result: "won" as const, history };
    if (history.filter((t) => counts(t.answer)).length >= QUESTION_CAP) return { result: "lost" as const, history };
  }
  throw new Error("game did not terminate");
}

describe("demo engine", () => {
  it("has unique item ids and attribute vectors", () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    const vectors = ITEMS.map((i) => ATTRIBUTES.map((a) => valueOf(i, a.id)).join());
    expect(new Set(vectors).size).toBe(ITEMS.length);
  });

  it.each(ITEMS.map((i) => [i.label, i] as const))("guesses %s within 20 questions", (_, secret) => {
    const { result } = play(secret);
    expect(result).toBe("won");
  });

  it("never re-asks a question answered unsure", () => {
    const { history } = play(ITEMS[0], () => "unsure");
    const texts = history.filter((t) => t.ai.kind === "question").map((t) => t.ai.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("concedes when the secret isn't in the set", () => {
    // Contradictory answers: alive, man-made, electric, a mammal, edible, furniture…
    const { result } = play(null, () => "yes");
    expect(["conceded", "lost"]).toContain(result);
  });

  it("returns 4 candidates with confidences between 0 and 1", () => {
    const turn = decideTurn([]);
    expect(turn.candidates).toHaveLength(4);
    for (const c of turn.candidates) {
      expect(c.confidence).toBeGreaterThanOrEqual(0);
      expect(c.confidence).toBeLessThanOrEqual(1);
    }
  });
});
