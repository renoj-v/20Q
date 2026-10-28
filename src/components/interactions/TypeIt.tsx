"use client";

import { motion, useAnimate } from "motion/react";
import { useState } from "react";
import { answerLabel } from "@/game/rules";
import type { Answer } from "@/game/types";
import { ALL_ANSWERS, parseAnswer } from "./parseAnswer";
import type { AnswerInteractionProps } from "./types";

/*
 * Version F — Type. Answering in your own words, terminal-style.
 * "yep", "nah", "kinda", "no idea" all work; a live hint shows how your
 * words will be read before you hit Enter.
 */

export function TypeIt({ turn, history, disabled, onAnswer }: AnswerInteractionProps) {
  const recent = history.slice(-4);
  return (
    <div className="space-y-1 rounded-card bg-fg p-4 font-mono text-sm text-bg sm:p-5">
      <div aria-label="Transcript" className="min-h-40 space-y-1">
        {recent.map((t) => (
          <div key={t.id} className="opacity-60">
            <p>
              <span className="text-accent-soft">ai&gt;</span> {t.ai.text}
            </p>
            <p className="pl-4">→ {answerLabel(t.answer, t.ai.kind)}</p>
          </div>
        ))}
        <p>
          <span className="text-accent-soft">ai&gt;</span>{" "}
          {turn ? (
            <span className={turn.ai.kind === "guess" ? "font-bold" : ""}>{turn.ai.text}</span>
          ) : (
            <span className="opacity-60">thinking…</span>
          )}
        </p>
      </div>
      {/* Remount per turn so the field clears and refocuses. */}
      <Prompt key={turn?.id ?? "thinking"} turn={turn} disabled={disabled} onAnswer={onAnswer} />
    </div>
  );
}

function Prompt({ turn, disabled, onAnswer }: Pick<AnswerInteractionProps, "turn" | "disabled" | "onAnswer">) {
  const isGuess = turn?.ai.kind === "guess";
  const allowed: Answer[] = isGuess ? ["yes", "no"] : ALL_ANSWERS;
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scope, animate] = useAnimate();
  const active = !!turn && !disabled;
  const parsed = parseAnswer(value, allowed);

  function submit() {
    if (!active) return;
    if (parsed) return onAnswer(parsed);
    setError(isGuess ? "try: yes / no" : "try: yes / no / sometimes / not sure");
    animate(scope.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.3 });
  }

  return (
    <form
      ref={scope}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-1 pt-2"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-success-soft">you&gt;</span>
        <label htmlFor="type-answer" className="sr-only">
          Type your answer
        </label>
        <input
          id="type-answer"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          disabled={!active}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder={active ? (isGuess ? "yes or no" : "yep, nope, kinda, no idea…") : ""}
          className="min-w-0 flex-1 bg-transparent text-bg caret-current outline-none placeholder:text-bg/40"
        />
        {parsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0 rounded bg-bg/15 px-1.5">
            = {answerLabel(parsed, isGuess ? "guess" : "question")} ⏎
          </motion.span>
        )}
      </div>
      <p aria-live="polite" className="min-h-5 pl-12 text-danger-soft">
        {error}
      </p>
    </form>
  );
}
