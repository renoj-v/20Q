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

**`src/components/AIGuesserMode.jsx`** — AI asks questions, user answers Yes/No/Sometimes/Unsure. **REDESIGNED in Session 5** to card-based UI matching Figma.
- State: conversationHistory, systemPrompt, questionCount, isLoading, error, gameEnded, currentQuestion, finalMessage
- No longer uses `messages` array or chat bubbles — shows only the current AI question on a frosted-glass card
- Answer buttons: Yes/No as stylized rotated italic labels with arrows; Sometimes/Unsure as full-width bordered buttons
- Game-end detection unchanged: explicit final-guess phrases OR `questionCount >= 10` + `/\bis it [a-z]/`
- Imports `AIGuesserMode.css` (dedicated) instead of `GameMode.css`

**`src/components/UserGuesserMode.jsx`** — User asks questions, AI answers.
- State: messages, conversationHistory, systemPrompt, questionCount, isLoading, error, gameEnded, userInput, gameStarted
- Game ends at questionCount >= 20, then shows final guess UI
- `handleFinalGuess()` sends `"Is it [guess]?"`, `handleRevealAnswer()` sends give-up message

### Styling

- **`src/App.css`** — Purple gradient background (#667eea → #764ba2). AI Guesser overrides this with its own full-viewport background.
- **`src/index.css`** — CSS reset, Segoe UI font
- **`src/components/ModeSelection.css`** — Grid layout, hover effects, responsive
- **`src/components/GameMode.css`** — Styles for UserGuesserMode only (chat bubbles, answer buttons, etc.). No longer used by AIGuesserMode.
- **`src/components/AIGuesserMode.css`** — **NEW in Session 5**. Dark navy (#151539) background with blurred radial gradient decorations. Frosted-glass card (white 50%, 8px radius, white glow). Instrument Serif/Sans fonts. Stylized Yes/No labels with rotation and arrows. Full-width bordered Sometimes/Unsure buttons. Game-end and error states in dark theme. Responsive.

### Config

- **`.env`** — `VITE_ANTHROPIC_API_KEY=<key>` and `VITE_USE_MOCK=true`
- **`.env.example`** — Template with both vars documented
- **`.gitignore`** — Excludes `.env`

---

## DATA FLOW

### Message Tracking
- **UserGuesserMode** uses two parallel arrays: display (`messages`) and API (`conversationHistory`)
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
- **Changes made**:
  - `index.html`: Added Google Fonts imports (Instrument Serif italic, Instrument Sans 400-700)
  - `src/components/AIGuesserMode.css`: Created new dedicated stylesheet matching Figma design
  - `src/components/AIGuesserMode.jsx`: Rewrote UI from chat-bubbles to card-based. Removed `messages` array, `useRef`, scroll logic. Added `currentQuestion` and `finalMessage` state. All game logic preserved unchanged.
- **Not changed**: `GameMode.css` (still used by UserGuesserMode), `UserGuesserMode.jsx`, `ModeSelection.jsx/css`, service layer, `App.jsx`
- **PENDING**: UserGuesserMode has not been redesigned to match Figma yet. It still uses the old chat-bubble layout with `GameMode.css`.

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
| `src/components/AIGuesserMode.css` | AI guesser card-based styles (Figma) |
| `src/components/GameMode.css` | UserGuesserMode chat-bubble styles |
| `src/App.jsx` | Root navigation |
| `.env` | API key + mock toggle |

---

**Last Updated**: February 3, 2026
