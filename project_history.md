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

**`src/components/ModeSelection.jsx`** — Stateless. Two mode cards. Props: `onSelectMode(mode)`.

**`src/components/AIGuesserMode.jsx`** — AI asks questions, user answers Yes/No/Sometimes/Unsure. **REDESIGNED in Sessions 5-6** to card-based swipeable UI matching Figma.
- State: conversationHistory, systemPrompt, questionCount, isLoading, error, gameEnded, currentQuestion, finalMessage, glowOverride
- Uses `SwipeCard` component (keyed by `questionCount`) — shows only the current AI question on a draggable frosted-glass card
- Swipe right = Yes (green glow/particles), swipe left = No (red glow/particles)
- Sometimes button: yellow glow on hover, yellow particle burst + card dissolve on click
- Unsure button: white glow on hover, white particle burst + card dissolve on click
- `cardRef` (via `useImperativeHandle`) exposes `getBoundingClientRect()` and `dissolve()` to parent
- Game-end detection unchanged: explicit final-guess phrases OR `questionCount >= 10` + `/\bis it [a-z]/`

**`src/components/SwipeCard.jsx`** — **NEW in Session 6**. Reusable draggable card with `forwardRef`.
- Pointer events for drag with capture; tracks X/Y offset + rotation
- `SWIPE_CONFIG` exported object with all tunable animation parameters:
  - `swipeThreshold` (100px), `maxDragDistance` (180px), `dissolveDuration` (90ms), `rotationFactor` (0.08 deg/px)
  - `glow`: neutral (white), yes (green), no (red), sometimes (yellow), unsure (white) — each with color/blur/spread
  - `particles`: count (32), lifetime (1600-2000ms), distance (80-280px), size (8-22px), spread (full circle)
- `PARTICLE_HUES` map: right=green, left=red, sometimes=yellow/amber, unsure=white (0% saturation)
- `spawnParticles(rect, direction, config)` exported — scatters particles across card face, directional bias for swipes, omnidirectional for button clicks
- `glowOverride` prop allows parent to push a glow state (e.g. on button hover)
- On committed swipe: card dissolves in place (scale+fade over `dissolveDuration`), particles burst, then `onSwipe` fires
- `key={questionCount}` on parent causes React remount → fresh card plays CSS `swipeCardFadeIn` animation

**`src/components/UserGuesserMode.jsx`** — User asks questions, AI answers. **REDESIGNED in Session 7** to card-based UI matching Figma.
- State: conversationHistory, systemPrompt, questionCount, isLoading, error, gameEnded, userInput, gameStarted, currentQuestion, aiResponse, cardKey, finalGuessInput, finalResult
- Card shows user's current question with bubble-rise fade-in animation (keyed by `cardKey`)
- AI response shown as italic serif text above the card inside `.user-guesser-main` wrapper
- Dark navy input (`#0b2660`) with SVG paper plane send icon
- Game ends at questionCount >= 20, then shows final guess input + reveal/play-again buttons
- `handleFinalGuess()` sends `"Is it [guess]?"`, `handleRevealAnswer()` sends give-up message

### Styling

