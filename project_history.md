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

**`src/components/Button.jsx`** — Reusable button component. Renders `<button>` with base `.btn` class, merges additional `className`, spreads all other props. Imports `Button.css`.

**`src/components/AnswerButtons.jsx`** — Extracted from AIGuesserMode. Contains Yes/No/Sometimes/Unsure buttons using `Button` component. Props: `onAnswer`, `cardRef`, `setGlowOverride`, `disabled`.
- Yes/No: call `handleSwipeAnswer(direction)` — spawns directional particles + `card.swipeOut()` animation
- Sometimes/Unsure: call `handleParticleAnswer(type)` — spawns particles + `card.dissolve()`

**`src/components/AIGuesserMode.jsx`** — AI asks questions, user answers Yes/No/Sometimes/Unsure.
- State: conversationHistory, systemPrompt, questionCount, isLoading, error, currentQuestion, finalMessage, glowOverride, guessResult
- Derived `gamePhase`: `'playing' | 'final-guess' | 'result'`
- Uses `SwipeCard` component (keyed by `questionCount`) — shows only the current AI question on a draggable frosted-glass card
- Uses `AnswerButtons` component for answer controls
- Game-end detection: explicit final-guess phrases OR `questionCount >= 10` + `/\bis it [a-z]/`
- **Final guess phase**: Orange background (#c09060), card shows AI's final guess, simple Yes/No buttons + swipeable card
- **Result phase**: Background transitions to teal (#60b0a0, correct) or red (#b06060, incorrect). Persistent floating particles via `spawnPersistentParticles(rect)` — 25 DOM-based blurred white circles with CSS `persistentDrift` keyframe animation using custom properties (--drift-x, --drift-y). Result text + Play Again / Back to Menu buttons
- **Phase background transitions**: 0.8s ease on container + all gradient orb pseudo-elements

**`src/components/SwipeCard.jsx`** — Reusable draggable card with `forwardRef`.
- Pointer events for drag with capture; tracks X/Y offset + rotation
- `SWIPE_CONFIG` exported object with all tunable animation parameters including glow colors:
  - `glow.yes`: `rgba(72, 199, 108, 0.85)` — green
  - `glow.no`: `rgba(220, 60, 60, 0.85)` — red
  - `glow.sometimes`: `rgba(240, 200, 40, 0.85)` — yellow/amber
  - `glow.unsure`: `rgba(255, 255, 255, 0.9)` — white
  - `glow.neutral`: `rgba(255, 255, 255, 0.6)` — white
- `spawnParticles(rect, direction, config)` exported — directional bias for swipes, omnidirectional for button clicks
- `glowOverride` prop allows parent to push a glow state
- `useImperativeHandle` exposes: `getBoundingClientRect()`, `dissolve()`, `swipeOut(direction)`
- `key={questionCount}` on parent causes React remount → fresh card plays CSS `swipeCardFadeIn` animation

**`src/components/UserGuesserMode.jsx`** — **REWRITTEN in Session 9, updated Session 10**. User asks questions, AI answers. Chat-based UI with answer-type coloring + phase-based endgame.
- State: conversationHistory, systemPrompt, questionCount, isLoading, error, currentQuestion, aiResponse, userInput, gameStarted, finalResult + questionLog, showPrevQuestions, currentAnswerType + **gamePhase** ('playing' | 'final-guess' | 'result'), guessCorrect ('correct' | 'incorrect' | null), finalGuessText
- **Auto-archive system** (Session 10): Q&A archives to prev-questions log after 5 seconds OR when user asks the next question (whichever first). Uses `archiveTimerRef` + `currentQARef` + `useCallback` to avoid stale closures. Q20 uses 500ms delay instead of 5s for fast transition.
- **Chat bubbles**: AI answer bubble (left-aligned, italic serif, `border-radius: 24px 24px 24px 0`) + user question bubble (right-aligned, sans-serif, `border-radius: 24px 24px 0 16px`)
- **AI thinking state**: Shows "hmmm..." with pulse animation while loading; colored bubble when answered
- **Answer type detection**: `getAnswerType(response)` parses first word of AI response → 'yes' | 'no' | 'sometimes' | 'unsure'
- **Question shortening**: `shortenQuestion(question, answerType)` strips "Is it " prefix, then prepends: "Is " (yes), "Not " (no), "Sometimes " (sometimes), "Unsure if " (unsure)
- **Previous questions panel**: Collapsible at top of screen, `max-height: 86px` collapsed (shows last 2 items via `justify-content: flex-end`), `430px` expanded. Each row color-coded by answer type. Hidden during result phase.
- **Pull-down button**: Below prev-questions panel. Circular, gradient fill + glow color matches the most recently archived answer type. Chevron rotates 180° when expanded
- **Answer-type color system** (derived from AIGuesserMode `SWIPE_CONFIG.glow`):
  - Yes (green): bubble `rgba(200, 245, 215, 0.9)`, glow `rgba(72, 199, 108, 0.55)`, prev-row `#c0f0ce`, text `#0a3d1a`
  - No (red): bubble `rgba(250, 200, 200, 0.9)`, glow `rgba(220, 60, 60, 0.55)`, prev-row `#f5c5c5`, text `#4c0a0a`
  - Sometimes (yellow): bubble `rgba(250, 240, 190, 0.9)`, glow `rgba(240, 200, 40, 0.55)`, prev-row `#f5eab4`, text `#4c3d05`
  - Unsure (white): bubble `rgba(255, 255, 255, 0.8)`, glow `rgba(255, 255, 255, 0.6)`, prev-row `rgba(240, 240, 255, 0.75)`, text `#0c0e10`
- **Playing flow**: User asks → user bubble appears + AI "hmmm..." → AI responds with colored bubble → after 5s (or next question) archives to collapsible panel
- **Final guess phase** (Session 10): After Q20 answer archived → orange background (#c09060), counter says "Final Guess", same input box re-themed brown (#60330b bg, #9aa8c6 border), placeholder "Type your guess...". User's guess appears as chat bubble.
- **Result phase** (Session 10): Background transitions to teal (#60b0a0, correct) or red (#b06060, incorrect). Persistent floating particles via `spawnPersistentParticles()`. Large serif italic heading ("Yes, it is" / "Oh no!") + subtitle ("You win!!!" / "Better luck next time"). Bordered "Play again" + "Back to Menu" buttons. Particles cleaned up on restart/unmount.

### Design System

**`src/variables.css`** — CSS custom properties for all design tokens:
- Fonts: `--font-serif` (Instrument Serif), `--font-sans` (Instrument Sans), `--font-input` (Inter)
- Font sizes: `--text-xs` (14px) through `--text-4xl` (48px)
- Colors: backgrounds (`--bg-primary`, `--bg-card`, `--bg-input`, `--bg-overlay*`), text (dark/light/muted variants), borders
- Gradients: `--gradient-orb-1` through `--gradient-orb-4` for decorative blurs
- Glows/shadows: `--glow-text`, `--glow-card`, `--glow-card-hover`, `--glow-input`
- Focus outline, border radii (`--radius-sm`, `--radius-md`), transitions (`--transition-fast/normal/slow`)

### Styling

All component CSS files import `@import '../variables.css'` and use CSS custom properties throughout.

- **`src/components/Button.css`** — Base `.btn` reset: no background/border, Instrument Serif italic, text-shadow glow, focus outline.
- **`src/components/ModeSelection.css`** — Matches game mode styling: `#bfbff6` purple background, gradient blur orbs, frosted-glass cards, Instrument fonts, `.mode-btn` bordered buttons.
- **`src/components/AIGuesserMode.css`** — Background, layout, answer buttons, phase-based background transitions (playing/final-guess/result), final-guess buttons, result screen, persistent particle keyframe, error states.
- **`src/components/UserGuesserMode.css`** — **REWRITTEN in Session 9, updated Session 10**. Chat-based layout with chat bubbles, prev-questions panel, pull-down button with answer-type gradient/glow, answer-type color modifiers for bubbles and prev-rows, thinking pulse animation, input box. Phase-based background transitions: final-guess (orange #c09060 + brown input theming), result-correct (teal #60b0a0), result-incorrect (red #b06060). Result screen with serif italic text + bordered buttons. persistentDrift keyframe for particles.
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
- **UserGuesserMode** uses `conversationHistory` for API calls + `currentQuestion` / `aiResponse` strings for display + `questionLog` array for prev-questions panel
- **AIGuesserMode** uses `conversationHistory` for API calls + `currentQuestion` string for display

### AI Guesser Flow
Mount → `initializeAIGuesser()` → first question on card → user taps Yes/No/Sometimes/Unsure (or swipes) → `continueAIGuesser(history, prompt)` → card updates → increment counter → check game-end → loop → end screen: Yes/No confirmation → result + Play Again/Main Menu

### User Guesser Flow
Mount → `initializeUserGuesser()` → AI ready message (shown in AI bubble) → user types question → user bubble appears + AI "hmmm..." bubble → `answerUserQuestion(history, prompt)` → AI answer in colored bubble → 5s auto-archive (or next question) archives to panel → increment counter → at Q20: 500ms archive → **final-guess phase** (orange bg, "Final Guess" counter, brown input) → user types guess → guess bubble → AI responds → **result phase** (teal/red bg, particles, heading + subtitle, Play again / Back to Menu)

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

### Session 9: User Guesser Mode Redesign — Chat-Based UI with Answer-Type Colors
- **Full rewrite** of `UserGuesserMode.jsx` and `UserGuesserMode.css` from card-based to chat-based UI
- **Chat bubbles**: AI answer (left, italic serif, tail bottom-left) + user question (right, sans-serif, tail bottom-right). AI shows "hmmm..." with pulse while thinking, then colored answer
- **Answer type detection**: `getAnswerType()` parses AI response first word → yes/no/sometimes/unsure
- **Question shortening**: `shortenQuestion()` strips "Is it " prefix, prepends answer-type prefix ("Is ", "Not ", "Sometimes ", "Unsure if ")
- **Previous questions panel**: Collapsible log at top showing archived Q&As, color-coded by answer type. Uses `justify-content: flex-end` to show most recent items when collapsed (max-height: 86px = 2 rows)
- **Pull-down button**: Circular button with gradient fill + glow matching the most recently archived answer's type. Chevron rotates on expand/collapse
- **Color system**: Derived from AIGuesserMode `SWIPE_CONFIG.glow` — green (yes), red (no), yellow (sometimes), white (unsure). Applied to chat bubbles, prev-question rows, and pull-down button as pastel backgrounds + colored glows
- **User tweaks**: Adjusted prev-question row sizes (removed fixed height, 14px font, 32px line-height), pull-down button gradients changed to radial for yes/no, commented out placeholder bubble

### Session 10: Auto-Archive + Endgame Flows (Both Modes)

**Auto-archive for UserGuesserMode**:
- Q&A archives to prev-questions log after 5 seconds OR when user asks next question (whichever first)
- Uses `archiveTimerRef` + `currentQARef` refs + `useCallback` to avoid stale closures in timer callbacks
- `questionCountRef` keeps ref in sync with state for archive callback to check Q20 transition

**AIGuesserMode final guess flow** (from Figma):
- Three-phase system: `gamePhase` derived as `'playing' | 'final-guess' | 'result'`
- **Final guess**: Orange background (#c09060), simple Yes/No buttons, card still swipeable
- **Result**: Teal (#60b0a0) for correct, red (#b06060) for incorrect. `spawnPersistentParticles(rect)` creates 25 blurred white DOM circles with CSS `persistentDrift` keyframe. Cleaned up on restart/unmount via `particlesRef`
- Phase-based CSS: `transition: background 0.8s ease` on container + all gradient orb pseudo-elements
- User tweaked persistent particle params (count=25, dist*50, %20, drift*100)

**UserGuesserMode endgame flow** (from Figma):
- Three-phase system: `gamePhase` state ('playing' | 'final-guess' | 'result')
- **Playing → final-guess transition**: After Q20 answer, 500ms archive delay (vs 5s for normal questions), `archiveCurrentQA` checks `questionCountRef >= 20` to set phase
- **Final guess phase**: Orange background matching AIGuesserMode, counter shows "Final Guess", input re-themed brown (#60330b bg, #9aa8c6 border), placeholder "Type your guess...", same form reused with `onSubmit` switching handler based on phase
- **Result phase**: Teal (correct) or red (incorrect) background, persistent floating particles, user's guess bubble stays visible, large serif italic heading ("Yes, it is" / "Oh no!") + subtitle ("You win!!!" / "Better luck next time"), bordered "Play again" + "Back to Menu" buttons
- Removed old `gameEnded`, `finalGuessInput`, `handleRevealAnswer` in favor of phase system
- Correct/incorrect detected by checking if AI response starts with "yes"

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
| `src/components/UserGuesserMode.jsx` | User guesser: chat-based UI with answer-type colors |
| `src/components/UserGuesserMode.css` | User guesser: chat bubbles, prev-questions, pull-down |
| `src/components/ModeSelection.jsx` | Mode selection homepage |
| `src/components/ModeSelection.css` | Mode selection styles |
| `src/components/SwipeCard.jsx` | Draggable card with glow + particles |
| `src/components/SwipeCard.css` | SwipeCard styles + animation |
| `src/components/GameMode.css` | Legacy (unused) |
| `src/App.jsx` | Root navigation |
| `.env` | API key + mock toggle |

---

**Last Updated**: February 12, 2026
