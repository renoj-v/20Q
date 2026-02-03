import React, { useState, useEffect } from 'react';
import { initializeAIGuesser, continueAIGuesser } from '../services/claude';
import './AIGuesserMode.css';

const AIGuesserMode = ({ onBackToMenu }) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [finalMessage, setFinalMessage] = useState('');

  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setGameEnded(false);
      setFinalMessage('');

      const { firstQuestion, systemPrompt: prompt } = await initializeAIGuesser();

      setSystemPrompt(prompt);
      setCurrentQuestion(firstQuestion);
      setConversationHistory([
        { role: 'user', content: 'I am thinking of an object. You can ask me up to 20 yes/no questions to guess what it is. Start by asking your first question.' },
        { role: 'assistant', content: firstQuestion }
      ]);
      setQuestionCount(1);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    if (gameEnded || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const userMessage = { role: 'user', content: answer };
      const newHistory = [...conversationHistory, userMessage];

      if (questionCount >= 20) {
        setGameEnded(true);
      }

      const aiResponse = await continueAIGuesser(newHistory, systemPrompt);

      setCurrentQuestion(aiResponse);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setQuestionCount(prev => prev + 1);
      setIsLoading(false);

      // Detect a final guess
      const lower = aiResponse.toLowerCase();
      const isFinalGuess =
        lower.includes('my final guess') ||
        lower.includes('my guess is') ||
        lower.includes('i think it is') ||
        lower.includes("i'm going to guess") ||
        lower.includes('i believe it is') ||
        (questionCount >= 10 && /\bis it [a-z]/.test(lower));
      if (isFinalGuess) {
        setFinalMessage(aiResponse);
        setGameEnded(true);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="ai-guesser">
        <div className="ai-guesser-bg" />
        <button onClick={onBackToMenu} className="ai-guesser-back">← Back</button>
        <div className="ai-guesser-error">
          <h2>Error</h2>
          <p>{error}</p>
          <p>Make sure your API key is properly configured in the .env file.</p>
          <button onClick={onBackToMenu} className="ai-guesser-end-btn">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-guesser">
      <div className="ai-guesser-bg" />
      <button onClick={onBackToMenu} className="ai-guesser-back">← Back</button>

      <div className="ai-guesser-counter">
        Question {questionCount} of 20
      </div>

      <div className="ai-guesser-card">
        <p className={`ai-guesser-card-text${isLoading && !currentQuestion ? ' loading' : ''}`}>
          {isLoading && !currentQuestion
            ? 'Thinking of a question...'
            : gameEnded && finalMessage
              ? finalMessage
              : currentQuestion}
        </p>
      </div>

      {!gameEnded ? (
        <div className={`ai-guesser-answers${isLoading ? ' disabled' : ''}`}>
          <div className="ai-guesser-yesno">
            <button onClick={() => handleAnswer('No')} className="ai-guesser-no">
              <span className="arrow">↰</span>
              <span className="label">No</span>
            </button>
            <button onClick={() => handleAnswer('Yes')} className="ai-guesser-yes">
              <span className="arrow">↱</span>
              <span className="label">Yes</span>
            </button>
          </div>
          <button onClick={() => handleAnswer('Sometimes')} className="ai-guesser-btn">
            Sometimes
          </button>
          <button onClick={() => handleAnswer('Unsure')} className="ai-guesser-btn">
            Unsure
          </button>
        </div>
      ) : (
        <div className="ai-guesser-end">
          <h3>Game Over!</h3>
          <p>Did the AI guess correctly?</p>
          <div className="ai-guesser-end-buttons">
            <button onClick={startGame} className="ai-guesser-end-btn">Play Again</button>
            <button onClick={onBackToMenu} className="ai-guesser-end-btn">Main Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGuesserMode;
