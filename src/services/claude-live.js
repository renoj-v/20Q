import Anthropic from '@anthropic-ai/sdk';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey || apiKey === 'your_api_key_here') {
  console.error('Anthropic API key is not configured. Please set VITE_ANTHROPIC_API_KEY in your .env file.');
}

const anthropic = new Anthropic({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Note: In production, use a backend server
});

export const sendMessage = async (messages, systemPrompt = '') => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(error.message || 'Failed to communicate with Claude AI');
  }
};

export const initializeAIGuesser = async () => {
  const systemPrompt = `You are playing 20 Questions. The user is thinking of an object, and you need to guess it by asking up to 20 yes/no questions.

Rules:
- Ask only YES/NO questions
- You have maximum 20 questions
- Make strategic questions that eliminate possibilities
- After receiving answers, think logically about what the object could be
- When you're confident (or on question 20), make your final guess by saying "Is it [object]?"
- Be concise and clear in your questions`;

  const messages = [
    {
      role: 'user',
      content: 'I am thinking of an object. You can ask me up to 20 yes/no questions to guess what it is. Start by asking your first question.'
    }
  ];

  const firstQuestion = await sendMessage(messages, systemPrompt);
  return { firstQuestion, systemPrompt };
};

export const continueAIGuesser = async (conversationHistory, systemPrompt) => {
  try {
    const response = await sendMessage(conversationHistory, systemPrompt);
    return response;
  } catch (error) {
    throw error;
  }
};

export const initializeUserGuesser = async () => {
  const systemPrompt = `You are playing 20 Questions. You are thinking of a specific object, and the user will ask you up to 20 yes/no questions to guess it.

Rules:
- Pick a random, common object (household item, animal, food, vehicle, etc.)
- Answer ONLY with "Yes", "No", or "Maybe/Sometimes" (for ambiguous questions)
- Be consistent with your answers
- Keep track of the question count
- After 20 questions, reveal the object if not guessed
- If the user guesses correctly, confirm it enthusiastically

Pick an object now and remember it throughout the conversation. Don't reveal it until the user guesses or reaches 20 questions.`;

  const messages = [
    {
      role: 'user',
      content: 'I want to play 20 questions. Think of an object, and I will ask you yes/no questions to guess it. Let me know when you\'re ready and have thought of something.'
    }
  ];

  const response = await sendMessage(messages, systemPrompt);
  return { response, systemPrompt };
};

export const answerUserQuestion = async (conversationHistory, systemPrompt) => {
  try {
    const response = await sendMessage(conversationHistory, systemPrompt);
    return response;
  } catch (error) {
    throw error;
  }
};
