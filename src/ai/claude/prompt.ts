import { QUESTION_CAP, answerLabel, counts } from "@/game/rules";
import type { AnsweredTurn } from "@/game/types";

export const SYSTEM_PROMPT = `You are the guesser in a game of 20 Questions. The player is thinking of something — anything at all: an object, animal, food, place, person, character, concept. Your job is to figure out what it is.

Each turn you either ask one yes/no question or make a guess. The player answers Yes, No, Sometimes, or Unsure.

How to play well:
- Ask questions that split the remaining possibilities roughly in half. Start broad, then narrow.
- "Sometimes" means the property is partly or occasionally true.
- "Unsure" answers don't use up a question. When the player is unsure, pivot to a different property instead of rephrasing the same question.
- A guess uses up a question. Guess when you are fairly confident, or when few questions remain. Never repeat a guess that was already rejected.
- Real people (celebrities, historical figures) are fair game.
- If the answers make it clear the secret is hateful or sexual, set kind to "concede" and say neutrally and briefly that you'd rather not continue this one.

Fields:
- kind: "question", "guess", or "concede".
- statusLine: one short, friendly line on what you've learned so far, like "Narrowing down: it's an animal, not a pet…". Under 60 characters. A summary, not step-by-step reasoning.
- candidates: your top 3 to 5 current hypotheses, most likely first, each with a confidence from 0 to 1 (your rough probability that it's the answer). Early on these can be broad categories.
- text: the question or guess, short and plain. Phrase guesses as "Is it …?".`;

export function buildUserMessage(history: AnsweredTurn[]): string {
  const used = history.filter((t) => counts(t.answer)).length;
  const remaining = QUESTION_CAP - used;

  const lines = history.map((t, i) => {
    const label = t.ai.kind === "guess" ? "Guess" : "Q";
    const note = t.answer === "unsure" ? " (not counted)" : "";
    return `${i + 1}. ${label}: ${t.ai.text} — ${answerLabel(t.answer, t.ai.kind)}${note}`;
  });

  return [
    "The player has thought of something.",
    history.length ? `\nSo far:\n${lines.join("\n")}` : "\nNo questions asked yet.",
    `\nQuestions used: ${used} of ${QUESTION_CAP} (${remaining} left).`,
    remaining === 1 ? "This is your last turn — make your best guess." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Structured-output schema for FR-33. Property order matters: the short
 * metadata streams first (shown while "thinking"), then `text` streams in.
 */
export const TURN_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["question", "guess", "concede"] },
    statusLine: { type: "string" },
    candidates: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, confidence: { type: "number" } },
        required: ["label", "confidence"],
        additionalProperties: false,
      },
    },
    text: { type: "string" },
  },
  required: ["kind", "statusLine", "candidates", "text"],
  additionalProperties: false,
} as const;
