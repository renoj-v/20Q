// Mock service that mirrors the claude.js API surface using canned test data.
// Responses are served from the test data files with a small artificial delay
// to simulate network latency.

import {
  AI_GUESSER_QUESTIONS,
  AI_GUESSER_FALLBACK,
} from './testdata-ai-guesser';

import {
  USER_GUESSER_READY_MESSAGE,
  USER_GUESSER_ANSWERS,
  USER_GUESSER_CORRECT_RESPONSE,
  USER_GUESSER_REVEAL_RESPONSE,
  USER_GUESSER_FALLBACK,
} from './testdata-user-guesser';

const FAKE_DELAY_MS = 400;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── AI Guesser Mode ──────────────────────────────────────────────────

let aiGuesserIndex = 0;

export const initializeAIGuesser = async () => {
  aiGuesserIndex = 0;
  await delay(FAKE_DELAY_MS);

  const firstQuestion = AI_GUESSER_QUESTIONS[aiGuesserIndex];
  aiGuesserIndex++;

  return {
    firstQuestion,
    systemPrompt: 'mock-system-prompt',
  };
};

export const continueAIGuesser = async (_conversationHistory, _systemPrompt) => {
  await delay(FAKE_DELAY_MS);

  if (aiGuesserIndex < AI_GUESSER_QUESTIONS.length) {
    const question = AI_GUESSER_QUESTIONS[aiGuesserIndex];
    aiGuesserIndex++;
    return question;
  }

  return AI_GUESSER_FALLBACK;
};

// ── User Guesser Mode ────────────────────────────────────────────────

let userGuesserIndex = 0;

export const initializeUserGuesser = async () => {
  userGuesserIndex = 0;
  await delay(FAKE_DELAY_MS);

  return {
    response: USER_GUESSER_READY_MESSAGE,
    systemPrompt: 'mock-system-prompt',
  };
};

export const answerUserQuestion = async (conversationHistory, _systemPrompt) => {
  await delay(FAKE_DELAY_MS);

  // Check if the latest user message looks like a final guess or give-up
  const lastUserMsg = conversationHistory
    .filter((m) => m.role === 'user')
    .pop();

  if (lastUserMsg) {
    const text = lastUserMsg.content.toLowerCase();
    if (text.includes('give up') || text.includes('i give up') || text.includes('reveal')) {
      return USER_GUESSER_REVEAL_RESPONSE;
    }
    if (text.includes('is it') || text.includes('my final guess') || text.includes('please tell me if')) {
      return USER_GUESSER_CORRECT_RESPONSE;
    }
  }

  // Normal question flow – serve next scripted answer
  if (userGuesserIndex < USER_GUESSER_ANSWERS.length) {
    const answer = USER_GUESSER_ANSWERS[userGuesserIndex];
    userGuesserIndex++;
    return answer;
  }

  return USER_GUESSER_FALLBACK;
};
