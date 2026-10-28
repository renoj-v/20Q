import { ITEMS } from "@/ai/demo/items";
import { Button } from "@/components/ui/Button";
import type { Mode } from "@/game/types";

/** FR-1: prompt to think of something, and a start action. */
export function IntroScreen({ mode, onStart }: { mode: Mode; onStart(): void }) {
  return (
    <section aria-labelledby="intro-heading" className="space-y-6 rounded-card border border-border bg-surface p-6 sm:p-8">
      <div className="space-y-2">
        <h2 id="intro-heading" className="text-3xl font-semibold text-balance sm:text-4xl">
          Think of anything.
        </h2>
        <p className="text-fg-muted">
          An animal, an object, a food — anything at all. I&apos;ll try to guess it in 20 questions.
          {mode === "demo" && ` (The demo AI knows about ${ITEMS.length} common things.)`}
        </p>
      </div>
      <Button variant="primary" onClick={onStart} autoFocus className="w-full sm:w-auto">
        I&apos;ve got one — start
      </Button>
    </section>
  );
}
