import type { ComponentType } from "react";
import type { Answer, AnsweredTurn, Turn } from "@/game/types";

/**
 * Shared contract for answer interactions. Anything that implements it can
 * replace AnswerControls in the game.
 */
export type AnswerInteractionProps = {
  /** The question or guess awaiting an answer; null while the AI is thinking. */
  turn: Turn | null;
  history: AnsweredTurn[];
  disabled: boolean;
  onAnswer(answer: Answer): void;
};

export type AnswerInteraction = {
  id: string;
  name: string;
  /** One line on the idea behind it, shown on the test page. */
  idea: string;
  Component: ComponentType<AnswerInteractionProps>;
};
