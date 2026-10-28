"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { AiPlayerError, isAbortError, type AiPlayer } from "@/ai/types";
import { gameReducer, initialGameState, type GameAction } from "@/game/reducer";
import { answeredTurns, countedQuestions } from "@/game/rules";
import type { Answer, GameState, Turn } from "@/game/types";
import { track } from "@/lib/analytics";

let turnCounter = 0;

/**
 * Drives the game: owns the reducer state and talks to the AiPlayer whenever
 * the reducer asks for a new AI turn (request.status === "sending").
 */
export function useGame(player: AiPlayer) {
  const [state, rawDispatch] = useReducer(gameReducer, initialGameState);
  const stateRef = useRef(state);
  const abortRef = useRef<AbortController | null>(null);

  const requestTurn = useCallback(
    async (turns: Turn[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const dispatch = (action: GameAction) => {
        if (!controller.signal.aborted) rawDispatch(action);
      };

      try {
        const ai = await player.nextTurn(
          answeredTurns(turns),
          {
            onThinking: (partial) => dispatch({ type: "request/progress", request: { status: "thinking", partial } }),
            onStreaming: (partial) => dispatch({ type: "request/progress", request: { status: "streaming", partial } }),
          },
          controller.signal,
        );
        dispatch({ type: "request/done", ai, id: `t${++turnCounter}` });
      } catch (e) {
        if (isAbortError(e)) return;
        const error =
          e instanceof AiPlayerError ? e.error : { kind: "unknown" as const, message: "Something went wrong. Retry?" };
        dispatch({ type: "request/failed", error });
      }
    },
    [player],
  );

  /** Applies an action and, if the reducer asks for one, fetches the next AI turn. */
  const dispatch = useCallback(
    (action: GameAction) => {
      const next = gameReducer(stateRef.current, action);
      stateRef.current = next;
      rawDispatch(action);
      if (next.request.status === "sending") void requestTurn(next.turns);
      else if (next.phase !== "playing") abortRef.current?.abort();
    },
    [requestTurn],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Abort any in-flight request on unmount or when the player (mode) changes.
  useEffect(() => () => abortRef.current?.abort(), [player]);

  useAnalytics(state, player.mode);

  return {
    state,
    start: useCallback(() => dispatch({ type: "start" }), [dispatch]),
    answer: useCallback((answer: Answer) => dispatch({ type: "answer", answer }), [dispatch]),
    edit: useCallback((index: number, answer: Answer) => dispatch({ type: "edit", index, answer }), [dispatch]),
    retry: useCallback(() => dispatch({ type: "retry" }), [dispatch]),
    reveal: useCallback((text: string) => dispatch({ type: "reveal", text }), [dispatch]),
    reset: useCallback(() => dispatch({ type: "reset" }), [dispatch]),
  };
}

function useAnalytics(state: GameState, mode: AiPlayer["mode"]) {
  const lastPhase = useRef(state.phase);
  useEffect(() => {
    const prev = lastPhase.current;
    lastPhase.current = state.phase;
    if (prev === state.phase) return;
    if (prev === "intro" && state.phase === "playing") track("game_started", { mode });
    if (state.phase === "won" || state.phase === "lost") {
      track("game_ended", {
        mode,
        result: state.phase === "won" ? "win" : "loss",
        questions: countedQuestions(state.turns),
        edits: state.editsUsed,
      });
    }
  }, [state.phase, state.turns, state.editsUsed, mode]);
}
