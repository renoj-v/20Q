import { track as vercelTrack } from "@vercel/analytics";
import type { Mode } from "@/game/types";

/*
 * NFR-8–10: cookie-free analytics with a fixed event list. Only the fields
 * typed below are sent — never answers, reveals, or API keys.
 */

type Events = {
  game_started: { mode: Mode };
  game_ended: { mode: Mode; result: "win" | "loss"; questions: number; edits: number };
};

export function track<E extends keyof Events>(event: E, props: Events[E]): void {
  if (process.env.NODE_ENV !== "production") return;
  vercelTrack(event, props);
}
