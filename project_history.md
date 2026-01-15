# AI-Readable Project Context: 20 Questions Game

## PURPOSE
This document provides complete project context for AI assistants to understand what was built, how it works, and how to work with this codebase.

---

## WHAT WAS BUILT

A fully functional web-based 20 Questions game with two distinct gameplay modes:

1. **AI Guesser Mode**: Human thinks of object → AI asks questions → AI guesses object
2. **User Guesser Mode**: AI thinks of object → Human asks questions → Human guesses object

**Technology**: React 19 + Vite 7.3.1 + Anthropic Claude API (claude-sonnet-4-20250514)

---

## FILE STRUCTURE AND RESPONSIBILITIES

### Core Application Files

**`src/App.jsx`** (Root Component)
- Manages top-level state: `gameMode` (null | 'ai-guesser' | 'user-guesser')
- Conditionally renders: ModeSelection OR AIGuesserMode OR UserGuesserMode
- Provides callbacks: `handleSelectMode(mode)`, `handleBackToMenu()`
- No game logic - pure navigation/routing

**`src/main.jsx`** (Entry Point)
- Standard React 19 entry: `ReactDOM.createRoot()` → renders `<App />`
- Imports `src/index.css` for global styles

**`src/index.css`** (Global Styles)
- CSS reset (box-sizing, margin, padding)
- Base typography: Segoe UI font family
- Global button and input styling
- No component-specific styles

