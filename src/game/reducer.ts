import { QUESTION_CAP, countedQuestions } from "./rules";
import type { AiError, AiTurn, Answer, GameState, RequestState, Turn } from "./types";

export type GameAction =
  | { type: "start" }
  | { type: "request/progress"; request: Extract<RequestState, { status: "thinking" | "streaming" }> }
  | { type: "request/done"; ai: AiTurn; id: string }
  | { type: "request/failed"; error: AiError }
  | { type: "retry" }
  | { type: "answer"; answer: Answer }
  | { type: "edit"; index: number; answer: Answer }
  | { type: "reveal"; text: string }
  | { type: "reset" };

export const initialGameState: GameState = {
  phase: "intro",
  turns: [],
  request: { status: "idle" },
  editsUsed: 0,
  endReason: null,
  reveal: null,
};

/**
 * Pure game reducer. Whenever the result has `request.status === "sending"`,
 * the caller is expected to ask the AiPlayer for the next turn.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "start":
      return { ...initialGameState, phase: "playing", request: { status: "sending" } };

    case "request/progress":
      if (state.phase !== "playing") return state;
      return { ...state, request: action.request };

    case "request/done": {
      if (state.phase !== "playing") return state;
      const turn: Turn = { id: action.id, ai: action.ai, answer: null };
      const turns = [...state.turns, turn];
      if (action.ai.kind === "concede") {
        return { ...state, turns, request: { status: "idle" }, phase: "lost", endReason: "conceded" };
      }
      return { ...state, turns, request: { status: "idle" } };
    }

    case "request/failed":
      if (state.phase !== "playing") return state;
      return { ...state, request: { status: "error", error: action.error } };

    case "retry":
      if (state.request.status !== "error") return state;
      return { ...state, request: { status: "sending" } };

    case "answer": {
      const last = state.turns.at(-1);
      if (state.phase !== "playing" || state.request.status !== "idle" || !last || last.answer !== null) {
        return state;
      }
      return applyAnswer(state, state.turns.length - 1, action.answer);
    }

    case "edit": {
      // FR-8/FR-9: rewind to the edited turn; later turns are discarded and refunded.
      const target = state.turns[action.index];
      if (!target || target.answer === null || state.phase === "intro") return state;
      const rewound = { ...state, phase: "playing" as const, endReason: null, reveal: null, editsUsed: state.editsUsed + 1 };
      return applyAnswer(rewound, action.index, action.answer);
    }

    case "reveal":
      if (state.phase !== "lost") return state;
      return { ...state, reveal: action.text.trim() || null };

    case "reset":
      return initialGameState;
  }
}

function applyAnswer(state: GameState, index: number, answer: Answer): GameState {
  const answered = { ...state.turns[index], answer };
  const turns = [...state.turns.slice(0, index), answered];

  if (answered.ai.kind === "guess" && answer === "yes") {
    return { ...state, turns, request: { status: "idle" }, phase: "won", endReason: "guessed" };
  }
  if (countedQuestions(turns) >= QUESTION_CAP) {
    return { ...state, turns, request: { status: "idle" }, phase: "lost", endReason: "out_of_questions" };
  }
  return { ...state, turns, request: { status: "sending" } };
}
