"use client";

import { useMemo, useState } from "react";
import { DemoAiPlayer } from "@/ai/demo/DemoAiPlayer";
import { TurnStage } from "@/components/game/TurnStage";
import { timing } from "@/design/motion";
import { useVariant } from "@/design/variants";
import { currentTurn } from "@/game/rules";
import { useGame } from "@/hooks/useGame";
import { useSlowFlag } from "@/hooks/useSlowFlag";

/*
 * Study: thinking → streaming → settled. Tune the timings live; when a
 * combination feels right, copy the values into src/design/motion.ts.
 */
export function ThinkingStudy() {
  const [maxLatencyMs, setMaxLatencyMs] = useState<number>(timing.demoMaxLatencyMs);
  const [wordMs, setWordMs] = useState<number>(timing.demoStreamWordMs);
  const [slowMs, setSlowMs] = useState<number>(timing.slowThinkingMs);
  const { config: variant } = useVariant();

  const player = useMemo(() => new DemoAiPlayer({ maxLatencyMs, wordMs }), [maxLatencyMs, wordMs]);
  const game = useGame(player);
  const { state } = game;
  const turn = currentTurn(state.turns);
  const slow = useSlowFlag(state.request.status === "sending" || state.request.status === "thinking", slowMs);

  return (
    <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold">Thinking &amp; streaming</h1>
        <Slider label="Max fake latency" unit="ms" min={0} max={8000} step={100} value={maxLatencyMs} onChange={setMaxLatencyMs} />
        <Slider label="Per streamed word" unit="ms" min={0} max={300} step={10} value={wordMs} onChange={setWordMs} />
        <Slider label="Slow threshold" unit="ms" min={500} max={8000} step={250} value={slowMs} onChange={setSlowMs} />
        <pre className="overflow-x-auto rounded-control bg-surface-sunken p-3 font-mono text-xs">
          {`demoMaxLatencyMs: ${maxLatencyMs},\ndemoStreamWordMs: ${wordMs},\nslowThinkingMs: ${slowMs},`}
        </pre>
        <button type="button" className="text-sm text-accent underline" onClick={game.start}>
          Restart game
        </button>
      </div>

      <div className="space-y-3">
        {state.phase === "intro" ? (
          <button type="button" className="rounded-control bg-accent px-4 py-2 text-accent-fg" onClick={game.start}>
            Start
          </button>
        ) : (
          <TurnStage
            request={state.request}
            turn={turn}
            slow={slow}
            questionNumber={state.turns.length + 1}
            variant={variant}
            onAnswer={game.answer}
            onRetry={game.retry}
          />
        )}
        <p className="font-mono text-xs text-fg-subtle">state: {state.request.status}{slow ? " (slow)" : ""}</p>
      </div>
    </div>
  );
}

type SliderProps = {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange(value: number): void;
};

function Slider({ label, unit, min, max, step, value, onChange }: SliderProps) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-fg-muted">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}
