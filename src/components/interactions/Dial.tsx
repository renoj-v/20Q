"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { ThinkingIndicator } from "@/components/game/TurnStage";
import { Button } from "@/components/ui/Button";
import { spring } from "@/design/motion";
import type { Answer } from "@/game/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { AnswerInteractionProps } from "./types";

/*
 * Version H — Dial. Answering as a deliberate setting: turn the knob to a
 * detent (No → Sometimes → Yes, with Unsure as the "off" position), then
 * lock it in. Two steps, like setting an oven.
 */

type Detent = { answer: Answer; label: string; deg: number };

const QUESTION_DETENTS: Detent[] = [
  { answer: "unsure", label: "Unsure", deg: -135 },
  { answer: "no", label: "No", deg: -45 },
  { answer: "sometimes", label: "Sometimes", deg: 45 },
  { answer: "yes", label: "Yes", deg: 135 },
];
const GUESS_DETENTS: Detent[] = [
  { answer: "no", label: "No", deg: -60 },
  { answer: "yes", label: "That's it!", deg: 60 },
];

const SIZE = 240;
const KNOB = 120;
const LABEL_RADIUS = 104;

export function Dial(props: AnswerInteractionProps) {
  return <Knob key={props.turn?.id ?? "thinking"} {...props} />;
}

function Knob({ turn, disabled, onAnswer }: AnswerInteractionProps) {
  const isGuess = turn?.ai.kind === "guess";
  const detents = isGuess ? GUESS_DETENTS : QUESTION_DETENTS;
  const reduceMotion = useReducedMotion();
  const angle = useMotionValue(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Detent | null>(null);
  const [locked, setLocked] = useState(false);
  const active = !!turn && !disabled && !locked;

  function turnTo(d: Detent) {
    setSelected(d);
    animate(angle, d.deg, reduceMotion ? { duration: 0 } : spring.snappy);
  }

  function lockIn(d = selected) {
    if (!active || !d) return;
    turnTo(d);
    setLocked(true);
    setTimeout(() => onAnswer(d.answer), reduceMotion ? 0 : 300);
  }

  function pointerAngle(e: React.PointerEvent) {
    const r = knobRef.current!.getBoundingClientRect();
    const deg = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    return Math.max(-150, Math.min(150, deg));
  }

  const nearest = (deg: number) => detents.reduce((a, b) => (Math.abs(b.deg - deg) < Math.abs(a.deg - deg) ? b : a));
  const step = (dir: 1 | -1) => {
    const i = selected ? detents.indexOf(selected) : dir === 1 ? -1 : detents.length;
    const next = detents[Math.min(detents.length - 1, Math.max(0, i + dir))];
    turnTo(next);
  };
  const byAnswer = (a: Answer) => {
    const d = detents.find((x) => x.answer === a);
    if (d) lockIn(d);
  };

  useKeyboardShortcuts(
    { y: () => byAnswer("yes"), n: () => byAnswer("no"), s: () => byAnswer("sometimes"), u: () => byAnswer("unsure") },
    active,
  );

  return (
    <div className="space-y-6">
      <div className="grid min-h-24 place-items-center text-center">
        {turn ? (
          <p className={`text-2xl font-semibold text-balance sm:text-3xl ${isGuess ? "text-guess" : ""}`}>{turn.ai.text}</p>
        ) : (
          <ThinkingIndicator state="thinking" />
        )}
      </div>

      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        {detents.map((d) => {
          const rad = (d.deg * Math.PI) / 180;
          return (
            <button
              key={d.answer}
              type="button"
              aria-disabled={!active}
              onClick={() => active && turnTo(d)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded px-1 text-sm whitespace-nowrap aria-disabled:cursor-not-allowed ${
                selected === d ? "font-semibold text-accent" : "text-fg-muted hover:text-fg"
              }`}
              style={{ left: SIZE / 2 + Math.sin(rad) * LABEL_RADIUS, top: SIZE / 2 - Math.cos(rad) * LABEL_RADIUS }}
            >
              {d.label}
            </button>
          );
        })}

        <div
          ref={knobRef}
          role="slider"
          tabIndex={active ? 0 : -1}
          aria-label="Answer dial"
          aria-valuemin={0}
          aria-valuemax={detents.length - 1}
          aria-valuenow={selected ? detents.indexOf(selected) : undefined}
          aria-valuetext={selected?.label ?? "Not set"}
          aria-disabled={!active}
          onPointerDown={(e) => {
            if (!active) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            angle.set(pointerAngle(e));
          }}
          onPointerMove={(e) => active && e.currentTarget.hasPointerCapture(e.pointerId) && angle.set(pointerAngle(e))}
          onPointerUp={() => active && turnTo(nearest(angle.get()))}
          onKeyDown={(e) => {
            if (!active) return;
            const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key] as 1 | -1 | undefined;
            if (dir) {
              e.preventDefault();
              step(dir);
            }
            if (e.key === "Enter") lockIn();
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full aria-disabled:opacity-60"
          style={{ width: KNOB, height: KNOB }}
        >
          <motion.div
            style={{ rotate: angle }}
            className={`size-full rounded-full border-4 bg-surface-raised shadow-lg ${locked ? "border-success" : "border-border-strong"} ${
              active ? "cursor-grab active:cursor-grabbing" : ""
            }`}
          >
            <span className="absolute top-2 left-1/2 h-6 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
          </motion.div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="primary" aria-disabled={!active || !selected} onClick={() => lockIn()}>
          {locked ? "Locked in ✓" : selected ? `Lock in “${selected.label}”` : "Turn the dial"}
        </Button>
      </div>
    </div>
  );
}
