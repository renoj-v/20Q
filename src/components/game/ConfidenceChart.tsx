import { topCandidate } from "@/game/rules";
import type { Turn } from "@/game/types";

/*
 * FR-18: how confident the AI felt after each answer. Placeholder form — the
 * final visualization is an open question in the PRD (§12).
 */

const W = 320;
const H = 140;
const PAD = { top: 12, right: 12, bottom: 24, left: 34 };

type Point = { x: number; y: number; turn: Turn; confidence: number; label: string };

export function ConfidenceChart({ turns }: { turns: Turn[] }) {
  const series = turns.filter((t) => t.ai.kind !== "concede");
  if (series.length < 2) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const points: Point[] = series.map((turn, i) => {
    const top = topCandidate(turn);
    const confidence = top?.confidence ?? 0;
    return {
      x: PAD.left + (i / (series.length - 1)) * innerW,
      y: PAD.top + (1 - confidence) * innerH,
      turn,
      confidence,
      label: top?.label ?? "—",
    };
  });

  // Key moment: the biggest single jump in confidence.
  let jump = -1;
  let biggest = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].confidence - points[i - 1].confidence;
    if (delta > biggest) [jump, biggest] = [i, delta];
  }
  const keyMoment = jump > 0 ? points[jump] : null;
  const path = points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium text-fg-muted">How sure I was, turn by turn</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby="confidence-summary">
        {[0, 0.5, 1].map((v) => {
          const y = PAD.top + (1 - v) * innerH;
          return (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border)" />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="var(--fg-subtle)">
                {v * 100}%
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p) => {
          const isGuess = p.turn.ai.kind === "guess";
          const color = !isGuess ? "var(--accent)" : p.turn.answer === "yes" ? "var(--success)" : "var(--danger)";
          return isGuess ? (
            <rect key={p.turn.id} x={p.x - 4} y={p.y - 4} width="8" height="8" transform={`rotate(45 ${p.x} ${p.y})`} fill={color} />
          ) : (
            <circle key={p.turn.id} cx={p.x} cy={p.y} r="2.5" fill={color} />
          );
        })}
        {keyMoment && (
          <text
            x={Math.min(keyMoment.x, W - PAD.right - 60)}
            y={Math.max(keyMoment.y - 8, PAD.top + 8)}
            fontSize="9"
            fill="var(--fg-muted)"
          >
            Big jump
          </text>
        )}
        <text x={PAD.left} y={H - 6} fontSize="9" fill="var(--fg-subtle)">
          Turn 1
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="9" fill="var(--fg-subtle)">
          Turn {points.length}
        </text>
      </svg>
      <p id="confidence-summary" className="sr-only">
        Confidence went from {Math.round(points[0].confidence * 100)}% to{" "}
        {Math.round(points.at(-1)!.confidence * 100)}% over {points.length} turns.
        {keyMoment && ` The biggest jump came after answer ${jump}, toward ${keyMoment.label}.`}
      </p>
      <details className="text-sm text-fg-muted">
        <summary className="cursor-pointer">Turn-by-turn data</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr>
              <th className="font-medium">Turn</th>
              <th className="font-medium">Top idea</th>
              <th className="text-right font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.turn.id}>
                <td>{i + 1}</td>
                <td>{p.label}</td>
                <td className="text-right tabular-nums">{Math.round(p.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
