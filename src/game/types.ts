export type Answer = "yes" | "no" | "sometimes" | "unsure";

/** Answers allowed on a guess turn (FR-4): "Yes, that's it!" / "No". */
export type GuessAnswer = Extract<Answer, "yes" | "no">;

export type Candidate = { label: string; confidence: number };

/**
 * One AI turn — the LLM contract from PRD FR-33.
 * `concede` extends the PRD shape: the AI ends the game as a loss with a
 * message (demo set exhausted, FR-24; or declining a secret, FR-34).
 */
export type AiTurn = {
  kind: "question" | "guess" | "concede";
  text: string;
  statusLine: string;
  candidates: Candidate[];
};

export type Turn = {
  id: string;
  ai: AiTurn;
  /** null while waiting for the player. */
  answer: Answer | null;
};

export type AnsweredTurn = Turn & { answer: Answer };

export type AiErrorKind =
  | "network"
  | "invalid_key"
  | "no_credits"
  | "rate_limit"
  | "overloaded"
  | "malformed"
  | "unknown";

export type AiError = { kind: AiErrorKind; message: string };

/** FR-13 turn states. `idle` + an unanswered last turn = "settled". */
export type RequestState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "thinking"; partial: Partial<AiTurn> }
  | { status: "streaming"; partial: Partial<AiTurn> }
  | { status: "error"; error: AiError };

export type Phase = "intro" | "playing" | "won" | "lost";

export type EndReason = "guessed" | "out_of_questions" | "conceded";

export type GameState = {
  phase: Phase;
  turns: Turn[];
  request: RequestState;
  editsUsed: number;
  endReason: EndReason | null;
  /** FR-17: what the player was thinking of, if revealed after a loss. */
  reveal: string | null;
};

export type Mode = "demo" | "live";
