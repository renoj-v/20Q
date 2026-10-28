"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useState } from "react";
import { ThinkingIndicator } from "@/components/game/TurnStage";
import { Button } from "@/components/ui/Button";
import { spring } from "@/design/motion";
import type { Answer } from "@/game/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { AnswerInteractionProps } from "./types";

/*
 * Version A — Swipe. The question is a card you throw:
 * right = Yes, left = No, up = Sometimes, down = Unsure.
 * The d-pad underneath is the button and keyboard equivalent.
 */

const THRESHOLD = 110;
const EXIT: Record<Answer, [number, number]> = {
  yes: [600, 0],
  no: [-600, 0],
  sometimes: [0, -500],
  unsure: [0, 500],
};

export function SwipeCard(props: AnswerInteractionProps) {
  // Keyed by turn so each new question gets a fresh card at rest.
  return <Card key={props.turn?.id ?? "thinking"} {...props} />;
}

function Card({ turn, disabled, onAnswer }: AnswerInteractionProps) {
  const isGuess = turn?.ai.kind === "guess";
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-14, 14]);
  const active = !!turn && !disabled && !leaving;

  async function commit(answer: Answer) {
    if (!active || (isGuess && (answer === "sometimes" || answer === "unsure"))) return;
    setLeaving(true);
    const [tx, ty] = EXIT[answer];
    const transition = { duration: reduceMotion ? 0 : 0.25, ease: "easeIn" as const };
    await Promise.all([animate(x, tx, transition), animate(y, ty, transition)]);
    onAnswer(answer);
  }

  useKeyboardShortcuts(
    { y: () => commit("yes"), n: () => commit("no"), s: () => commit("sometimes"), u: () => commit("unsure") },
    active,
  );

  return (
    <div className="space-y-6">
      <div className="relative grid h-72 place-items-center">
        {/* Direction hints behind the card */}
        <Hint className="left-0" text="No" />
        <Hint className="right-0" text="Yes" />
        {!isGuess && <Hint className="top-0" text="Sometimes" />}
        {!isGuess && <Hint className="bottom-0" text="Unsure" />}

        <motion.div
          drag={active ? (isGuess ? "x" : true) : false}
          style={{ x, y, rotate }}
          onDragEnd={() => {
            const [dx, dy] = [x.get(), y.get()];
            if (dx > THRESHOLD) return commit("yes");
            if (dx < -THRESHOLD) return commit("no");
            if (!isGuess && dy < -THRESHOLD) return commit("sometimes");
            if (!isGuess && dy > THRESHOLD) return commit("unsure");
            animate(x, 0, spring.snappy);
            animate(y, 0, spring.snappy);
          }}
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileDrag={{ scale: 1.03 }}
          className={`relative z-10 grid h-60 w-[min(calc(100%-6rem),20rem)] touch-none place-items-center rounded-card border p-6 text-center shadow-lg select-none ${
            active ? "cursor-grab active:cursor-grabbing" : ""
          } ${isGuess ? "border-guess bg-guess-soft" : "border-border bg-surface-raised"}`}
        >
          {turn ? (
            <p className={`text-2xl font-semibold text-balance ${isGuess ? "text-guess" : ""}`}>{turn.ai.text}</p>
          ) : (
            <ThinkingIndicator state="thinking" />
          )}
          <Stamp value={x} range={[30, THRESHOLD]} text="Yes" className="top-4 left-4 -rotate-12 text-answer-yes" />
          <Stamp value={x} range={[-30, -THRESHOLD]} text="No" className="top-4 right-4 rotate-12 text-answer-no" />
          {!isGuess && (
            <>
              <Stamp value={y} range={[-30, -THRESHOLD]} text="Sometimes" className="bottom-4 text-answer-sometimes" />
              <Stamp value={y} range={[30, THRESHOLD]} text="Unsure" className="top-4 text-answer-unsure" />
            </>
          )}
        </motion.div>
      </div>

      <div role="group" aria-label={isGuess ? "Is the guess right?" : "Your answer"} className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {!isGuess && (
          <Button className="col-start-2" shortcut="S" aria-disabled={!active} onClick={() => commit("sometimes")}>
            ↑ Sometimes
          </Button>
        )}
        <Button className="col-start-1 row-start-2" shortcut="N" aria-disabled={!active} onClick={() => commit("no")}>
          ← No
        </Button>
        <Button className="col-start-3 row-start-2" shortcut="Y" aria-disabled={!active} onClick={() => commit("yes")}>
          {isGuess ? "Yes! →" : "Yes →"}
        </Button>
        {!isGuess && (
          <Button className="col-start-2 row-start-3" shortcut="U" aria-disabled={!active} onClick={() => commit("unsure")}>
            ↓ Unsure
          </Button>
        )}
      </div>
    </div>
  );
}

function Hint({ text, className }: { text: string; className: string }) {
  return (
    <span aria-hidden className={`absolute text-xs font-medium tracking-wide text-fg-subtle uppercase ${className}`}>
      {text}
    </span>
  );
}

/** A rubber stamp that fades in as the card is dragged toward its answer. */
function Stamp({ value, range, text, className }: { value: MotionValue<number>; range: [number, number]; text: string; className: string }) {
  const opacity = useTransform(value, range, [0, 1]);
  return (
    <motion.span
      aria-hidden
      style={{ opacity }}
      className={`absolute rounded-control border-2 border-current px-2 py-0.5 text-lg font-bold uppercase ${className}`}
    >
      {text}
    </motion.span>
  );
}
