import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { duration, ease } from "@/design/motion";
import { answerLabel, counts, turnsErasedByEdit } from "@/game/rules";
import type { Answer, Turn } from "@/game/types";
import { answerOptions } from "./AnswerControls";

type AnswerLogProps = {
  turns: Turn[];
  editingIndex: number | null;
  onStartEdit(index: number): void;
  onCancelEdit(): void;
  onConfirmEdit(index: number, answer: Answer): void;
};

const ANSWER_COLOR: Record<Answer, string> = {
  yes: "text-answer-yes",
  no: "text-answer-no",
  sometimes: "text-answer-sometimes",
  unsure: "text-answer-unsure",
};

/** FR-6–11: chronological log with inline rewind editing. */
export function AnswerLog({ turns, editingIndex, onStartEdit, onCancelEdit, onConfirmEdit }: AnswerLogProps) {
  let counted = 0;
  const rows = turns.flatMap((turn, index) => {
    if (turn.answer === null) return [];
    if (counts(turn.answer)) counted++;
    return [{ turn: turn as Turn & { answer: Answer }, index, number: counts(turn.answer) ? counted : null }];
  });

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="log-heading" className="space-y-2">
      <h2 id="log-heading" className="text-sm font-medium text-fg-muted">
        Your answers
      </h2>
      <ol className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
        <AnimatePresence initial={false}>
          {rows.map(({ turn, index, number }) => (
            <motion.li
              key={turn.id}
              layout="position"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: duration.base, ease: ease.out }}
              data-kind={turn.ai.kind}
              data-answer={turn.answer}
            >
              {editingIndex === index ? (
                <EditRow
                  turn={turn}
                  erases={turnsErasedByEdit(turns, index)}
                  onCancel={onCancelEdit}
                  onConfirm={(answer) => onConfirmEdit(index, answer)}
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-6 shrink-0 tabular-nums text-fg-subtle">{number ?? "–"}</span>
                  <span className="min-w-0 flex-1">
                    {turn.ai.kind === "guess" && <span className="mr-1 font-medium text-guess">Guess:</span>}
                    {turn.ai.text}
                  </span>
                  <span className={`shrink-0 font-medium ${ANSWER_COLOR[turn.answer]}`}>
                    {answerLabel(turn.answer, turn.ai.kind)}
                    {turn.answer === "unsure" && <span className="ml-1 font-normal text-fg-subtle">(not counted)</span>}
                  </span>
                  <Button variant="ghost" className="min-h-9 px-2" onClick={() => onStartEdit(index)}>
                    Edit<span className="sr-only"> answer to “{turn.ai.text}”</span>
                  </Button>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}

type EditRowProps = {
  turn: Turn & { answer: Answer };
  erases: number;
  onCancel(): void;
  onConfirm(answer: Answer): void;
};

/** FR-10: pick a new answer, then confirm inline (no modal) how much will be erased. */
function EditRow({ turn, erases, onCancel, onConfirm }: EditRowProps) {
  const [pending, setPending] = useState<Answer | null>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => firstRef.current?.focus(), []);

  function choose(answer: Answer) {
    if (answer === turn.answer) return onCancel();
    if (erases === 0) return onConfirm(answer);
    setPending(answer);
  }

  return (
    <div
      className="space-y-3 bg-surface-sunken px-4 py-3 text-sm"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <p>
        Change your answer to <span className="font-medium">“{turn.ai.text}”</span>
      </p>
      <div role="group" aria-label="New answer" className="flex flex-wrap gap-2">
        {answerOptions(turn.ai.kind).map((o, i) => (
          <Button
            key={o.answer}
            ref={i === 0 ? firstRef : undefined}
            variant={(pending ?? turn.answer) === o.answer ? "primary" : "secondary"}
            aria-pressed={(pending ?? turn.answer) === o.answer}
            onClick={() => choose(o.answer)}
          >
            {o.label}
          </Button>
        ))}
      </div>
      {pending ? (
        <div role="alert" className="flex flex-wrap items-center gap-2">
          <span className="mr-auto text-fg">
            This will erase {erases} {erases === 1 ? "question" : "questions"}.
          </span>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onConfirm(pending)}>
            Rewind
          </Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
