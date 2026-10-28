"use client";

import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ThinkingIndicator } from "@/components/game/TurnStage";
import type { Answer } from "@/game/types";
import type { AnswerInteractionProps } from "./types";

/*
 * Version D — Hold. Answering as commitment: press and hold an answer until
 * it fills. Letting go early cancels, so there are no accidental taps.
 * Holding Y / N / S / U (or Space on a focused button) works the same way.
 */

const HOLD_MS = 650;

const OPTIONS: Record<"question" | "guess", { answer: Answer; label: string; key: string; color: string }[]> = {
  question: [
    { answer: "yes", label: "Yes", key: "Y", color: "bg-answer-yes" },
    { answer: "no", label: "No", key: "N", color: "bg-answer-no" },
    { answer: "sometimes", label: "Sometimes", key: "S", color: "bg-answer-sometimes" },
    { answer: "unsure", label: "Unsure", key: "U", color: "bg-answer-unsure" },
  ],
  guess: [
    { answer: "yes", label: "Yes, that's it!", key: "Y", color: "bg-answer-yes" },
    { answer: "no", label: "No", key: "N", color: "bg-answer-no" },
  ],
};

export function HoldToAnswer(props: AnswerInteractionProps) {
  return <Hold key={props.turn?.id ?? "thinking"} {...props} />;
}

function Hold({ turn, disabled, onAnswer }: AnswerInteractionProps) {
  const isGuess = turn?.ai.kind === "guess";
  const options = OPTIONS[isGuess ? "guess" : "question"];
  const [holding, setHolding] = useState<Answer | null>(null);
  const [done, setDone] = useState<Answer | null>(null);
  const active = !!turn && !disabled && done === null;

  // Letter keys: hold to answer, release to cancel.
  useEffect(() => {
    if (!active) return;
    const keyMap = Object.fromEntries(options.map((o) => [o.key.toLowerCase(), o.answer]));
    const down = (e: KeyboardEvent) => {
      const a = keyMap[e.key.toLowerCase()];
      if (!a || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setHolding(a);
    };
    const up = (e: KeyboardEvent) => keyMap[e.key.toLowerCase()] && setHolding(null);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [active, options]);

  function complete(answer: Answer) {
    setDone(answer);
    setHolding(null);
    setTimeout(() => onAnswer(answer), 200);
  }

  return (
    <div className="space-y-8">
      <div className="grid min-h-24 place-items-center text-center">
        {turn ? (
          <p className={`text-2xl font-semibold text-balance sm:text-3xl ${isGuess ? "text-guess" : ""}`}>{turn.ai.text}</p>
        ) : (
          <ThinkingIndicator state="thinking" />
        )}
      </div>

      <div role="group" aria-label={isGuess ? "Is the guess right?" : "Your answer"} className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <HoldButton
            key={o.answer}
            label={o.label}
            shortcut={o.key}
            color={o.color}
            active={active}
            holding={holding === o.answer}
            done={done === o.answer}
            onHold={(on) => active && setHolding(on ? o.answer : null)}
            onComplete={() => complete(o.answer)}
          />
        ))}
      </div>
      <p className="text-center text-sm text-fg-muted">Press and hold to answer</p>
    </div>
  );
}

type HoldButtonProps = {
  label: string;
  shortcut: string;
  color: string;
  active: boolean;
  holding: boolean;
  done: boolean;
  onHold(on: boolean): void;
  onComplete(): void;
};

function HoldButton({ label, shortcut, color, active, holding, done, onHold, onComplete }: HoldButtonProps) {
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });

  useEffect(() => {
    controls.current?.stop();
    if (done) {
      progress.set(1);
    } else if (holding) {
      controls.current = animate(progress, 1, {
        duration: (HOLD_MS / 1000) * (1 - progress.get()),
        ease: "linear",
        onComplete: () => completeRef.current(),
      });
    } else {
      controls.current = animate(progress, 0, { duration: 0.2 });
    }
  }, [holding, done, progress]);

  return (
    <button
      type="button"
      aria-disabled={!active}
      aria-keyshortcuts={shortcut}
      aria-pressed={done}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          onHold(true);
        }
      }}
      onKeyUp={(e) => (e.key === " " || e.key === "Enter") && onHold(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-20 touch-none overflow-hidden rounded-card border border-border-strong bg-surface text-lg font-semibold select-none aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
    >
      <motion.span aria-hidden style={{ scaleX: progress }} className={`absolute inset-0 origin-left opacity-25 ${color}`} />
      <span className="relative">
        {done ? "✓ " : ""}
        {label}
      </span>
    </button>
  );
}
