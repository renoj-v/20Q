"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ThinkingIndicator } from "@/components/game/TurnStage";
import type { Answer } from "@/game/types";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ALL_ANSWERS, parseAnswer } from "./parseAnswer";
import type { AnswerInteractionProps } from "./types";

/*
 * Version E — Voice. Answering out loud, like the real parlour game.
 * Tap the mic and say "yeah", "nope", "kinda", "no idea"… Uses the browser's
 * Web Speech API; buttons below are always there as a fallback.
 */

// Minimal typing for the Web Speech API (not in every TS DOM lib).
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

const LISTEN_TIMEOUT_MS = 8000;
const noopSubscribe = () => () => {};
const LABELS: Record<Answer, string> = { yes: "Yes", no: "No", sometimes: "Sometimes", unsure: "Unsure" };

export function SayIt(props: AnswerInteractionProps) {
  return <Voice key={props.turn?.id ?? "thinking"} {...props} />;
}

function Voice({ turn, disabled, onAnswer }: AnswerInteractionProps) {
  const isGuess = turn?.ai.kind === "guess";
  const allowed: Answer[] = isGuess ? ["yes", "no"] : ALL_ANSWERS;
  const supported = useSyncExternalStore(noopSubscribe, () => recognitionCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [heard, setHeard] = useState<Answer | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const active = !!turn && !disabled && heard === null;

  useEffect(() => () => recRef.current?.abort(), []);

  function commit(answer: Answer) {
    if (!active || !allowed.includes(answer)) return;
    setHeard(answer);
    recRef.current?.abort();
    setTimeout(() => onAnswer(answer), 450);
  }

  function listen() {
    const Ctor = recognitionCtor();
    if (!active || !Ctor) return;
    if (listening) return recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const results = Array.from(e.results);
      const text = results.map((r) => r[0].transcript).join(" ");
      setTranscript(text);
      if (results.at(-1)?.isFinal) {
        const answer = parseAnswer(text, allowed);
        if (answer) commit(answer);
        else setMessage(isGuess ? "Didn't catch that. Say yes or no." : "Didn't catch that. Try yes, no, sometimes, or not sure.");
      }
    };
    rec.onerror = (e) =>
      setMessage(e.error === "not-allowed" ? "Microphone is blocked. Use the buttons below." : "Couldn't hear you. Tap the mic to try again.");
    // Some browsers never report back (no mic, offline); don't listen forever.
    const timeout = setTimeout(() => {
      rec.abort();
      setMessage("Didn't hear anything. Tap the mic to try again.");
    }, LISTEN_TIMEOUT_MS);
    rec.onend = () => {
      clearTimeout(timeout);
      setListening(false);
    };
    recRef.current = rec;
    setTranscript("");
    setMessage(null);
    setListening(true);
    rec.start();
  }

  useKeyboardShortcuts(
    { y: () => commit("yes"), n: () => commit("no"), s: () => commit("sometimes"), u: () => commit("unsure"), " ": listen },
    active,
  );

  return (
    <div className="space-y-8 text-center">
      <div className="grid min-h-24 place-items-center">
        {turn ? (
          <p className={`text-2xl font-semibold text-balance sm:text-3xl ${isGuess ? "text-guess" : ""}`}>{turn.ai.text}</p>
        ) : (
          <ThinkingIndicator state="thinking" />
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative grid size-28 place-items-center">
          {listening && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-accent"
              initial={{ scale: 0.8, opacity: 0.35 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <button
            type="button"
            onClick={listen}
            aria-disabled={!active || !supported}
            aria-pressed={listening}
            aria-keyshortcuts="Space"
            aria-label={listening ? "Stop listening" : "Answer by voice"}
            className={`relative grid size-24 place-items-center rounded-full text-3xl shadow-md transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${
              heard ? "bg-success text-accent-fg" : listening ? "bg-accent text-accent-fg" : "bg-surface-raised text-accent"
            }`}
          >
            <MicIcon />
          </button>
        </div>

        <div aria-live="polite" className="min-h-12 space-y-1">
          {heard ? (
            <p className="text-lg font-medium">
              Heard “{transcript || LABELS[heard]}” → <span className="text-accent">{LABELS[heard]}</span>
            </p>
          ) : transcript ? (
            <p className="text-lg text-fg-muted italic">“{transcript}”</p>
          ) : (
            <p className="text-fg-muted">
              {!supported
                ? "Voice isn't supported in this browser. Use the buttons below."
                : listening
                  ? "Listening…"
                  : isGuess
                    ? "Tap the mic and say yes or no"
                    : "Tap the mic and say yes, no, sometimes, or not sure"}
            </p>
          )}
          {message && <p className="text-sm text-danger">{message}</p>}
        </div>
      </div>

      <div role="group" aria-label={isGuess ? "Is the guess right?" : "Your answer"} className="flex flex-wrap justify-center gap-x-1 text-sm">
        <span className="text-fg-subtle">Or tap:</span>
        {allowed.map((a) => (
          <button
            key={a}
            type="button"
            aria-disabled={!active}
            onClick={() => commit(a)}
            className="rounded px-1.5 text-fg-muted underline-offset-4 hover:text-fg hover:underline aria-disabled:cursor-not-allowed"
          >
            {isGuess && a === "yes" ? "That's it!" : LABELS[a]}
          </button>
        ))}
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
