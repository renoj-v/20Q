import { QUESTION_CAP } from "@/game/rules";
import type { Mode } from "@/game/types";

type HeaderProps = {
  mode: Mode;
  counted: number | null;
  onOpenLive(): void;
};

export function Header({ mode, counted, onOpenLive }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <h1 className="text-xl font-bold tracking-tight">20Q</h1>
      <ModeBadge mode={mode} />
      <button type="button" onClick={onOpenLive} className="text-sm text-accent underline-offset-4 hover:underline">
        {mode === "demo" ? "Play with live AI" : "Live settings"}
      </button>
      {counted !== null && <QuestionCounter counted={counted} />}
    </header>
  );
}

/** FR-31: persistent mode badge. */
export function ModeBadge({ mode }: { mode: Mode }) {
  return (
    <span
      data-mode={mode}
      className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${mode === "live" ? "bg-accent text-accent-fg" : "bg-surface-sunken text-fg-muted"}`}
    >
      {mode === "live" ? "Live: Claude" : "Demo AI"}
    </span>
  );
}

/** FR-3: counted questions used out of 20. */
export function QuestionCounter({ counted }: { counted: number }) {
  return (
    <div className="ml-auto flex items-center gap-2 text-sm">
      <span className="tabular-nums">
        <span className="font-semibold">{counted}</span>
        <span className="text-fg-muted"> / {QUESTION_CAP}</span>
        <span className="sr-only"> questions used</span>
      </span>
      <progress
        value={counted}
        max={QUESTION_CAP}
        aria-hidden
        className="h-1.5 w-20 overflow-hidden rounded-pill [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-surface-sunken [&::-webkit-progress-value]:bg-accent"
      />
    </div>
  );
}
