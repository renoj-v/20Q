"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { DemoAiPlayer } from "@/ai/demo/DemoAiPlayer";
import { ANSWER_INTERACTIONS } from "@/components/interactions";
import { Button, Kbd } from "@/components/ui/Button";
import { QUESTION_CAP, answerLabel, answeredTurns, countedQuestions, currentTurn } from "@/game/rules";
import { useGame } from "@/hooks/useGame";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/*
 * /test-interaction — compare answer interactions against the real demo AI.
 * The selected version lives in ?v= so a refresh or shared link keeps it.
 */

const listeners = new Set<() => void>();
const DEFAULT_ID = ANSWER_INTERACTIONS[0].id;

function readVersion(): string {
  const v = new URLSearchParams(window.location.search).get("v");
  return ANSWER_INTERACTIONS.some((i) => i.id === v) ? v! : DEFAULT_ID;
}

function setVersion(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("v", id);
  window.history.replaceState(null, "", url);
  listeners.forEach((l) => l());
}

function useVersion() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readVersion,
    () => DEFAULT_ID,
  );
}

export function InteractionTest() {
  const versionId = useVersion();
  const version = ANSWER_INTERACTIONS.find((i) => i.id === versionId) ?? ANSWER_INTERACTIONS[0];
  const player = useMemo(() => new DemoAiPlayer(), []);
  const { state, start, answer } = useGame(player);

  const turn = currentTurn(state.turns);
  const history = answeredTurns(state.turns);
  const settled = state.phase === "playing" && state.request.status === "idle" && turn !== null;
  const counted = countedQuestions(state.turns);
  const last = history.at(-1);

  useKeyboardShortcuts(
    Object.fromEntries(ANSWER_INTERACTIONS.map((v, i) => [String(i + 1), () => setVersion(v.id)])),
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 px-4 py-8">
      <header className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold">Test: answer interaction</h1>
          <Link href="/" className="text-sm text-fg-muted hover:text-fg">
            ← Game
          </Link>
        </div>

        <div role="group" aria-label="Interaction version" className="grid grid-cols-3 gap-1 rounded-control bg-surface-sunken p-1">
          {ANSWER_INTERACTIONS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === version.id}
              aria-keyshortcuts={String(i + 1)}
              onClick={() => setVersion(v.id)}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-[calc(var(--radius-control)-4px)] text-sm font-medium transition-colors ${
                v.id === version.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg"
              }`}
            >
              {String.fromCharCode(65 + i)} · {v.name}
              <Kbd>{i + 1}</Kbd>
            </button>
          ))}
        </div>
        <p className="text-sm text-fg-muted">{version.idea}</p>
      </header>

      <main className="flex-1">
        {state.phase === "intro" ? (
          <div className="grid min-h-80 place-items-center rounded-card border border-dashed border-border-strong p-6 text-center">
            <div className="space-y-4">
              <p className="text-fg-muted">Think of something from the demo set, then start.</p>
              <Button variant="primary" onClick={start}>
                Start a game
              </Button>
            </div>
          </div>
        ) : state.phase === "playing" ? (
          <section aria-label="Current question" className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-fg-muted uppercase">
              {turn?.ai.kind === "guess" ? "My guess" : `Question ${counted + 1} of ${QUESTION_CAP}`}
            </p>
            <version.Component turn={settled ? turn : null} history={history} disabled={!settled} onAnswer={answer} />
          </section>
        ) : (
          <div className="grid min-h-80 place-items-center rounded-card border border-border bg-surface p-6 text-center">
            <div className="space-y-4">
              <p className="text-2xl font-semibold">{state.phase === "won" ? `Got it in ${counted}!` : "You stumped me!"}</p>
              <Button variant="primary" onClick={start}>
                Play again
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-fg-muted">
        <span aria-live="polite">
          {last ? (
            <>
              Last answer: <span className="font-medium text-fg">{answerLabel(last.answer, last.ai.kind)}</span>
            </>
          ) : (
            "No answers yet"
          )}
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          Keys: <Kbd>Y</Kbd> <Kbd>N</Kbd> <Kbd>S</Kbd> <Kbd>U</Kbd> · switch <Kbd>1</Kbd>–<Kbd>3</Kbd>
        </span>
        {state.phase !== "intro" && (
          <Button variant="ghost" onClick={start}>
            Restart
          </Button>
        )}
      </footer>
    </div>
  );
}
