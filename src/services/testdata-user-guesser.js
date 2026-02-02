// Test data for User Guesser Mode
// The AI has "thought of" a banana. The user asks questions and guesses.
// Answers are returned in order regardless of what the user actually asks.

export const USER_GUESSER_OBJECT = "banana";

export const USER_GUESSER_READY_MESSAGE =
  "I've thought of an object! Go ahead and ask me up to 20 yes/no questions to figure out what it is.";

export const USER_GUESSER_ANSWERS = [
  "No.",   // Q1  (e.g. "Is it alive?")
  "No.",   // Q2  (e.g. "Is it man-made?")
  "Yes.",  // Q3  (e.g. "Is it a natural thing?")
  "Yes.",  // Q4  (e.g. "Is it edible?")
  "Yes.",  // Q5  (e.g. "Is it a fruit?")
  "Yes.",  // Q6  (e.g. "Can you buy it at a grocery store?")
  "Yes.",  // Q7  (e.g. "Does it grow on a tree?")
  "Yes.",  // Q8  (e.g. "Is it yellow?")
  "No.",   // Q9  (e.g. "Is it round?")
  "Yes.",  // Q10 (e.g. "Is it long/curved?")
  "No.",   // Q11 (e.g. "Does it have seeds you eat?")
  "Yes.",  // Q12 (e.g. "Do you peel it before eating?")
  "No.",   // Q13 (e.g. "Is it citrus?")
  "Yes.",  // Q14 (e.g. "Is it tropical?")
  "No.",   // Q15 (e.g. "Is it a mango?")
  "No.",   // Q16 (e.g. "Is it a pineapple?")
  "Yes.",  // Q17 (e.g. "Is it commonly found in a bunch?")
  "Yes.",  // Q18 (e.g. "Do monkeys like it?")
  "Yes.",  // Q19 (e.g. "Is it soft inside?")
  "Yes.",  // Q20 (e.g. "Is it cheap?")
];

// When the user types a final guess, always confirm it's correct.
export const USER_GUESSER_CORRECT_RESPONSE =
  "Yes, that's correct! The answer is a banana! Great job guessing it!";

// If user gives up
export const USER_GUESSER_REVEAL_RESPONSE =
  "The object I was thinking of was a banana!";

// Fallback if questions exceed the scripted list
export const USER_GUESSER_FALLBACK = "Yes.";
