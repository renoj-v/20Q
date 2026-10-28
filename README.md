# 20Q

Think of anything; an AI tries to guess it in 20 questions. See [PRD.md](PRD.md) for the full spec.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # game rules, demo engine, streaming JSON parser
npm run typecheck
npm run lint
npm run build      # static export to ./out
```

## Where things live

| Path | What |
|---|---|
| `src/styles/tokens.css` | **Design tokens.** Figma variables land here; components only use these semantic tokens. |
| `src/app/globals.css` | Maps tokens to Tailwind utilities (`bg-surface`, `text-fg-muted`, `rounded-card`, …). |
| `src/design/motion.ts` | Motion & timing tokens (durations, springs, slow-thinking threshold, demo latency). |
| `src/design/variants.ts` | Interaction variants A/B/C and their config knobs. |
| `src/game/` | Pure game logic: rules, reducer (turn states, rewind), types. |
| `src/ai/` | `AiPlayer` interface; `demo/` rule-based engine, `claude/` live browser client. |
| `src/hooks/useGame.ts` | Connects the reducer to the active `AiPlayer`. |
| `src/components/game/` | Game UI. `data-state` / `data-kind` / `data-answer` attributes are styling hooks for state specs. |
| `src/app/lab/` | Interaction studies (dev only). |

## Design workflow

- **State matrix:** `/lab/states` renders every turn, log, and end state with fixed data — compare against Figma here.
- **Interaction studies:** `/lab/thinking` tunes latency and streaming live. Copy winning values into `src/design/motion.ts`.
- **New study:** add `src/app/lab/<name>/page.dev.tsx` and link it from `src/app/lab/page.dev.tsx`.
- **Variants:** `?variant=a|b|c` or the corner switcher (dev only). Production renders `SHIPPED_VARIANT`.

Lab routes use the `.dev.tsx` extension, so production builds leave them out entirely. Set `NEXT_PUBLIC_ENABLE_VARIANTS=true` on a preview deploy to include the lab and the variant switcher.

## Live mode

Players paste their own Claude API key. It's kept in `sessionStorage` (cleared when the tab closes) and sent only to the Claude API, directly from the browser. The default model is `claude-haiku-5-5`; set `NEXT_PUBLIC_CLAUDE_MODEL` to compare another model during development.
