import Link from "next/link";

const STUDIES = [
  { href: "/lab/states", title: "State matrix", body: "Every turn state and end state side by side, with fixed data — the design checklist." },
  { href: "/lab/thinking", title: "Thinking & streaming", body: "Live-tune latency, streaming speed, and the slow threshold against the demo AI." },
  { href: "/test-interaction", title: "Answer interaction", body: "Three ways to say Yes / No / Sometimes / Unsure — swipe, spectrum, chat." },
];

export default function LabIndex() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Interaction lab</h1>
        <p className="text-fg-muted">One page per interaction. Add new studies under src/app/lab/.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {STUDIES.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block space-y-1 rounded-card border border-border bg-surface p-5 hover:border-border-strong">
              <span className="font-medium">{s.title}</span>
              <p className="text-sm text-fg-muted">{s.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