- **`src/App.css`** — Purple gradient background (#667eea → #764ba2). AI Guesser overrides this with its own full-viewport background.
- **`src/index.css`** — CSS reset, Segoe UI font
- **`src/components/ModeSelection.css`** — Grid layout, hover effects, responsive
- **`src/components/UserGuesserMode.css`** — **NEW in Session 7**. Lavender background (`#bfbff6`), decorative gradient blurs, card styles (262px, frosted glass, white glow), `userCardFadeIn` animation (bubble-rise from input area: `scale(0.6) translate3d(0, 200px, 0)` → `scale(1)`), dark navy input box, game-end/error states, responsive breakpoints.
- **`src/components/GameMode.css`** — Legacy chat-bubble styles. No longer used by either mode.
- **`src/components/AIGuesserMode.css`** — **NEW in Session 5**. Background, layout, answer buttons, game-end/error states. Card styles moved to `SwipeCard.css` in Session 6.
- **`src/components/SwipeCard.css`** — **NEW in Session 6**. Card dimensions (262x374px), frosted-glass appearance, `swipeCardFadeIn` animation (scale 0.9 + translate from -80px), loading pulse, responsive breakpoints.

### Config

- **`.env`** — `VITE_ANTHROPIC_API_KEY=<key>` and `VITE_USE_MOCK=true`
- **`.env.example`** — Template with both vars documented
- **`.gitignore`** — Excludes `.env`

---

## DATA FLOW

### Message Tracking
- **UserGuesserMode** (redesigned) uses `conversationHistory` for API calls + `currentQuestion` / `aiResponse` strings for display (card shows one question at a time, AI response above)
- **AIGuesserMode** (redesigned) uses only `conversationHistory` for API calls + `currentQuestion` string for display (card shows one question at a time)

### AI Guesser Flow
Mount → `initializeAIGuesser()` → first question on card → user taps Yes/No/Sometimes/Unsure → `continueAIGuesser(history, prompt)` → card updates with next question → increment counter → check game-end → loop

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
- Build verified successful

### Session 2: Documentation
- Created `project_history.md` for AI context
- Rewrote it in AI-optimized format

### Session 3: Mock/Live Mode System
- **Request**: Don't use Claude API directly; use scripted test data; make it easy to switch between test and live mode
- **Solution**: Created router pattern in `claude.js`, moved live code to `claude-live.js`, created `mock.js` + two test data files
- Test data: AI Guesser narrows to "piano" over questions; User Guesser answers about "banana"
- Toggle via `VITE_USE_MOCK` env var

### Session 4: Bug Fix — Game Ending Too Early
- **Bug**: AI Guesser mode ended after 1 question because test data questions contained "Is it" which triggered game-end detection
- **Fix 1**: Updated game-end detection in `AIGuesserMode.jsx` to require explicit final-guess phrasing (or `questionCount >= 10` + "is it" pattern)
- **Fix 2**: Expanded test data from 10 to 20 questions with varied phrasing; only final question uses "My final guess — is it a piano?"
- Build verified successful

### Session 5: AI Guesser Mode Redesign — Figma Implementation
- **Figma**: `https://www.figma.com/design/mlBGIIXMfq9ym4KSLZlDgx/20Q?node-id=386-11` (node "sample-game")
- **Design**: Card-based question UI — dark navy background, frosted-glass card with current question, stylized Yes/No labels with arrows, bordered Sometimes/Unsure buttons. Fonts: Instrument Serif (italic) for content, Instrument Sans for UI text.
- `index.html`: Added Google Fonts imports (Instrument Serif italic, Instrument Sans 400-700)
- `AIGuesserMode.css`: Created new dedicated stylesheet matching Figma design
- `AIGuesserMode.jsx`: Rewrote UI from chat-bubbles to card-based. Removed `messages` array. Added `currentQuestion` and `finalMessage` state.

### Session 6: SwipeCard Component — Drag, Glow, Particles
- Extracted card into `SwipeCard.jsx` + `SwipeCard.css` as a reusable `forwardRef` component
- **Swipe**: Drag right = Yes, drag left = No. Card rotates with drag. Committed swipe (>100px) dissolves card in place (scale+fade) and spawns directional particle burst, then fires `onSwipe` callback.
- **Glow**: Dynamic box-shadow interpolates from white (neutral) to green (right) or red (left) based on drag distance. `glowOverride` prop allows external glow state from parent.
- **Particles**: 32 particles per burst, scattered across card face, fly outward with eased transitions. Color-coded: green (Yes), red (No), yellow (Sometimes), white (Unsure). Exported `spawnParticles()` function for button use.
- **Button interactions**: Sometimes/Unsure buttons set `glowOverride` on hover (yellow/white), trigger `card.dissolve()` + particles on click, then fire `handleAnswer` after `dissolveDuration`.
- **Card transitions**: `key={questionCount}` causes React remount → fresh card plays `swipeCardFadeIn` CSS animation.
- **All animation params** in exported `SWIPE_CONFIG` object for easy tuning.
- **Not changed**: `GameMode.css`, `UserGuesserMode.jsx`, `ModeSelection.jsx/css`, service layer

### Session 7: User Guesser Mode Redesign — Card-Based UI
- **Figma**: node 405-340
- **Full rewrite** of `UserGuesserMode.jsx` from chat-bubble layout to card-based UI
- Removed: `messages` array, `messagesEndRef`, `scrollToBottom`, chat-container, `GameMode.css` import
- Added state: `currentQuestion`, `aiResponse`, `cardKey`, `finalGuessInput`, `finalResult`, `inputRef`
- Created `UserGuesserMode.css` — lavender background (`#bfbff6`) with decorative gradient blurs, frosted-glass card (262px, white glow), dark navy input box (`#0b2660`), SVG paper plane send icon
- `.user-guesser-main` wrapper groups AI response (italic serif) + card with shared `margin-top: 256px`
- **Card animation**: Bubble-rise from input area — starts at `scale(0.6) translate3d(0, 200px, 0)`, opacity reaches 1 at 40%, settles at `scale(1)`. Duration 0.5s with `cubic-bezier(0.2, 0.8, 0.3, 1)` deceleration.
- **GPU compositing fix**: Base `transform: translate3d(0, 0, 0)` on card prevents stutter when CSS animation ends (avoids compositing layer drop from animation removal)
- `will-change: transform, opacity` for hardware acceleration
- Game-end state: final guess input + "Give Up & Reveal" / "Play Again" / "Main Menu" buttons
- `GameMode.css` no longer used by either mode (legacy)
- Build verified successful

---

## QUICK REFERENCE

| File | Purpose |
|------|---------|
| `src/services/claude.js` | Router: mock ↔ live |
| `src/services/claude-live.js` | Live Anthropic API calls |
| `src/services/mock.js` | Mock service (scripted responses) |
| `src/services/testdata-ai-guesser.js` | 20 scripted questions → piano |
| `src/services/testdata-user-guesser.js` | 20 scripted answers → banana |
| `src/components/AIGuesserMode.jsx` | AI guesser gameplay |
| `src/components/UserGuesserMode.jsx` | User guesser gameplay |
| `src/components/ModeSelection.jsx` | Mode selection menu |
| `src/components/SwipeCard.jsx` | Draggable card with glow + particles |
| `src/components/SwipeCard.css` | SwipeCard styles + fade-in animation |
| `src/components/AIGuesserMode.css` | AI guesser layout/button styles |
| `src/components/UserGuesserMode.css` | User guesser card/input styles |
| `src/components/GameMode.css` | Legacy chat-bubble styles (unused) |
| `src/App.jsx` | Root navigation |
| `.env` | API key + mock toggle |

---

**Last Updated**: February 3, 2026
