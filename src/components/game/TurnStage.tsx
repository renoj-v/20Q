import { AnimatePresence, motion } from "motion/react";
import { duration, ease } from "@/design/motion";
import type { VariantConfig } from "@/design/variants";
import type { AiTurn, Answer, RequestState, Turn } from "@/game/types";
import { AnswerControls } from "./AnswerControls";
import { ErrorNotice } from "./ErrorNotice";
import { HypothesisPanel } from "./HypothesisPanel";

export type StageState = "sending" | "thinking" | "slow" | "streaming" | "settled" | "error";

type TurnStageProps = {
  request: RequestState;
  /** The turn awaiting an answer, once settled. */
  turn: Turn | null;
  slow: boolean;
  questionNumber: number;
  variant: VariantConfig;
  onAnswer(answer: Answer): void;
  onRetry(): void;
};

export function stageState(request: RequestState, slow: boolean): StageState {
  if (request.status === "idle") return "settled";
  if (request.status === "thinking" && slow) return "slow";
  return request.status;
}

/**
 * The AI's current turn, moving through the FR-13 states. `data-state` and
 * `data-kind` are styling hooks for the Figma state specs.
 */
export function TurnStage({ request, turn, slow, questionNumber, variant, onAnswer, onRetry }: TurnStageProps) {
  const state = stageState(request, slow);
  const shown: Partial<AiTurn> =
    request.status === "thinking" || request.status === "streaming" ? request.partial : (turn?.ai ?? {});
  const kind = shown.kind ?? "question";
  const isGuess = kind === "guess";

  return (
    <section
      aria-label="Current question"
      data-state={state}
      data-kind={kind}
      className={`space-y-5 rounded-card border p-5 sm:p-6 ${isGuess ? "border-guess bg-guess-soft" : "border-border bg-surface"}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
        {isGuess ? "My guess" : `Question ${questionNumber}`}
      </p>

      <div className="min-h-16">
        <AnimatePresence mode="wait" initial={false}>
          {state === "sending" || state === "thinking" || state === "slow" ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
            >
              <ThinkingIndicator state={state} />
            </motion.div>
          ) : state === "error" && request.status === "error" ? (
            <ErrorNotice key="error" error={request.error} onRetry={onRetry} />
          ) : (
            <motion.p
              key="text"
              className={`text-2xl font-semibold leading-snug text-balance sm:text-3xl ${isGuess ? "text-guess" : ""}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.base, ease: ease.out }}
            >
              {shown.text}
              {state === "streaming" && <span aria-hidden className="ml-0.5 inline-block w-2 animate-pulse">▍</span>}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnswerControls kind={kind} disabled={state !== "settled" || !turn} onAnswer={onAnswer} />

      <HypothesisPanel statusLine={shown.statusLine} candidates={shown.candidates} mode={variant.hypothesis} />
    </section>
  );
}

const THINKING_LABEL: Record<"sending" | "thinking" | "slow", string> = {
  sending: "Sending…",
  thinking: "Thinking",
  slow: "Still thinking… hang tight",
};

export function ThinkingIndicator({ state }: { state: "sending" | "thinking" | "slow" }) {
  return (
    <div className="flex items-center gap-3 text-lg text-fg-muted" data-state={state}>
      <span aria-hidden className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="thinking-dot size-2 rounded-full bg-current"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>{THINKING_LABEL[state]}</span>
    </div>
  );
}
