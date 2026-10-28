"use client";

import { useMemo, useState } from "react";
import { ClaudeAiPlayer } from "@/ai/claude/ClaudeAiPlayer";
import { setApiKey, useApiKey } from "@/ai/claude/keyStorage";
import { DemoAiPlayer } from "@/ai/demo/DemoAiPlayer";
import type { AiPlayer } from "@/ai/types";
import { useVariant } from "@/design/variants";
import { countedQuestions, currentTurn } from "@/game/rules";
import type { GameState } from "@/game/types";
import { useGame } from "@/hooks/useGame";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSlowFlag } from "@/hooks/useSlowFlag";
import { Announcer } from "./Announcer";
import { AnswerLog } from "./AnswerLog";
import { EndScreen } from "./EndScreen";
import { Header } from "./Header";
import { IntroScreen } from "./IntroScreen";
import { LivePanel } from "./LivePanel";
import { TurnStage } from "./TurnStage";
import { VariantSwitcher } from "./VariantSwitcher";

export function GameApp() {
  const apiKey = useApiKey();
  const [liveOpen, setLiveOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { id: variantId, config: variant } = useVariant();

  const player: AiPlayer = useMemo(() => (apiKey ? new ClaudeAiPlayer(apiKey) : new DemoAiPlayer()), [apiKey]);
  const game = useGame(player);
  const { state } = game;

  const turn = currentTurn(state.turns);
  const settled = state.phase === "playing" && state.request.status === "idle" && turn !== null;
  const slow = useSlowFlag(state.request.status === "sending" || state.request.status === "thinking");
  const counted = countedQuestions(state.turns);

  function switchPlayer(key: string | null) {
    setApiKey(key);
    setLiveOpen(false);
    setEditingIndex(null);
    game.reset();
  }

  const lastAnsweredIndex = state.turns.findLastIndex((t) => t.answer !== null);
  useKeyboardShortcuts(
    {
      y: () => settled && game.answer("yes"),
      n: () => settled && game.answer("no"),
      s: () => settled && turn?.ai.kind === "question" && game.answer("sometimes"),
      u: () => settled && turn?.ai.kind === "question" && game.answer("unsure"),
      e: () => lastAnsweredIndex >= 0 && setEditingIndex(lastAnsweredIndex),
    },
    state.phase !== "intro" && editingIndex === null,
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-6 sm:py-10" data-variant={variantId}>
      <Header mode={player.mode} counted={state.phase === "intro" ? null : counted} onOpenLive={() => setLiveOpen((o) => !o)} />

      {liveOpen && (
        <LivePanel
          mode={player.mode}
          gameInProgress={state.phase === "playing" && state.turns.length > 0}
          onConnect={switchPlayer}
          onDisconnect={() => switchPlayer(null)}
          onClose={() => setLiveOpen(false)}
        />
      )}

      <main className="flex flex-col gap-6">
        {state.phase === "intro" && <IntroScreen mode={player.mode} onStart={game.start} />}

        {state.phase === "playing" && (
          <TurnStage
            request={state.request}
            turn={turn}
            slow={slow}
            questionNumber={counted + 1}
            variant={variant}
            onAnswer={game.answer}
            onRetry={game.retry}
          />
        )}

        {(state.phase === "won" || state.phase === "lost") && state.endReason && (
          <EndScreen
            won={state.phase === "won"}
            endReason={state.endReason}
            turns={state.turns}
            reveal={state.reveal}
            onReveal={game.reveal}
            onPlayAgain={() => {
              setEditingIndex(null);
              game.start();
            }}
          />
        )}

        <AnswerLog
          turns={state.turns}
          editingIndex={editingIndex}
          onStartEdit={setEditingIndex}
          onCancelEdit={() => setEditingIndex(null)}
          onConfirmEdit={(index, answer) => {
            setEditingIndex(null);
            game.edit(index, answer);
          }}
        />
      </main>

      <Announcer message={announcement(state)} />
      <VariantSwitcher />
    </div>
  );
}

function announcement(state: GameState): string {
  if (state.phase === "won") return "I guessed it! Game over.";
  if (state.phase === "lost") return state.endReason === "conceded" ? "The AI gave up. Game over." : "Out of questions. You win!";
  if (state.request.status === "error") return state.request.error.message;
  const turn = currentTurn(state.turns);
  if (state.request.status === "idle" && turn) {
    return turn.ai.kind === "guess" ? `My guess: ${turn.ai.text}` : `Question ${countedQuestions(state.turns) + 1}: ${turn.ai.text}`;
  }
  return "";
}
