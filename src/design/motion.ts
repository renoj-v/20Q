import type { Transition } from "motion/react";

/*
 * Motion and timing tokens. Interaction studies in /lab tune these live;
 * copy winning values back here so the game and the lab stay in sync.
 */

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 35 },
  gentle: { type: "spring", stiffness: 220, damping: 26 },
} satisfies Record<string, Transition>;

export const timing = {
  /** FR-14: escalate to "still thinking…" after this long. */
  slowThinkingMs: 4000,
  /** Demo mode: delay per streamed word. */
  demoStreamWordMs: 70,
  /** FR-23: demo fake latency upper bound. */
  demoMaxLatencyMs: 2000,
  /** Demo mode: how long "sending" lasts before "thinking". */
  demoSendingMs: 150,
} as const;
