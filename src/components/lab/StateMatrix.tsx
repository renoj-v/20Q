"use client";

import type { ReactNode } from "react";
import { AnswerLog } from "@/components/game/AnswerLog";
import { EndScreen } from "@/components/game/EndScreen";
import { TurnStage } from "@/components/game/TurnStage";
import { useVariant } from "@/design/variants";
import type { AiTurn, RequestState, Turn } from "@/game/types";

/*
 * Every state from PRD §8 rendered with fixed data, so each one can be
 * designed, compared against Figma, and screenshotted without playing a game.
 */

const candidates = [
  { label: "Dog", confidence: 0.46 },
  { label: "Cat", confidence: 0.28 },
  { label: "Rabbit", confidence: 0.14 },
  { label: "Mouse", confidence: 0.06 },
];
const question: AiTurn = {
  kind: "question",
  text: "Do people often keep it as a pet?",
  statusLine: "Narrowing down: an animal, a mammal…",
  candidates,
};
const guess: AiTurn = {
  kind: "guess",
  text: "Is it a dog?",
  statusLine: "I think I've got it…",
  candidates: [{ label: "Dog", confidence: 0.84 }, ...candidates.slice(1)],
};

const history: Turn[] = [
  { id: "h1", ai: { ...question, text: "Is it alive?", candidates: [{ label: "Dog", confidence: 0.05 }] }, answer: "yes" },
  { id: "h2", ai: { ...question, text: "Is it an animal?", candidates: [{ label: "Dog", confidence: 0.1 }] }, answer: "yes" },
  { id: "h3", ai: { ...question, text: "Can it fly?", candidates: [{ label: "Dog", confidence: 0.12 }] }, answer: "unsure" },
  { id: "h4", ai: { ...question, text: "Is it a mammal?", candidates: [{ label: "Dog", confidence: 0.2 }] }, answer: "yes" },
  { id: "h5", ai: { ...question, candidates }, answer: "yes" },
  { id: "h6", ai: { ...guess, text: "Is it a cat?" }, answer: "no" },
];
const wonTurns: Turn[] = [...history, { id: "h7", ai: guess, answer: "yes" }];
const lostTurns: Turn[] = [...history, { id: "h7", ai: guess, answer: "no" }];

const noop = () => {};

export function StateMatrix() {
  const { config: variant } = useVariant();

  const stage = (request: RequestState, turn: Turn | null, slow = false) => (
    <TurnStage request={request} turn={turn} slow={slow} questionNumber={6} variant={variant} onAnswer={noop} onRetry={noop} />
  );
  const settledQuestion: Turn = { id: "q", ai: question, answer: null };
  const settledGuess: Turn = { id: "g", ai: guess, answer: null };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">State matrix</h1>
        <p className="text-fg-muted">Uses the current variant — switch with the control in the corner.</p>
      </div>

      <Group title="Turn states · question">
        <Cell label="Sending">{stage({ status: "sending" }, null)}</Cell>
        <Cell label="Thinking">{stage({ status: "thinking", partial: { statusLine: question.statusLine, candidates } }, null)}</Cell>
        <Cell label="Still thinking (> 4s)">{stage({ status: "thinking", partial: {} }, null, true)}</Cell>
        <Cell label="Streaming">
          {stage({ status: "streaming", partial: { ...question, text: "Do people often keep" } }, null)}
        </Cell>
        <Cell label="Settled">{stage({ status: "idle" }, settledQuestion)}</Cell>
        <Cell label="Error">
          {stage({ status: "error", error: { kind: "rate_limit", message: "Rate limit reached. Wait a moment, then retry." } }, null)}
        </Cell>
      </Group>

      <Group title="Turn states · guess">
        <Cell label="Streaming">{stage({ status: "streaming", partial: { ...guess, text: "Is it a" } }, null)}</Cell>
        <Cell label="Settled">{stage({ status: "idle" }, settledGuess)}</Cell>
      </Group>

      <Group title="Log & rewind">
        <Cell label="Log">
          <AnswerLog turns={history} editingIndex={null} onStartEdit={noop} onCancelEdit={noop} onConfirmEdit={noop} />
        </Cell>
        <Cell label="Editing (pick an answer to see the confirmation)">
          <AnswerLog turns={history} editingIndex={1} onStartEdit={noop} onCancelEdit={noop} onConfirmEdit={noop} />
        </Cell>
      </Group>

      <Group title="End states">
        <Cell label="Win">
          <EndScreen won endReason="guessed" turns={wonTurns} reveal={null} onReveal={noop} onPlayAgain={noop} />
        </Cell>
        <Cell label="Loss · reveal prompt">
          <EndScreen won={false} endReason="out_of_questions" turns={lostTurns} reveal={null} onReveal={noop} onPlayAgain={noop} />
        </Cell>
        <Cell label="Loss · revealed">
          <EndScreen won={false} endReason="out_of_questions" turns={lostTurns} reveal="A hamster" onReveal={noop} onPlayAgain={noop} />
        </Cell>
        <Cell label="Conceded (demo set exhausted)">
          <EndScreen
            won={false}
            endReason="conceded"
            turns={[...history, { id: "c", ai: { kind: "concede", text: "I'm stumped! My demo brain doesn't know this one.", statusLine: "", candidates: [] }, answer: null }]}
            reveal={null}
            onReveal={noop}
            onPlayAgain={noop}
          />
        </Cell>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-fg-subtle">{label}</p>
      {children}
    </div>
  );
}
