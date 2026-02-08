# AI-Readable Project Context: 20 Questions Game

## PURPOSE
Complete project context for AI assistants. Covers architecture, mock/live mode system, and conversation history.

---

## WHAT WAS BUILT

A web-based 20 Questions game with two gameplay modes:
1. **AI Guesser Mode**: Human thinks of object → AI asks questions → AI guesses
2. **User Guesser Mode**: AI thinks of object → Human asks questions → Human guesses

**Tech**: React 19 + Vite 7.3.1 + Anthropic Claude API (claude-sonnet-4-20250514)

---

## FILE STRUCTURE

### Service Layer (Mock/Live Architecture)

**`src/services/claude.js`** — Router module. Central import point for all components.
```javascript
import * as mock from './mock.js';
import * as live from './claude-live.js';
const useMock = import.meta.env.VITE_USE_MOCK === 'true';
const service = useMock ? mock : live;
export const initializeAIGuesser   = service.initializeAIGuesser;
export const continueAIGuesser     = service.continueAIGuesser;
export const initializeUserGuesser = service.initializeUserGuesser;
export const answerUserQuestion    = service.answerUserQuestion;
```
Components always import from `claude.js`. Switching between mock/live requires only changing `VITE_USE_MOCK` in `.env`.

**`src/services/claude-live.js`** — Original live API implementation (Anthropic SDK, `dangerouslyAllowBrowser: true`, model `claude-sonnet-4-20250514`, max_tokens 1024). Exports: `sendMessage`, `initializeAIGuesser`, `continueAIGuesser`, `initializeUserGuesser`, `answerUserQuestion`.

**`src/services/mock.js`** — Mock service mirroring live API surface. Uses 400ms fake delay. Tracks question index via module-level counters. For User Guesser: detects "give up"/"reveal" → returns reveal response; detects "is it"/"my final guess" → always returns correct response.

