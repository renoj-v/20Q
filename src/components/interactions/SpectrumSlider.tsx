"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { ThinkingIndicator } from "@/components/game/TurnStage";
import { spring } from "@/design/motion";
import type { Answer } from "@/game/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { AnswerInteractionProps } from "./types";

/*
 * Version B — Spectrum. Yes and No are two ends of a scale, with Sometimes
 * honestly in the middle. Drag the knob to a stop, or tap a stop.
 * Unsure sits off the scale: it's a skip, not an answer.
 */

type Stop = { answer: Answer; label: string; pos: -1 | 0 | 1; key: string };

const QUESTION_STOPS: Stop[] = [
  { answer: "no", label: "No", pos: -1, key: "N" },
  { answer: "sometimes", label: "Sometimes", pos: 0, key: "S" },
  { answer: "yes", label: "Yes", pos: 1, key: "Y" },
];
const GUESS_STOPS: Stop[] = [
  { answer: "no", label: "No", pos: -1, key: "N" },
  { answer: "yes", label: "That's it!", pos: 1, key: "Y" },
];

const KNOB = 44;

export function SpectrumSlider(props: AnswerInteractionProps) {
  return <Spectrum key={props.turn?.id ?? "thinking"} {...props} />;
}

function Spectrum({ turn, disabled, onAnswer }: AnswerInteractionProps) {
  const isGuess = turn?.ai.kind === "guess";
  const stops = isGuess ? GUESS_STOPS : QUESTION_STOPS;
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState<Answer | null>(null);
  const x = useMotionValue(0);
  const active = !!turn && !disabled && chosen === null;

  const halfWidth = () => ((trackRef.current?.getBoundingClientRect().width ?? 0) - KNOB) / 2;
  // Two tinted layers fade in as the knob moves toward either end.
  const yesTint = useTransform(x, (v) => Math.max(0, v / Math.max(1, halfWidth())));
  const noTint = useTransform(x, (v) => Math.max(0, -v / Math.max(1, halfWidth())));

  async function commit(answer: Answer) {
    const stop = stops.find((s) => s.answer === answer);
    if (!active || (!stop && answer !== "unsure")) return;
    setChosen(answer);
    if (stop) await animate(x, stop.pos * halfWidth(), reduceMotion ? { duration: 0 } : spring.snappy);
    await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 220));
    onAnswer(answer);
  }

  useKeyboardShortcuts(
    { y: () => commit("yes"), n: () => commit("no"), s: () => commit("sometimes"), u: () => commit("unsure") },
    active,
  );

  return (
    <div className="space-y-8">
      <div className="grid min-h-24 place-items-center text-center">
        {turn ? (
          <p className={`text-2xl font-semibold text-balance sm:text-3xl ${isGuess ? "text-guess" : ""}`}>{turn.ai.text}</p>
        ) : (
          <ThinkingIndicator state="thinking" />
        )}
      </div>

      <div className="space-y-3">
        <div ref={trackRef} className="relative flex h-14 items-center justify-center overflow-hidden rounded-pill bg-surface-sunken">
          <motion.span aria-hidden style={{ opacity: yesTint }} className="absolute inset-0 bg-success-soft" />
          <motion.span aria-hidden style={{ opacity: noTint }} className="absolute inset-0 bg-danger-soft" />
          {stops.map((s) => (
            <span
              key={s.answer}
              aria-hidden
              className="absolute size-2 rounded-full bg-border-strong"
              style={{ left: `calc(${KNOB / 2}px + (100% - ${KNOB}px) * ${(s.pos + 1) / 2} - 4px)` }}
            />
          ))}
          <motion.div
            aria-hidden
            drag={active ? "x" : false}
            dragConstraints={trackRef}
            dragElastic={0.05}
            dragMomentum={false}
            style={{ x, width: KNOB, height: KNOB }}
            whileDrag={{ scale: 1.1 }}
            onDragEnd={() => {
              const frac = x.get() / Math.max(1, halfWidth());
              const nearest = stops.reduce((a, b) => (Math.abs(b.pos - frac) < Math.abs(a.pos - frac) ? b : a));
              // Releasing where you started isn't an answer.
              if (Math.abs(x.get()) < 12 && nearest.pos === 0) return;
              if (Math.abs(nearest.pos - frac) > 0.35) return void animate(x, 0, spring.snappy);
              void commit(nearest.answer);
            }}
            className={`relative z-10 rounded-full border-2 border-accent bg-surface shadow-md ${active ? "cursor-grab active:cursor-grabbing" : "opacity-60"}`}
          />
        </div>

        <div role="group" aria-label={isGuess ? "Is the guess right?" : "Your answer"} className="flex justify-between">
          {stops.map((s) => (
            <button
              key={s.answer}
              type="button"
              aria-disabled={!active}
              aria-keyshortcuts={s.key}
              aria-pressed={chosen === s.answer}
              onClick={() => commit(s.answer)}
              className={`min-h-11 rounded-control px-3 text-sm font-medium transition-colors aria-disabled:cursor-not-allowed ${
                chosen === s.answer ? "bg-accent text-accent-fg" : "text-fg-muted hover:bg-surface-sunken hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!isGuess && (
        <div className="text-center">
          <button
            type="button"
            aria-disabled={!active}
            aria-keyshortcuts="U"
            onClick={() => commit("unsure")}
            className="min-h-11 rounded-control px-3 text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline aria-disabled:cursor-not-allowed"
          >
            Not sure — skip this one <span className="text-fg-subtle">(doesn&apos;t count)</span>
          </button>
        </div>
      )}
    </div>
  );
}
