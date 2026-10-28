import { useState } from "react";
import { API_KEY_DOCS_URL, validateApiKey } from "@/ai/claude/ClaudeAiPlayer";
import { Button } from "@/components/ui/Button";
import type { AiError, Mode } from "@/game/types";

type LivePanelProps = {
  mode: Mode;
  gameInProgress: boolean;
  onConnect(apiKey: string): void;
  onDisconnect(): void;
  onClose(): void;
};

/** FR-26–30: inline (not modal) bring-your-own-key panel. */
export function LivePanel({ mode, gameInProgress, onConnect, onDisconnect, onClose }: LivePanelProps) {
  const [key, setKey] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<AiError | null>(null);

  if (mode === "live") {
    return (
      <section aria-label="Live AI" className="space-y-3 rounded-card border border-border bg-surface p-4 text-sm">
        <p>You&apos;re playing against Claude with your own API key. It&apos;s stored in this tab only.</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDisconnect}>
            Forget key &amp; switch to demo
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </section>
    );
  }

  async function submit() {
    setChecking(true);
    setError(null);
    const result = await validateApiKey(key.trim());
    setChecking(false);
    if (result) setError(result);
    else onConnect(key.trim());
  }

  return (
    <section aria-labelledby="live-heading" className="space-y-3 rounded-card border border-border bg-surface p-4 text-sm">
      <h2 id="live-heading" className="font-medium">
        Play with live AI
      </h2>
      <p className="text-fg-muted">
        Add your own Claude API key. It stays in this browser tab and goes only to Claude — never to this site.{" "}
        <a href={API_KEY_DOCS_URL} target="_blank" rel="noreferrer" className="text-accent underline">
          How to get a key
        </a>
      </p>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="api-key" className="sr-only">
          Claude API key
        </label>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "api-key-error" : undefined}
          className="min-h-11 flex-1 rounded-control border border-border-strong bg-surface px-3 font-mono"
        />
        <Button type="submit" variant="primary" disabled={!key.trim() || checking}>
          {checking ? "Checking…" : "Connect"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </form>
      {error && (
        <p id="api-key-error" role="alert" data-error={error.kind} className="text-danger">
          {error.message}
        </p>
      )}
      {gameInProgress && <p className="text-fg-muted">Connecting starts a new game.</p>}
    </section>
  );
}
