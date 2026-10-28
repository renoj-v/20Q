import { Button } from "@/components/ui/Button";
import type { AiError } from "@/game/types";

/** FR-15: inline error with retry; game state is untouched. */
export function ErrorNotice({ error, onRetry }: { error: AiError; onRetry(): void }) {
  return (
    <div role="alert" data-error={error.kind} className="space-y-3 rounded-control bg-danger-soft p-4 text-sm">
      <p className="text-fg">{error.message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
