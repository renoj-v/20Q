"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ThinkingIndicator } from "@/components/game/TurnStage";
import type { Answer } from "@/game/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { AnswerInteractionProps } from "./types";

/*
 * Version G — Reactions. Answering as a feeling: react to the question the
 * way you'd react to a message. The chosen emoji pops and bursts.
 */

const OPTIONS: Record<"question" | "guess", { answer: Answer; emoji: string; label: string; key: string }[]> = {
  question: [
    { answer: "yes", emoji: "👍", label: "Yes", key: "Y" },
    { answer: "no", emoji: "👎", label: "No", key: "N" },
    { answer: "sometimes", emoji: "🤏", label: "Sometimes", key: "S" },
    { answer: "unsure", emoji: "🤷", label: "Unsure", key: "U" },
  ],
  guess: [
    { answer: "yes", emoji: "🎉", label: "That's it!", key: "Y" },
    { answer: "no", emoji: "👎", label: "Nope", key: "N" },
  ],
};

const BURST = 8;

export function Reactions(props: AnswerInteractionProps) {
  return <ReactionBar key={props.turn?.id ?? "thinking"} {...props} />;
}

function ReactionBar({ turn, disabled, onAnswer }: AnswerInteractionProps) {
  const isGuess = turn?.ai.kind === "guess";
  const options = OPTIONS[isGuess ? "guess" : "question"];
  const reduceMotion = useReducedMotion();
  const [fired, setFired] = useState<Answer | null>(null);
  const active = !!turn && !disabled && fired === null;

  function react(answer: Answer) {
    if (!active || !options.some((o) => o.answer === answer)) return;
    setFired(answer);
    setTimeout(() => onAnswer(answer), reduceMotion ? 0 : 500);
  }

  useKeyboardShortcuts(
    { y: () => react("yes"), n: () => react("no"), s: () => react("sometimes"), u: () => react("unsure") },
    active,
  );

  return (
    <div className="space-y-10">
      <div className="grid min-h-24 place-items-center text-center">
        {turn ? (
          <p className={`text-2xl font-semibold text-balance sm:text-3xl ${isGuess ? "text-guess" : ""}`}>{turn.ai.text}</p>
        ) : (
          <ThinkingIndicator state="thinking" />
        )}
      </div>

      <div
        role="group"
        aria-label={isGuess ? "Is the guess right?" : "Your answer"}
        className="mx-auto flex w-fit gap-1 rounded-pill border border-border bg-surface-raised p-2 shadow-md sm:gap-3"
      >
        {options.map((o) => {
          const isFired = fired === o.answer;
          return (
            <div key={o.answer} className="relative flex flex-col items-center gap-1">
              <motion.button
                type="button"
                aria-label={o.label}
                aria-keyshortcuts={o.key}
                aria-disabled={!active && !isFired}
                aria-pressed={isFired}
                onClick={() => react(o.answer)}
                whileHover={active ? { scale: 1.25, rotate: [0, -8, 8, 0] } : undefined}
                whileTap={active ? { scale: 0.9 } : undefined}
                animate={isFired ? { scale: [1, 1.6, 1.3] } : fired ? { opacity: 0.3, scale: 0.85 } : { opacity: 1, scale: 1 }}
                // Keyframes (pop, wobble) need a tween; springs only take two frames.
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid size-16 place-items-center rounded-full text-4xl aria-disabled:cursor-not-allowed sm:size-18"
              >
                <span aria-hidden>{o.emoji}</span>
              </motion.button>
              <span aria-hidden className={`text-xs ${isFired ? "font-semibold text-fg" : "text-fg-muted"}`}>
                {o.label}
              </span>
              <AnimatePresence>
                {isFired && !reduceMotion && <Burst emoji={o.emoji} />}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Burst({ emoji }: { emoji: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute top-8 left-1/2">
      {Array.from({ length: BURST }, (_, i) => {
        const angle = (i / BURST) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: Math.cos(angle) * 60, y: Math.sin(angle) * 60, opacity: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </span>
  );
}
