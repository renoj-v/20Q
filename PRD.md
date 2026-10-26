# PRD: 20Q — An AI That Reads Your Mind

| | |
|---|---|
| **Author** | renoj |
| **Status** | Draft v1 |
| **Last updated** | 2026-10-26 |
| **Target launch** | 2 weeks from kickoff |

---

## 1. Overview

20Q is a responsive web game where the player thinks of anything at all and an AI tries to guess it in 20 yes/no-style questions. Unlike classic 20Q engines (fixed knowledge trees), a modern LLM can reason over an open-ended space — which makes the *experience of watching it think* the core design opportunity.

The project doubles as a **product design case study**. Its purpose is to demonstrate interaction and visual design skill applied to an AI product: making latency, uncertainty, and machine reasoning legible and enjoyable.

## 2. Goals

1. **Showcase interaction & visual design** for an AI product — thinking states, latency, confidence, and correction flows.
2. **Learn by building** — design and ship the product end-to-end in TypeScript.
3. **Validate design decisions with evidence** — a comparative playtest of three interaction variants informs what ships.
4. **Zero-friction access** — anyone (especially hiring managers) can play within seconds, with no account or API key.

### Non-goals (v1)

- Player-guesses mode (AI holds the secret)
- AI personality / character / animated presence
- Multiplayer, daily challenges, leaderboards
- User accounts or server-side persistence
- Hosting or paying for a shared API key
- Public variant switcher on the live site

## 3. Audience

- **Players:** casual adults looking for a quick, playful game.
- **Primary evaluators:** hiring managers and design peers arriving from the portfolio case study.

## 4. Game rules

| Rule | Behavior |
|---|---|
| Secret | Player thinks of **anything at all**. No category picker. |
| Answers | **Yes / No / Sometimes / Unsure** |
| Question cap | **Hard cap of 20.** Yes, No, and Sometimes count toward it. |
| Unsure | **Does not count** toward the cap. Unlimited — players are trusted to answer honestly. |
| Guesses | AI may guess at **any point**. A guess **counts** toward the 20. |
| Wrong guess | Play continues. |
| Win (AI) | Player confirms a guess is correct. |
| Loss (AI) | 20 counted questions used without a correct guess. |
| Reveal | On loss, player may optionally type what they were thinking of (skippable). |

## 5. Functional requirements

### 5.1 Core loop

- **FR-1** The game starts with a prompt for the player to think of something, and a start action.
- **FR-2** The AI asks one question at a time; the player answers via Yes / No / Sometimes / Unsure.
- **FR-3** A visible counter shows counted questions used out of 20. Unsure answers are shown in the log but do not advance the counter.
- **FR-4** When the AI makes a guess, the guess is visually distinct from a question and the answer controls change to **"Yes, that's it!" / "No"** (Sometimes and Unsure hidden).
- **FR-5** "Yes, that's it!" ends the game in an AI-win state. "No" consumes a question and play continues.

### 5.2 Question & answer log

- **FR-6** All questions, guesses, and answers appear in a chronological log.
- **FR-7** Unsure answers are visually distinguished as not counting toward the cap.

### 5.3 Editing answers (rewind)

- **FR-8** The player can edit **any** previous answer.
- **FR-9** Editing an answer **rewinds** the game to that question: all subsequent questions and answers are discarded, and the counter is **refunded** accordingly.
- **FR-10** Before rewinding, an **inline confirmation** (not a modal) states how many questions will be erased, e.g. "This will erase 7 questions."
- **FR-11** Discarded log entries animate out on confirm.

### 5.4 Thinking & latency states

- **FR-12** The AI's reasoning is shown as **curated** output: a short status line (e.g. "Narrowing down: it's an animal, not a pet…") plus a hypothesis display of current top candidates with confidence. Raw model reasoning is not shown.
- **FR-13** Each AI turn moves through explicit states, each with its own visual spec:
  1. **Sending** — answer submitted, controls disabled
  2. **Thinking** — awaiting response
  3. **Streaming** — question text streams in word by word
  4. **Settled** — question complete, controls enabled
- **FR-14** If thinking exceeds ~4 seconds, the UI escalates to a "still thinking…" treatment.
- **FR-15** Errors (network, invalid key, rate limit, malformed response) show a clear inline message with a retry action; the game state is never lost.

### 5.5 End screen

- **FR-16** The game ends when the AI guesses correctly or uses all 20 questions.
- **FR-17** On loss, the player is offered an optional, skippable text field to reveal their answer.
- **FR-18** The end screen shows **how confident / close the AI felt after each answer** across the game (e.g. confidence-over-time visualization), with key moments identifiable.
- **FR-19** If the player revealed the answer, the end screen contrasts the AI's closest guess with the real answer.
- **FR-20** A clear "Play again" action restarts the game.

### 5.6 AI modes

#### Demo mode (default)

