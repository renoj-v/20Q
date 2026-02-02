// Service router: switches between mock (test) and live (Claude API) mode.
//
// Set VITE_USE_MOCK=true  in .env for scripted test data (no API key needed).
// Set VITE_USE_MOCK=false in .env (or omit it) for live Claude API calls.

import * as mock from './mock.js';
import * as live from './claude-live.js';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

if (useMock) {
  console.log('[20Q] Running in TEST mode — using mock data, no API calls.');
} else {
  console.log('[20Q] Running in LIVE mode — using Claude API.');
}

const service = useMock ? mock : live;

export const initializeAIGuesser  = service.initializeAIGuesser;
export const continueAIGuesser    = service.continueAIGuesser;
export const initializeUserGuesser = service.initializeUserGuesser;
export const answerUserQuestion    = service.answerUserQuestion;
