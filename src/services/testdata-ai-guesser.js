// Test data for AI Guesser Mode
// The AI is trying to guess the user's object.
// Scripted scenario: The AI narrows down to "piano" over 20 questions.
// These questions are served sequentially regardless of what the user answers.

export const AI_GUESSER_QUESTIONS = [
  "Let me start — is this a living thing?",
  "Can you find it indoors?",
  "Would it fit inside a microwave?",
  "Does it serve a decorative purpose?",
  "Can it produce sound?",
  "Does it run on electricity?",
  "Would you call it a musical instrument?",
  "Does it belong to the string family?",
  "Does it have keys?",
  "Can more than one person play it at the same time?",
  "Would you typically find it in a living room?",
  "Does it weigh more than 50 pounds?",
  "Does it have pedals?",
  "Can it play chords?",
  "Does it need to be tuned regularly?",
  "Would you see one in an orchestra?",
  "Does it have black and white keys?",
  "Can you stand it upright against a wall?",
  "Has it been around for more than 200 years?",
  "My final guess — is it a piano?",
];

// If the user keeps answering past all scripted questions, repeat a filler.
export const AI_GUESSER_FALLBACK =
  "I've run out of questions! My final guess is a piano.";
