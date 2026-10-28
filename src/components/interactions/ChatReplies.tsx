"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { spring } from "@/design/motion";
import type { Answer, AiTurn } from "@/game/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { AnswerInteractionProps } from "./types";

/*
 * Version C — Chat. Answering is a reply in a conversation. Quick-reply
 * chips speak in the player's voice, and the tapped chip flies up into the
 * thread as your message (shared layout animation).
 */

const REPLIES: Record<AiTurn["kind"], { answer: Answer; text: string; key: string }[]> = {
  question: [
    { answer: "yes", text: "Yep!", key: "Y" },
    { answer: "no", text: "Nope", key: "N" },
    { answer: "sometimes", text: "Sometimes, kinda", key: "S" },
    { answer: "unsure", text: "Hmm, not sure", key: "U" },
  ],
  guess: [
    { answer: "yes", text: "Yes, that's it!", key: "Y" },
    { answer: "no", text: "Nope, not that", key: "N" },
  ],
  concede: [],
};

function replyText(kind: AiTurn["kind"], answer: Answer): string {
  return REPLIES[kind].find((r) => r.answer === answer)?.text ?? answer;
}

export function ChatReplies({ turn, history, disabled, onAnswer }: AnswerInteractionProps) {
  const replies = turn ? REPLIES[turn.ai.kind] : [];
  const active = !!turn && !disabled;
  const recent = history.slice(-3);

  const answer = (a: Answer) => active && replies.some((r) => r.answer === a) && onAnswer(a);
  useKeyboardShortcuts({ y: () => answer("yes"), n: () => answer("no"), s: () => answer("sometimes"), u: () => answer("unsure") }, active);

  return (
    <LayoutGroup>
      <div className="space-y-6">
        <ol aria-label="Conversation" className="flex min-h-72 flex-col justify-end gap-2">
          <AnimatePresence initial={false}>
            {recent.flatMap((t) => [
              <Bubble key={t.id} side="ai" guess={t.ai.kind === "guess"} faded>
                {t.ai.text}
              </Bubble>,
              <motion.li
                key={`${t.id}-reply`}
                layoutId={`reply-${t.id}-${t.answer}`}
                transition={spring.gentle}
                className="max-w-[80%] self-end rounded-card rounded-br-sm bg-accent px-4 py-2 text-accent-fg"
              >
                {replyText(t.ai.kind, t.answer)}
              </motion.li>,
            ])}
            {turn ? (
              <Bubble key={turn.id} side="ai" guess={turn.ai.kind === "guess"}>
                {turn.ai.text}
              </Bubble>
            ) : (
              <Bubble key="typing" side="ai">
                <span role="status" className="flex gap-1 py-1.5" aria-label="AI is typing">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="thinking-dot size-2 rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </Bubble>
            )}
          </AnimatePresence>
        </ol>

        <div role="group" aria-label="Quick replies" className="flex min-h-11 flex-wrap justify-end gap-2">
          <AnimatePresence>
            {active &&
              replies.map((r) => (
                <motion.button
                  key={`${turn.id}-${r.answer}`}
                  layoutId={`reply-${turn.id}-${r.answer}`}
                  type="button"
                  aria-keyshortcuts={r.key}
                  onClick={() => answer(r.answer)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={spring.gentle}
                  className="min-h-11 rounded-pill border border-accent px-4 text-sm font-medium text-accent hover:bg-accent-soft"
                >
                  {r.text}
                </motion.button>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}

function Bubble({ side, guess, faded, children }: { side: "ai"; guess?: boolean; faded?: boolean; children: React.ReactNode }) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: faded ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={spring.gentle}
      data-side={side}
      className={`max-w-[85%] self-start rounded-card rounded-bl-sm px-4 py-2 ${
        guess ? "border border-guess bg-guess-soft font-medium text-guess" : "bg-surface-raised text-fg shadow-sm"
      } ${faded ? "" : "text-lg"}`}
    >
      {children}
    </motion.li>
  );
}
