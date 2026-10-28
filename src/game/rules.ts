import type { Answer, AnsweredTurn, Turn } from "./types";

export const QUESTION_CAP = 20;

/** Unsure answers don't count toward the cap; everything else does (PRD §4). */
export function counts(answer: Answer | null): boolean {
  return answer !== null && answer !== "unsure";
}

export function countedQuestions(turns: Turn[]): number {
  return turns.filter((t) => counts(t.answer)).length;
}

export function questionsRemaining(turns: Turn[]): number {
  return QUESTION_CAP - countedQuestions(turns);
}

export function answeredTurns(turns: Turn[]): AnsweredTurn[] {
  return turns.filter((t): t is AnsweredTurn => t.answer !== null);
}

/** The turn waiting for the player's answer, if any. */
export function currentTurn(turns: Turn[]): Turn | null {
  const last = turns.at(-1);
  return last && last.answer === null ? last : null;
}

/** FR-10: how many log entries a rewind to `index` erases. */
export function turnsErasedByEdit(turns: Turn[], index: number): number {
  return turns.length - 1 - index;
}

export function answerLabel(answer: Answer, kind: "question" | "guess" | "concede"): string {
  if (kind === "guess") return answer === "yes" ? "Yes, that's it!" : "No";
  return { yes: "Yes", no: "No", sometimes: "Sometimes", unsure: "Unsure" }[answer];
}

/** Highest-confidence candidate on a turn. */
export function topCandidate(turn: Turn) {
  return [...turn.ai.candidates].sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}
