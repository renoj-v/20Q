import { timing } from "@/design/motion";
import type { AiTurn, AnsweredTurn } from "@/game/types";
import { sleep, type AiPlayer, type TurnProgress } from "../types";
import { decideTurn } from "./engine";

/**
 * Demo mode (FR-21–25): rule-based engine plus fake latency and word-by-word
 * streaming, so every latency state is exercised without an API key.
 */
export class DemoAiPlayer implements AiPlayer {
  readonly mode = "demo" as const;

  constructor(private readonly options: { maxLatencyMs?: number; wordMs?: number } = {}) {}

  async nextTurn(history: AnsweredTurn[], progress: TurnProgress, signal: AbortSignal): Promise<AiTurn> {
    const maxLatency = this.options.maxLatencyMs ?? timing.demoMaxLatencyMs;
    const wordMs = this.options.wordMs ?? timing.demoStreamWordMs;
    const turn = decideTurn(history);

    await sleep(timing.demoSendingMs, signal);
    const meta = { kind: turn.kind, statusLine: turn.statusLine, candidates: turn.candidates };
    progress.onThinking(meta);
    await sleep(Math.random() * Math.max(0, maxLatency - timing.demoSendingMs), signal);

    const words = turn.text.split(" ");
    for (let i = 1; i <= words.length; i++) {
      progress.onStreaming({ ...meta, text: words.slice(0, i).join(" ") });
      await sleep(wordMs, signal);
    }
    return turn;
  }
}
