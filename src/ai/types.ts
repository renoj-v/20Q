import type { AiError, AiTurn, AnsweredTurn, Mode } from "@/game/types";

export type TurnProgress = {
  /** First response bytes arrived — the AI is working on its turn. */
  onThinking(partial: Partial<AiTurn>): void;
  /** The question/guess text has started streaming in. */
  onStreaming(partial: Partial<AiTurn>): void;
};

/**
 * Single interface for both AI modes so the UI is mode-agnostic (PRD §7).
 * `history` is the full list of answered turns — after a rewind it is already
 * truncated, so implementations must not keep their own conversation state (FR-35).
 */
export interface AiPlayer {
  readonly mode: Mode;
  nextTurn(history: AnsweredTurn[], progress: TurnProgress, signal: AbortSignal): Promise<AiTurn>;
}

export class AiPlayerError extends Error {
  constructor(readonly error: AiError) {
    super(error.message);
    this.name = "AiPlayerError";
  }
}

export function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === "AbortError" || e.name === "APIUserAbortError");
}

/** Resolves after `ms`, rejecting with an AbortError if `signal` fires first. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const id = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
