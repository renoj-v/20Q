import type { AiTurn, Candidate } from "@/game/types";

/*
 * Pulls whatever fields are readable out of a partially streamed AiTurn JSON
 * object, so the UI can show the status line and candidates while thinking
 * and stream the question text word by word.
 */

export function readPartialTurn(json: string): Partial<AiTurn> {
  const partial: Partial<AiTurn> = {};

  const kind = readString(json, "kind");
  if (kind?.complete && (kind.value === "question" || kind.value === "guess" || kind.value === "concede")) {
    partial.kind = kind.value;
  }

  const statusLine = readString(json, "statusLine");
  if (statusLine?.complete) partial.statusLine = statusLine.value;

  const candidates = readCandidates(json);
  if (candidates) partial.candidates = candidates;

  const text = readString(json, "text");
  if (text) partial.text = text.value;

  return partial;
}

function readString(json: string, key: string): { value: string; complete: boolean } | null {
  const match = new RegExp(`"${key}"\\s*:\\s*"`).exec(json);
  if (!match) return null;
  let value = "";
  for (let i = match.index + match[0].length; i < json.length; i++) {
    const ch = json[i];
    if (ch === '"') return { value, complete: true };
    if (ch !== "\\") {
      value += ch;
      continue;
    }
    const next = json[i + 1];
    if (next === undefined) break;
    if (next === "u") {
      const hex = json.slice(i + 2, i + 6);
      if (hex.length < 4) break;
      value += String.fromCharCode(parseInt(hex, 16));
      i += 5;
    } else {
      value += ({ n: "\n", t: "\t", r: "\r", b: "\b", f: "\f" } as Record<string, string>)[next] ?? next;
      i += 1;
    }
  }
  return { value, complete: false };
}

function readCandidates(json: string): Candidate[] | null {
  const match = /"candidates"\s*:\s*\[/.exec(json);
  if (!match) return null;
  // Find the matching close bracket, skipping over strings.
  let depth = 0;
  let inString = false;
  for (let i = match.index + match[0].length - 1; i < json.length; i++) {
    const ch = json[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "[") depth++;
    else if (ch === "]" && --depth === 0) {
      try {
        return JSON.parse(json.slice(match.index + match[0].length - 1, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}
