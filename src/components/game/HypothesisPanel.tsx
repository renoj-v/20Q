import { motion } from "motion/react";
import { spring } from "@/design/motion";
import type { VariantConfig } from "@/design/variants";
import type { Candidate } from "@/game/types";

type HypothesisPanelProps = {
  statusLine?: string;
  candidates?: Candidate[];
  mode: VariantConfig["hypothesis"];
};

/** FR-12: curated view of the AI's thinking — a status line and top candidates. */
export function HypothesisPanel({ statusLine, candidates = [], mode }: HypothesisPanelProps) {
  if (mode === "hidden") return null;
  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);

  return (
    <section aria-label="What the AI is thinking" className="space-y-3">
      <p className="min-h-5 text-sm text-fg-muted">{statusLine}</p>
      {mode === "always" && sorted.length > 0 && (
        <ul className="space-y-1.5">
          {sorted.map((c) => (
            <li key={c.label} className="grid grid-cols-[minmax(0,8rem)_1fr_3ch] items-center gap-3 text-sm">
              <span className="truncate">{c.label}</span>
              <span className="h-1.5 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
                <motion.span
                  className="block h-full rounded-pill bg-accent"
                  initial={false}
                  animate={{ width: `${Math.round(c.confidence * 100)}%` }}
                  transition={spring.gentle}
                />
              </span>
              <span className="text-right tabular-nums text-fg-muted">
                {Math.round(c.confidence * 100)}
                <span className="sr-only">% confident</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
