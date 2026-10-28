import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { duration, ease } from "@/design/motion";
import { countedQuestions, topCandidate } from "@/game/rules";
import type { EndReason, Turn } from "@/game/types";
import { ConfidenceChart } from "./ConfidenceChart";

type EndScreenProps = {
  won: boolean;
  endReason: EndReason;
  turns: Turn[];
  reveal: string | null;
  onReveal(text: string): void;
  onPlayAgain(): void;
};

/** FR-16–20. */
export function EndScreen({ won, endReason, turns, reveal, onReveal, onPlayAgain }: EndScreenProps) {
  const last = turns.at(-1);
  const used = countedQuestions(turns);
  const closest = closestGuess(turns);

  const heading = won
    ? `Got it in ${used}!`
    : endReason === "conceded"
      ? "I give up!"
      : "You stumped me!";
  const detail = won
    ? `It was ${last?.ai.text.replace(/^Is it /, "").replace(/\?$/, "")}.`
    : endReason === "conceded"
      ? last?.ai.text
      : "That's all 20 questions.";

  return (
    <motion.section
      aria-labelledby="end-heading"
      data-result={won ? "won" : "lost"}
      className="space-y-6 rounded-card border border-border bg-surface p-5 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, ease: ease.out }}
    >
      <div className="space-y-1">
        <h2 id="end-heading" className="text-3xl font-semibold">
          {heading}
        </h2>
        <p className="text-fg-muted">{detail}</p>
      </div>

      {!won && (reveal ? <RevealContrast closest={closest} reveal={reveal} /> : <RevealForm onReveal={onReveal} />)}

      <ConfidenceChart turns={turns} />

      <Button variant="primary" onClick={onPlayAgain} className="w-full sm:w-auto">
        Play again
      </Button>
    </motion.section>
  );
}

/** The AI's best idea at the end: its top candidate on the last turn. */
function closestGuess(turns: Turn[]): string | null {
  const scored = turns.filter((t) => t.ai.candidates.length > 0);
  const last = scored.at(-1);
  return last ? (topCandidate(last)?.label ?? null) : null;
}

/** FR-17: optional, skippable reveal. */
function RevealForm({ onReveal }: { onReveal(text: string): void }) {
  const [value, setValue] = useState("");
  const [skipped, setSkipped] = useState(false);
  if (skipped) return null;

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onReveal(value);
      }}
    >
      <label htmlFor="reveal" className="block text-sm font-medium">
        What were you thinking of? <span className="font-normal text-fg-muted">(optional)</span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="reveal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={80}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-control border border-border-strong bg-surface px-3"
        />
        <Button type="submit" variant="secondary" disabled={!value.trim()}>
          Reveal
        </Button>
        <Button variant="ghost" onClick={() => setSkipped(true)}>
          Skip
        </Button>
      </div>
    </form>
  );
}

/** FR-19: the AI's closest guess next to the real answer. */
function RevealContrast({ closest, reveal }: { closest: string | null; reveal: string }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      <div className="rounded-control bg-surface-sunken p-3">
        <dt className="text-xs uppercase tracking-wide text-fg-muted">My closest guess</dt>
        <dd className="mt-1 text-lg font-medium">{closest ?? "No idea!"}</dd>
      </div>
      <div className="rounded-control bg-accent-soft p-3">
        <dt className="text-xs uppercase tracking-wide text-fg-muted">You were thinking of</dt>
        <dd className="mt-1 text-lg font-medium">{reveal}</dd>
      </div>
    </dl>
  );
}