**`src/services/testdata-ai-guesser.js`** — 20 scripted questions narrowing to "piano". Questions use varied phrasing (not "Is it...") to avoid triggering game-end detection. Only the final question (#20) uses final-guess phrasing: `"My final guess — is it a piano?"`. Fallback also uses "my final guess" phrasing.

**`src/services/testdata-user-guesser.js`** — Object is "banana". 20 Yes/No answers. Exports: `USER_GUESSER_OBJECT`, `USER_GUESSER_READY_MESSAGE`, `USER_GUESSER_ANSWERS` (20 items), `USER_GUESSER_CORRECT_RESPONSE`, `USER_GUESSER_REVEAL_RESPONSE`, `USER_GUESSER_FALLBACK`.

### Core Application

**`src/App.jsx`** — Root component. State: `gameMode` (null | 'ai-guesser' | 'user-guesser'). Renders ModeSelection, AIGuesserMode, or UserGuesserMode.

**`src/main.jsx`** — React 19 entry point.

### UI Components

**`src/components/ModeSelection.jsx`** — Homepage / mode picker. Uses `Button` component. Title ("20 Questions"), instructions section, subtitle ("Choose your game mode"), two frosted-glass cards with play buttons. Props: `onSelectMode(mode)`.

**`src/components/Button.jsx`** — **NEW in Session 8**. Reusable button component. Renders `<button>` with base `.btn` class, merges additional `className`, spreads all other props. Imports `Button.css`.

**`src/components/AnswerButtons.jsx`** — **NEW in Session 8**. Extracted from AIGuesserMode. Contains Yes/No/Sometimes/Unsure buttons using `Button` component. Props: `onAnswer`, `cardRef`, `setGlowOverride`, `disabled`.
- Yes/No: call `handleSwipeAnswer(direction)` — spawns directional particles + `card.swipeOut()` animation
- Sometimes/Unsure: call `handleParticleAnswer(type)` — spawns particles + `card.dissolve()`

**`src/components/AIGuesserMode.jsx`** — AI asks questions, user answers Yes/No/Sometimes/Unsure.
- State: conversationHistory, systemPrompt, questionCount, isLoading, error, gameEnded, currentQuestion, finalMessage, glowOverride, guessResult
- Uses `SwipeCard` component (keyed by `questionCount`) — shows only the current AI question on a draggable frosted-glass card
- Uses `AnswerButtons` component for answer controls
- Game-end detection: explicit final-guess phrases OR `questionCount >= 10` + `/\bis it [a-z]/`
- **End screen**: Two-phase — first shows "Did I get it right?" with Yes/No buttons (`guessResult` state), then shows result message + Play Again / Main Menu

**`src/components/SwipeCard.jsx`** — Reusable draggable card with `forwardRef`.
- Pointer events for drag with capture; tracks X/Y offset + rotation
- `SWIPE_CONFIG` exported object with all tunable animation parameters
- `spawnParticles(rect, direction, config)` exported — directional bias for swipes, omnidirectional for button clicks
- `glowOverride` prop allows parent to push a glow state
- `useImperativeHandle` exposes: `getBoundingClientRect()`, `dissolve()`, `swipeOut(direction)`
- `swipeOut(direction)` sets offset to swipe threshold in given direction + triggers dissolve (card slides left/right as it fades)
- `key={questionCount}` on parent causes React remount → fresh card plays CSS `swipeCardFadeIn` animation

**`src/components/UserGuesserMode.jsx`** — User asks questions, AI answers. Card-based UI.
- Card shows user's current question with bubble-rise fade-in animation (keyed by `cardKey`)
- AI response shown as italic serif text above the card inside `.user-guesser-main` wrapper
- Dark navy input (`#0b2660`) with SVG paper plane send icon
- Game ends at questionCount >= 20, then shows final guess input + reveal/play-again buttons

### Design System

**`src/variables.css`** — **NEW in Session 8**. CSS custom properties for all design tokens:
- Fonts: `--font-serif` (Instrument Serif), `--font-sans` (Instrument Sans), `--font-input` (Inter)
- Font sizes: `--text-xs` (14px) through `--text-4xl` (48px)
- Colors: backgrounds (`--bg-primary`, `--bg-card`, `--bg-input`, `--bg-overlay*`), text (dark/light/muted variants), borders
- Gradients: `--gradient-orb-1` through `--gradient-orb-4` for decorative blurs
- Glows/shadows: `--glow-text`, `--glow-card`, `--glow-card-hover`, `--glow-input`
- Focus outline, border radii (`--radius-sm`, `--radius-md`), transitions (`--transition-fast/normal/slow`)

### Styling

All component CSS files import `@import '../variables.css'` and use CSS custom properties throughout.

- **`src/components/Button.css`** — **NEW in Session 8**. Base `.btn` reset: no background/border, Instrument Serif italic, text-shadow glow, focus outline.
- **`src/components/ModeSelection.css`** — **REWRITTEN in Session 8**. Matches game mode styling: `#bfbff6` purple background, gradient blur orbs, frosted-glass cards, Instrument fonts, `.mode-btn` bordered buttons.
- **`src/components/AIGuesserMode.css`** — Background, layout, answer buttons, game-end Yes/No + result buttons, error states.
- **`src/components/UserGuesserMode.css`** — Lavender background, card styles, input box, game-end/error states.
- **`src/components/SwipeCard.css`** — Card dimensions (262x374px), frosted-glass appearance, `swipeCardFadeIn` animation, loading pulse.
- **`src/App.css`** — Purple gradient background.
- **`src/index.css`** — CSS reset, Segoe UI font.
- **`src/components/GameMode.css`** — Legacy chat-bubble styles (unused).

### Config

- **`.env`** — `VITE_ANTHROPIC_API_KEY=<key>` and `VITE_USE_MOCK=true`
- **`.env.example`** — Template with both vars documented
- **`.gitignore`** — Excludes `.env`

---

## DATA FLOW

### Message Tracking
- **UserGuesserMode** uses `conversationHistory` for API calls + `currentQuestion` / `aiResponse` strings for display
- **AIGuesserMode** uses `conversationHistory` for API calls + `currentQuestion` string for display

### AI Guesser Flow
Mount → `initializeAIGuesser()` → first question on card → user taps Yes/No/Sometimes/Unsure (or swipes) → `continueAIGuesser(history, prompt)` → card updates → increment counter → check game-end → loop → end screen: Yes/No confirmation → result + Play Again/Main Menu

### User Guesser Flow
Mount → `initializeUserGuesser()` → AI ready message → user types question → increment counter → `answerUserQuestion(history, prompt)` → AI answer → at 20 questions → final guess UI

---

## SYSTEM PROMPTS (in claude-live.js)

**AI Guesser**: Ask strategic yes/no questions, max 20, guess with "Is it [object]?"
**User Guesser**: Pick random common object, answer only Yes/No/Maybe, reveal after 20 or on correct guess

---

## ENVIRONMENT

```
VITE_ANTHROPIC_API_KEY=sk-ant-...   # Required for live mode
VITE_USE_MOCK=true                   # true = mock data, false/absent = live API
```

---

## CONVERSATION HISTORY (what was done and decided)

### Session 1: Initial Build
- Created full project from scratch: Vite React app, Claude API integration, two game modes, all styling, README

### Session 2: Documentation
- Created `project_history.md` for AI context

### Session 3: Mock/Live Mode System
- Created router pattern in `claude.js`, moved live code to `claude-live.js`, created `mock.js` + two test data files
- Test data: AI Guesser narrows to "piano"; User Guesser answers about "banana"
- Toggle via `VITE_USE_MOCK` env var

### Session 4: Bug Fix — Game Ending Too Early
- Fixed game-end detection to require explicit final-guess phrasing (or `questionCount >= 10` + "is it" pattern)
- Expanded test data from 10 to 20 questions with varied phrasing

### Session 5: AI Guesser Mode Redesign — Figma Implementation
- Figma node "sample-game". Card-based question UI, frosted-glass card, stylized Yes/No + Sometimes/Unsure buttons
- Added Google Fonts (Instrument Serif/Sans). Created `AIGuesserMode.css`. Rewrote JSX from chat-bubbles to card-based.

### Session 6: SwipeCard Component — Drag, Glow, Particles
- Extracted card into `SwipeCard.jsx` + `SwipeCard.css` as reusable `forwardRef` component
- Swipe, glow interpolation, 32-particle burst system, `SWIPE_CONFIG` tuning object, `glowOverride` prop

### Session 7: User Guesser Mode Redesign — Card-Based UI
- Full rewrite of `UserGuesserMode.jsx` to card-based UI with bubble-rise animation
- Created `UserGuesserMode.css` — lavender background, frosted-glass card, dark navy input

### Session 8: Component Extraction, Design System, End Screen
- **Button component**: Extracted reusable `Button.jsx` + `Button.css` with base `.btn` class
- **AnswerButtons component**: Extracted Yes/No/Sometimes/Unsure from AIGuesserMode into `AnswerButtons.jsx`
- **SwipeCard.swipeOut()**: Added `swipeOut(direction)` to imperative handle — Yes/No buttons now trigger directional card animation (slide + dissolve) matching swipe behavior
- **ModeSelection redesign**: Rewritten to match game mode styling — purple gradient background, frosted-glass cards, Instrument fonts, `Button` component
- **CSS variables**: Created `src/variables.css` with all design tokens (fonts, sizes, colors, gradients, glows, radii, transitions). Updated all 5 component CSS files to use `var()` references.
- **Game end Yes/No**: Added two-phase end screen to AIGuesserMode — "Did I get it right?" with Yes/No buttons, then result message + Play Again/Main Menu. New `guessResult` state ('correct' | 'incorrect' | null).
- **Arrow fix**: Removed `scaleX(-1)` from No button arrow

---

## QUICK REFERENCE

| File | Purpose |
|------|---------|
| `src/variables.css` | CSS design tokens (fonts, colors, etc.) |
| `src/services/claude.js` | Router: mock ↔ live |
| `src/services/claude-live.js` | Live Anthropic API calls |
| `src/services/mock.js` | Mock service (scripted responses) |
| `src/services/testdata-ai-guesser.js` | 20 scripted questions → piano |
| `src/services/testdata-user-guesser.js` | 20 scripted answers → banana |
| `src/components/Button.jsx` | Reusable button component |
| `src/components/Button.css` | Base button styles |
| `src/components/AnswerButtons.jsx` | Yes/No/Sometimes/Unsure answer buttons |
| `src/components/AIGuesserMode.jsx` | AI guesser gameplay |
| `src/components/AIGuesserMode.css` | AI guesser styles |
| `src/components/UserGuesserMode.jsx` | User guesser gameplay |
| `src/components/UserGuesserMode.css` | User guesser styles |
| `src/components/ModeSelection.jsx` | Mode selection homepage |
| `src/components/ModeSelection.css` | Mode selection styles |
| `src/components/SwipeCard.jsx` | Draggable card with glow + particles |
| `src/components/SwipeCard.css` | SwipeCard styles + animation |
| `src/components/GameMode.css` | Legacy (unused) |
| `src/App.jsx` | Root navigation |
| `.env` | API key + mock toggle |

---

**Last Updated**: February 6, 2026
