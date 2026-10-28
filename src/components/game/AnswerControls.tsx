import { Button } from "@/components/ui/Button";
import type { AiTurn, Answer } from "@/game/types";

const QUESTION_ANSWERS: { answer: Answer; label: string; key: string }[] = [
  { answer: "yes", label: "Yes", key: "Y" },
  { answer: "no", label: "No", key: "N" },
  { answer: "sometimes", label: "Sometimes", key: "S" },
  { answer: "unsure", label: "Unsure", key: "U" },
];

const GUESS_ANSWERS: { answer: Answer; label: string; key: string }[] = [
  { answer: "yes", label: "Yes, that's it!", key: "Y" },
  { answer: "no", label: "No", key: "N" },
];

export function answerOptions(kind: AiTurn["kind"]) {
  return kind === "guess" ? GUESS_ANSWERS : QUESTION_ANSWERS;
}

type AnswerControlsProps = {
  kind: AiTurn["kind"];
  disabled: boolean;
  onAnswer(answer: Answer): void;
};

/** FR-2 / FR-4: four answers for questions, two for guesses. */
export function AnswerControls({ kind, disabled, onAnswer }: AnswerControlsProps) {
  const options = answerOptions(kind);
  return (
    <div
      role="group"
      aria-label={kind === "guess" ? "Is the guess right?" : "Your answer"}
      className={`grid gap-2 ${options.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}
    >
      {options.map((o) => (
        <Button
          key={o.answer}
          variant={o.answer === "yes" && kind === "guess" ? "primary" : "secondary"}
          shortcut={o.key}
          disabled={disabled}
          onClick={() => onAnswer(o.answer)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