- **FR-21** Visitors land directly in a **playable demo game** — no setup required.
- **FR-22** Demo mode uses a **rule-based fake AI**: a curated set of ~50 common items tagged with yes/no attributes, choosing questions by greedy attribute splitting.
- **FR-23** Demo responses include **random fake latency of ≤ 2 seconds** so all latency states are exercised.
- **FR-24** When the player's item isn't in the set, demo mode loses gracefully with an honest, lighthearted line.
- **FR-25** Demo mode produces the same response shape as live mode (question/guess, candidates, confidence, status line) so the UI is identical.

#### Live mode (bring your own key)

- **FR-26** A visible link invites the player to "Play with live AI" by adding their own Claude API key.
- **FR-27** The key entry UI links to Claude's documentation on how to obtain an API key.
- **FR-28** The key is stored for the **session only** (cleared when the tab closes). It is never sent to the project's server.
- **FR-29** The browser calls the Claude API **directly**. The site is fully static.
- **FR-30** The key is validated with a lightweight test call; invalid key, no credits, and rate-limit errors get distinct inline messages.
- **FR-31** A persistent badge indicates the current mode: **"Demo AI"** or **"Live: Claude"**.

### 5.7 LLM contract

- **FR-32** Default model: **Claude Haiku 5.5** (speed and cost). Sonnet 5.5 available as a development comparison.
- **FR-33** Each turn returns structured JSON:

  ```ts
  type AiTurn = {
    kind: "question" | "guess";
    text: string;            // the question or guess
    statusLine: string;      // curated "thinking" summary
    candidates: { label: string; confidence: number }[]; // top 3–5, 0–1
  };
  ```

- **FR-34** The system prompt instructs the model to pivot its line of questioning when answers are Unsure, and to decline neutrally to continue if the secret is clearly hateful or sexual. Real people (celebrities, historical figures) are allowed. No custom moderation layer in v1.
- **FR-35** On rewind, the conversation sent to the model is truncated to the edited question so the AI reasons only from current answers.

## 6. Non-functional requirements

### Accessibility

- **NFR-1** Conforms to **WCAG 2.2 AA**.
- **NFR-2** Keyboard shortcuts: **Y / N / S / U** for answers, **E** to edit; guess state maps Y / N to the two guess buttons.
- **NFR-3** Every animation has a `prefers-reduced-motion` alternative.
- **NFR-4** New questions, guesses, and state changes are announced to screen readers (live region).

### Performance & platform

- **NFR-5** Responsive from 360px mobile to desktop.
- **NFR-6** Demo mode playable within ~5 seconds of landing.
- **NFR-7** Static hosting; no backend required.

### Privacy & analytics

- **NFR-8** Privacy-friendly analytics only (no cookies, no personal data), e.g. Vercel Analytics or Plausible.
- **NFR-9** Tracked events: game started, game ended (win/loss), questions to finish, mode (demo/live), edits used.
- **NFR-10** API keys and secrets are never logged or sent to analytics.

## 7. Technical approach

- **Stack:** TypeScript, Next.js (static export), Tailwind CSS, Framer Motion for animation, transitions, and interactions.
- **Architecture:** a single `AiPlayer` interface with two implementations — `DemoAiPlayer` (rule-based) and `ClaudeAiPlayer` (direct browser calls) — so the UI is agnostic to mode.
- **State:** client-side game state as an ordered list of turns; rewind = truncate the list.
- **Hosting:** Vercel (or equivalent static host).

## 8. Design process & validation

The design process is the main deliverable for the case study.

### Variants

- Three **interaction design variants** of the game will be designed (specifics defined later, outside this PRD).
- The variants exist **for the playtest only**. The winning variant ships on the live site.
- The build must support switching between variants during development and playtesting (e.g. a dev-only flag).

### Playtest

- **Goal:** a **comparative test** of the three variants to understand which interactions players enjoy most.
- **Format:** ~5 participants, each plays all three variants on the **real build** (not a Figma prototype) so latency and streaming feel authentic. Think-aloud plus a short preference interview.
- **Output:** findings and the rationale for the winning variant, documented for the portfolio case study.

### Case study

- Hosted on the author's portfolio site, linking to the live game. The game site itself does not include a case-study page.

## 9. Timeline (2 weeks)

| Days | Phase |
|---|---|
| 1–3 | Flows, wireframes, and three variants in Figma |
| 4–9 | Build: demo mode first, then live Claude mode |
| 10–11 | Comparative playtest (5 sessions) on the real build |
| 12–14 | Implement winner, polish, launch |

## 10. Success criteria

- Live on a public URL within 2 weeks.
- A first-time visitor can start a demo game with no setup.
- All game states (thinking, streaming, slow, error, guess, win, loss, rewind) are designed and reachable.
- Playtest completed with a documented winning variant and rationale.
- Meets WCAG 2.2 AA and reduced-motion requirements.

## 11. Future

- Player-guesses mode (AI holds the secret) — eventually support both modes
- AI personality and an animated presence
- "Show work" expander for raw model reasoning
- Shareable end-screen recap
- Daily challenge / social features
- Optional "remember key on this device"

## 12. Open questions

- Visual design of the three variants (to be defined in the design phase).
- Exact end-screen visualization form for per-answer confidence.
- Composition of the ~50-item demo set.