**`src/App.css`** (App Container Styles)
- `.app` class: purple gradient background (#667eea → #764ba2), full viewport height
- Minimal styling - just background layer

---

### Service Layer

**`src/services/claude.js`** (API Integration)

**Purpose**: All Anthropic API communication happens here

**Configuration**:
```javascript
- API key from: import.meta.env.VITE_ANTHROPIC_API_KEY
- Model: 'claude-sonnet-4-20250514'
- SDK setting: dangerouslyAllowBrowser: true (browser-side API calls)
- Max tokens: 1024
```

**Exported Functions**:

1. **`sendMessage(messages, systemPrompt)`**
   - Core API wrapper
   - Takes: array of {role, content}, system prompt string
   - Returns: string (AI response text)
   - Throws: Error with message on failure

2. **`initializeAIGuesser()`**
   - Sets up AI Guesser mode
   - Returns: `{ firstQuestion: string, systemPrompt: string }`
   - System prompt instructs AI to ask strategic yes/no questions, max 20

3. **`continueAIGuesser(conversationHistory, systemPrompt)`**
   - Continues AI Guesser conversation
   - Takes: full message history array, system prompt
   - Returns: next AI question/guess string

4. **`initializeUserGuesser()`**
   - Sets up User Guesser mode
   - AI picks random object internally
   - Returns: `{ response: string, systemPrompt: string }`
   - System prompt instructs AI to answer only Yes/No/Maybe

5. **`answerUserQuestion(conversationHistory, systemPrompt)`**
   - Responds to user's question in User Guesser mode
   - Takes: full message history, system prompt
   - Returns: AI answer string

---

### UI Components

**`src/components/ModeSelection.jsx`** (Game Menu)

**State**: None (stateless component)

**Props**:
- `onSelectMode(mode)` - callback when user clicks a mode card

**UI Elements**:
- Title "20 Questions"
- Two clickable mode cards:
  - AI Guesser card (🤖 icon) → calls `onSelectMode('ai-guesser')`
  - User Guesser card (🧠 icon) → calls `onSelectMode('user-guesser')`
- Instructions section explaining game rules

**Styling**: `ModeSelection.css` - grid layout, hover effects, responsive design

---

**`src/components/AIGuesserMode.jsx`** (AI Asks Questions)

**State Variables**:
- `messages` - Array of display messages: `[{role: 'system'|'ai'|'user', content: string}]`
- `conversationHistory` - Array for API: `[{role: 'user'|'assistant', content: string}]`
- `systemPrompt` - String, set once at initialization
- `questionCount` - Number (1-20)
- `isLoading` - Boolean for API call state
- `error` - String or null
- `gameEnded` - Boolean (true when 20 questions reached or AI makes guess)
- `userInput` - String for custom answer input

**Props**:
- `onBackToMenu()` - callback to return to mode selection

**Lifecycle**:
1. `useEffect(() => startGame(), [])` on mount → calls `initializeAIGuesser()`
2. First AI question displayed automatically
3. User answers via buttons (Yes/No/Maybe) or custom text input
4. Each answer → `handleAnswer()` → calls `continueAIGuesser()` → increments `questionCount`
5. Game ends when `questionCount >= 20` or AI response contains "is it"

**UI Sections**:
- Header: Back button, title, question counter (X/20)
- Chat container: Scrollable message history with auto-scroll
- Answer buttons: Yes (green), No (red), Maybe (yellow)
- Custom answer form: Text input + Send button
- Game end overlay: "Play Again" and "Main Menu" buttons

**Key Behaviors**:
- Auto-scrolls to bottom when new messages added
- Disables input during loading
- Shows "Thinking..." animation during API calls
- Error screen with helpful hints if API fails

---

**`src/components/UserGuesserMode.jsx`** (User Asks Questions)

**State Variables**:
- `messages` - Display message array (same structure as AI Guesser)
- `conversationHistory` - API message array
- `systemPrompt` - String
- `questionCount` - Number (0-20)
- `isLoading` - Boolean
- `error` - String or null
- `gameEnded` - Boolean
- `userInput` - String for question input
- `gameStarted` - Boolean (true after AI confirms it's ready)

**Props**:
- `onBackToMenu()` - callback

**Lifecycle**:
1. `useEffect(() => initializeGame(), [])` → calls `initializeUserGuesser()`
2. AI confirms it has thought of an object
3. User types questions → form submit → `handleAskQuestion()` → calls `answerUserQuestion()`
4. Question counter increments with each question
5. At 20 questions → `gameEnded = true` → final guess interface appears

**UI Sections**:
- Header: Back button, title, question counter
- Chat container: Message history
- Question input form: Text field + "Ask" button (disabled after 20 questions)
- Game end section:
  - Final guess input + "Submit Guess" button
  - "Give Up & Reveal Answer" button → calls `handleRevealAnswer()`
  - "Play Again" and "Main Menu" buttons

**Key Behaviors**:
- Tracks question count separately from message count
- Appends "(This is question 20 - my last question!)" to 20th question
- Final guess sends: "Is it [guess]? Please tell me if I guessed correctly..."
- Give up sends: "I give up! Please reveal what object you were thinking of."

---

### Styling Files

**`src/components/ModeSelection.css`**
- Grid layout for mode cards (auto-fit minmax(300px, 1fr))
- Card hover effects: translateY(-5px), shadow increase
- Responsive: single column on mobile (<768px)
- Purple/blue color scheme matching app background

**`src/components/GameMode.css`** (Shared by both game modes)
- `.game-mode`: Flexbox column layout, full viewport height
- `.game-header`: Space-between layout with back button, title, counter
- `.chat-container`: Flex-1 (takes remaining space), scrollable, white background
- `.message`: Fade-in animation, max-width 80%
  - `.message.system`: Gray, centered, italic (game status messages)
  - `.message.ai`: Blue background (#e3f2fd), left-aligned
  - `.message.user`: Green background (#c8e6c9), right-aligned
- `.answer-buttons`: Flex row with Yes/No/Maybe buttons
- `.question-counter`: Blue badge (#007bff) with white text, rounded
- `.game-end`: White card with buttons for restart/menu
- Responsive: Mobile (<768px) stacks buttons vertically, messages take 90% width

---

## DATA FLOW PATTERNS

### AI Guesser Mode Flow

```
1. Component mounts
   ↓
2. startGame() called
   ↓
3. initializeAIGuesser() → API call
   ↓
4. Returns: { firstQuestion, systemPrompt }
   ↓
5. State updated:
   - messages: [system message, AI message]
   - conversationHistory: [user setup, assistant question]
   - questionCount: 1
   ↓
6. User clicks answer button
   ↓
7. handleAnswer(answer) called
   ↓
8. State updated: add user message to both arrays
   ↓
9. continueAIGuesser(history, prompt) → API call
   ↓
10. AI response added to state
    ↓
11. questionCount incremented
    ↓
12. Check if game should end
    ↓
13. Loop back to step 6 (or show game end screen)
```

### User Guesser Mode Flow

```
1. Component mounts
   ↓
2. initializeGame() called
   ↓
3. initializeUserGuesser() → API call
   ↓
4. Returns: { response, systemPrompt }
   ↓
5. State updated: AI confirms ready, gameStarted = true
   ↓
6. User types question and submits
   ↓
7. handleAskQuestion() called
   ↓
8. questionCount incremented first
   ↓
9. Question added to conversationHistory
   ↓
10. answerUserQuestion(history, prompt) → API call
    ↓
11. AI answer added to state
    ↓
12. If questionCount >= 20, set gameEnded = true
    ↓
13. Loop back to step 6 (or show final guess interface)
```

---

## CONVERSATION HISTORY FORMAT

Both modes maintain two parallel arrays:

**Display Array (`messages`)**:
```javascript
[
  { role: 'system', content: 'Game instructions...' },
  { role: 'ai', content: 'Is it a living thing?' },
  { role: 'user', content: 'Yes' }
]
```

**API Array (`conversationHistory`)**:
```javascript
[
  { role: 'user', content: 'Setup message...' },
  { role: 'assistant', content: 'Is it a living thing?' },
  { role: 'user', content: 'Yes' }
]
```

**Why Two Arrays?**
- Display array includes 'system' role messages for user guidance
- API array only has 'user' and 'assistant' (required by Anthropic API)
- Display uses 'ai' for readability, API uses 'assistant' (API requirement)

---

## SYSTEM PROMPTS

### AI Guesser System Prompt
```
You are playing 20 Questions. The user is thinking of an object, and you need to guess it by asking up to 20 yes/no questions.

Rules:
- Ask only YES/NO questions
- You have maximum 20 questions
- Make strategic questions that eliminate possibilities
- After receiving answers, think logically about what the object could be
- When you're confident (or on question 20), make your final guess by saying "Is it [object]?"
- Be concise and clear in your questions
```

### User Guesser System Prompt
```
You are playing 20 Questions. You are thinking of a specific object, and the user will ask you up to 20 yes/no questions to guess it.

Rules:
- Pick a random, common object (household item, animal, food, vehicle, etc.)
- Answer ONLY with "Yes", "No", or "Maybe/Sometimes" (for ambiguous questions)
- Be consistent with your answers
- Keep track of the question count
- After 20 questions, reveal the object if not guessed
- If the user guesses correctly, confirm it enthusiastically

Pick an object now and remember it throughout the conversation. Don't reveal it until the user guesses or reaches 20 questions.
```

---

## ENVIRONMENT CONFIGURATION

**Required Environment Variable**:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

**Files**:
- `.env` - Contains actual API key (gitignored, not in repository)
- `.env.example` - Template file showing required format

**Vite Requirement**: Environment variables must be prefixed with `VITE_` to be exposed to client-side code.

**Access in Code**: `import.meta.env.VITE_ANTHROPIC_API_KEY`

---

## BUILD INFORMATION

**Development Server**:
```bash
npm run dev  # Starts on http://localhost:5173
```

**Production Build**:
```bash
npm run build  # Outputs to dist/ directory
```

**Build Results**:
- JavaScript bundle: ~273KB (~82KB gzipped)
- CSS bundle: ~6KB (~1.6KB gzipped)
- No build errors or warnings
- All 85 modules transformed successfully

---

## DEPENDENCIES

**Production Dependencies**:
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@anthropic-ai/sdk": "^0.36.0"
}
```

**Dev Dependencies** (from Vite template):
```json
{
  "@vitejs/plugin-react": "^4.3.4",
  "vite": "^7.3.1",
  "eslint": "^9.17.0",
  "@eslint/js": "^9.17.0",
  "eslint-plugin-react": "^7.37.2",
  "eslint-plugin-react-hooks": "^5.0.0",
  "eslint-plugin-react-refresh": "^0.4.16",
  "globals": "^15.13.0"
}
```

---

## IMPORTANT TECHNICAL DETAILS FOR AI ASSISTANTS

### When Modifying This Codebase

1. **API Service Layer**: All Anthropic API calls must go through `src/services/claude.js`. Never make direct API calls from components.

2. **Message History**: Always maintain both display array and API array in sync. Display array can have extra 'system' messages, but API array should only have user/assistant pairs.

3. **Question Counter**: Incremented at different times in each mode:
   - AI Guesser: After AI asks question
   - User Guesser: Before sending question to API

4. **Game End Conditions**:
   - AI Guesser: `questionCount >= 20` OR AI message contains "is it" (case insensitive)
   - User Guesser: `questionCount >= 20`

5. **Loading States**: Always set `isLoading = true` before API calls, `false` after. Disable all input during loading.

6. **Error Handling**: Catch all API errors, display user-friendly message with hint about API key configuration.

7. **Auto-Scroll**: Use `useRef` + `scrollIntoView({ behavior: 'smooth' })` triggered by `useEffect` watching messages array.

8. **Styling Changes**:
   - Mode selection: Edit `ModeSelection.css`
   - Both game modes: Edit `GameMode.css` (shared styles)
   - Background gradient: Edit `App.css`
   - Global resets: Edit `index.css`

### Common Modification Scenarios

**Adding a new game mode**:
1. Create new component in `src/components/NewMode.jsx`
2. Add mode button to `ModeSelection.jsx`
3. Add conditional render in `App.jsx`: `{gameMode === 'new-mode' && <NewMode />}`
4. If using Claude API, add initialization function to `src/services/claude.js`

**Changing AI model**:
- Edit `src/services/claude.js`, line with `model: 'claude-sonnet-4-20250514'`

**Adjusting question limit**:
- Search codebase for `20` and `questionCount >= 20`
- Update both game mode components and system prompts

**Modifying system prompts**:
- Edit prompt strings in `initializeAIGuesser()` and `initializeUserGuesser()` functions
- System prompts are set once at game start, stored in state

**Adding conversation features** (hints, undo, etc.):
- Add new buttons to appropriate game mode component
- Manipulate `conversationHistory` array (remove last N messages for undo)
- May need to adjust `questionCount` if undoing questions

### State Management Notes

**No global state management** (Redux, Context, etc.) - all state is local to components:
- `App.jsx`: Only tracks `gameMode` (which screen to show)
- `AIGuesserMode.jsx`: All AI guesser game state
- `UserGuesserMode.jsx`: All user guesser game state

State is intentionally isolated - restarting game reinitializes component state.

### Testing Approach

**Manual Testing Checklist**:
1. Mode selection screen displays correctly
2. Both game modes initialize without errors
3. Question counter increments properly
4. Game ends at 20 questions
5. Restart button resets state
6. Back button returns to menu
7. Error handling shows when API key missing/invalid
8. Responsive design works on mobile viewport
9. Loading states display during API calls
10. Messages auto-scroll to bottom

**No automated tests** included - this is a prototype/demo project.

### Security Notes for AI Assistants

⚠️ **Critical**: This codebase uses `dangerouslyAllowBrowser: true` in Anthropic SDK configuration.

**What this means**:
- API key is exposed in browser (visible in Network tab)
- Acceptable ONLY for local development/demos
- NEVER deploy this configuration to production

**If asked about production deployment**:
- Recommend creating Node.js backend server
- Backend should store API key in environment variables
- Frontend should call backend API, not Anthropic directly
- Backend proxies requests to Anthropic API

**Example architecture recommendation**:
```
Browser → Your Backend Server → Anthropic API
         (API key hidden)       (API key used)
```

---

## PROJECT STATUS

**Completion Date**: January 15, 2026

**Status**: ✅ Fully functional and ready for use

**Build Status**: ✅ Production build verified successful

**Documentation**: ✅ README.md and this file provide complete coverage

**Known Issues**: None - all core functionality works as expected

**Limitations**:
- Client-side API calls (development pattern only)
- No persistent storage (games don't save)
- No user accounts or profiles
- No game history tracking

---

## QUICK REFERENCE: FILE PURPOSES

| File | Purpose | Modify When... |
|------|---------|---------------|
| `src/App.jsx` | Navigation logic | Adding new screens/modes |
| `src/services/claude.js` | API calls | Changing prompts, model, API behavior |
| `src/components/ModeSelection.jsx` | Game menu | Adding/removing game modes |
| `src/components/AIGuesserMode.jsx` | AI asks questions mode | Changing AI guesser gameplay |
| `src/components/UserGuesserMode.jsx` | User asks questions mode | Changing user guesser gameplay |
| `src/components/GameMode.css` | Game styling | Changing colors, layout, animations |
| `src/App.css` | Background | Changing gradient or page background |
| `src/index.css` | Base styles | Global typography, resets |
| `.env` | API key | Updating API credentials |

---

## FOR AI ASSISTANTS: WORKING WITH THIS PROJECT

### If asked to add features:
1. Identify which component(s) need modification
2. Check if API service changes needed
3. Consider state management impact
4. Update both game modes if feature applies to both
5. Test that question counter and game end logic still work

### If asked to debug issues:
1. Check browser console for API errors
2. Verify `.env` file exists and has valid key
3. Check `conversationHistory` array structure
4. Verify `questionCount` increments correctly
5. Confirm system prompts are appropriate for issue

### If asked to explain how something works:
1. Reference this document for architecture
2. Look at actual code file for implementation details
3. Explain data flow using patterns documented above
4. Use specific state variable names and function names

### If asked about deployment:
1. Warn about API key security issue
2. Recommend backend server approach
3. Explain production build process (`npm run build`)
4. Note that static hosting (Netlify, Vercel) works but exposes key

---

## CONVERSATION STARTERS FOR TESTING

If you need to test your understanding of this project, try explaining:

1. "How does the AI Guesser mode track question count?"
2. "Why are there two separate message arrays?"
3. "What happens when the user clicks 'Play Again'?"
4. "How does the app know when the game is over?"
5. "What would break if I removed the system prompt?"
6. "How would I add a 'hint' feature to User Guesser mode?"

All answers are derivable from this document and the actual code.

---

**Document Version**: 1.0 (AI-optimized)
**Last Updated**: January 15, 2026
**Maintained By**: This project context should be updated when significant architectural changes occur.
