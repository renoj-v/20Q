import Anthropic from "@anthropic-ai/sdk";
import type { AiError, AiTurn, AnsweredTurn, Candidate } from "@/game/types";
import { AiPlayerError, isAbortError, type AiPlayer, type TurnProgress } from "../types";
import { readPartialTurn } from "./partialJson";
import { SYSTEM_PROMPT, TURN_SCHEMA, buildUserMessage } from "./prompt";

/** FR-32: Haiku for speed and cost; override with NEXT_PUBLIC_CLAUDE_MODEL to compare. */
export const CLAUDE_MODEL = process.env.NEXT_PUBLIC_CLAUDE_MODEL || "claude-haiku-5-5";

export const API_KEY_DOCS_URL = "https://platform.claude.com/docs/en/get-started";

const DECLINE_TEXT = "I'd rather not continue with this one. Want to start a new game?";

/** Browser-only Claude client (FR-29). The key never touches our server — there isn't one. */
export function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
}

/**
 * Live mode. Each turn sends the whole (possibly rewound) history as a single
 * user message, so the model only ever reasons from the current answers (FR-35).
 */
export class ClaudeAiPlayer implements AiPlayer {
  readonly mode = "live" as const;
  private readonly client: Anthropic;

  constructor(apiKey: string, private readonly model = CLAUDE_MODEL) {
    this.client = createClient(apiKey);
  }

  async nextTurn(history: AnsweredTurn[], progress: TurnProgress, signal: AbortSignal): Promise<AiTurn> {
    try {
      const stream = this.client.messages.stream(
        {
          model: this.model,
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserMessage(history) }],
          output_config: { effort: "low", format: { type: "json_schema", schema: TURN_SCHEMA } },
        },
        { signal },
      );

      let json = "";
      for await (const event of stream) {
        if (event.type === "message_start") {
          progress.onThinking({});
        } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          json += event.delta.text;
          const partial = readPartialTurn(json);
          if (partial.text) progress.onStreaming(partial);
          else progress.onThinking(partial);
        }
      }

      const message = await stream.finalMessage();
      if (message.stop_reason === "refusal") {
        return { kind: "concede", text: DECLINE_TEXT, statusLine: "", candidates: [] };
      }
      const textBlock = message.content.find((b) => b.type === "text");
      if (message.stop_reason === "max_tokens" || !textBlock) {
        throw new AiPlayerError({ kind: "malformed", message: "The AI's reply was cut off." });
      }
      return parseTurn(textBlock.text);
    } catch (e) {
      if (isAbortError(e) || e instanceof AiPlayerError) throw e;
      throw new AiPlayerError(toAiError(e));
    }
  }
}

function parseTurn(text: string): AiTurn {
  let raw: Partial<AiTurn>;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new AiPlayerError({ kind: "malformed", message: "The AI sent back something unreadable." });
  }
  if (!raw.kind || !raw.text) {
    throw new AiPlayerError({ kind: "malformed", message: "The AI's reply was missing its question." });
  }
  const candidates: Candidate[] = (raw.candidates ?? [])
    .slice(0, 5)
    .map((c) => ({ label: String(c.label), confidence: Math.min(1, Math.max(0, Number(c.confidence) || 0)) }));
  return { kind: raw.kind, text: raw.text, statusLine: raw.statusLine ?? "", candidates };
}

/** Maps SDK errors to the distinct inline messages required by FR-15 / FR-30. */
export function toAiError(e: unknown): AiError {
  if (e instanceof Anthropic.AuthenticationError) {
    return { kind: "invalid_key", message: "That API key wasn't accepted. Check it and try again." };
  }
  if (e instanceof Anthropic.PermissionDeniedError) {
    return { kind: "invalid_key", message: "This API key doesn't have access to the model." };
  }
  if (e instanceof Anthropic.RateLimitError) {
    return { kind: "rate_limit", message: "Rate limit reached. Wait a moment, then retry." };
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return { kind: "network", message: "Couldn't reach Claude. Check your connection and retry." };
  }
  if (e instanceof Anthropic.APIError) {
    // A low balance arrives as a 402 billing_error, or as a 400 whose message
    // mentions the credit balance — the API has no dedicated type for the latter.
    if (e.status === 402 || /credit balance/i.test(e.message)) {
      return { kind: "no_credits", message: "This key's account is out of credits. Add credits in the Claude Console." };
    }
    if (e.status === 529 || (e.status ?? 0) >= 500) {
      return { kind: "overloaded", message: "Claude is busy right now. Retry in a few seconds." };
    }
  }
  return { kind: "unknown", message: "Something went wrong talking to Claude. Retry?" };
}

/** FR-30: lightweight test call to validate a key before switching to live mode. */
export async function validateApiKey(apiKey: string): Promise<AiError | null> {
  try {
    await createClient(apiKey).messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: "Reply with OK." }],
    });
    return null;
  } catch (e) {
    return toAiError(e);
  }
}
