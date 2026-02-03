import React, { useState, useEffect, useRef } from 'react';
import { initializeUserGuesser, answerUserQuestion } from '../services/claude';
import './UserGuesserMode.css';

const UserGuesserMode = ({ onBackToMenu }) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [cardKey, setCardKey] = useState(0);
  const [finalGuessInput, setFinalGuessInput] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && !isLoading && !gameEnded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameStarted, isLoading, gameEnded]);

  const initializeGame = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setGameEnded(false);
      setCurrentQuestion('');
      setAiResponse('');
      setQuestionCount(0);
      setFinalResult('');
      setFinalGuessInput('');

      const { response, systemPrompt: prompt } = await initializeUserGuesser();

      setSystemPrompt(prompt);
      setAiResponse(response);
      setConversationHistory([
        { role: 'user', content: 'I want to play 20 questions. Think of an object, and I will ask you yes/no questions to guess it. Let me know when you\'re ready and have thought of something.' },
        { role: 'assistant', content: response }
      ]);

      setGameStarted(true);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || gameEnded || isLoading || questionCount >= 20) return;

    try {
      setIsLoading(true);
      setError(null);

      const question = userInput;
      setUserInput('');
      setCurrentQuestion(question);
      setAiResponse('');
      setCardKey(prev => prev + 1);

      const newQuestionCount = questionCount + 1;
      setQuestionCount(newQuestionCount);

      let questionWithCount = question;
      if (newQuestionCount >= 20) {
        questionWithCount += '\n\n(This is question 20 - my last question!)';
      }

      const updatedHistory = [...conversationHistory, { role: 'user', content: questionWithCount }];
      const aiResp = await answerUserQuestion(updatedHistory, systemPrompt);

      setAiResponse(aiResp);
      setConversationHistory([...updatedHistory, { role: 'assistant', content: aiResp }]);

      if (newQuestionCount >= 20) {
        setTimeout(() => {
          setGameEnded(true);
        }, 500);
      }

      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleFinalGuess = async () => {
    if (!finalGuessInput.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const guess = finalGuessInput;
      setFinalGuessInput('');

      const finalMessage = {
        role: 'user',
        content: `Is it ${guess}? Please tell me if I guessed correctly and reveal what the object was.`
      };

      const newHistory = [...conversationHistory, finalMessage];
      const aiResp = await answerUserQuestion(newHistory, systemPrompt);

      setFinalResult(aiResp);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResp }]);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleRevealAnswer = async () => {
    try {
      setIsLoading(true);
      const revealMessage = {
        role: 'user',
        content: 'I give up! Please reveal what object you were thinking of.'
      };

      const newHistory = [...conversationHistory, revealMessage];
      const aiResp = await answerUserQuestion(newHistory, systemPrompt);

      setFinalResult(aiResp);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResp }]);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="user-guesser">
        <div className="user-guesser-bg" />
        <button onClick={onBackToMenu} className="user-guesser-back">&larr; Back</button>
        <div className="user-guesser-error">
          <h2>Error</h2>
          <p>{error}</p>
          <p>Make sure your API key is properly configured in the .env file.</p>
          <button onClick={onBackToMenu} className="user-guesser-end-btn">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-guesser">
      <div className="user-guesser-bg" />
      <button onClick={onBackToMenu} className="user-guesser-back">&larr; Back</button>

      <div className="user-guesser-main">
        {/* AI response above the card */}
        {aiResponse && (
          <div className={`user-guesser-response${isLoading ? ' loading' : ''}`}>
            {aiResponse}
          </div>
        )}

        {/* Card showing the user's current question */}
        {currentQuestion ? (
          <div className="user-guesser-card" key={cardKey}>
            <p className="user-guesser-card-text">{currentQuestion}</p>
          </div>
        ) : (
          <div className="user-guesser-card">
            <p className="user-guesser-card-text">
              {isLoading ? 'AI is thinking of an object...' : 'Ask your first question!'}
            </p>
          </div>
        )}
      </div>

      {!gameEnded ? (
        <>
          {/* Question counter */}
          <div className="user-guesser-counter">
            Question {questionCount} of 20
          </div>

          {/* Input area */}
          <div className={`user-guesser-input-area${isLoading || !gameStarted ? ' disabled' : ''}`}>
            <form className="user-guesser-form" onSubmit={handleAskQuestion}>
              <input
                ref={inputRef}
                type="text"
                className="user-guesser-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask a yes/no question..."
                disabled={isLoading || !gameStarted || questionCount >= 20}
              />
              <button
                type="submit"
                className="user-guesser-submit"
                disabled={isLoading || !gameStarted || !userInput.trim() || questionCount >= 20}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="user-guesser-end">
          {finalResult ? (
            <>
              <h3>{finalResult}</h3>
              <div className="user-guesser-end-buttons">
                <button onClick={initializeGame} className="user-guesser-end-btn">Play Again</button>
                <button onClick={onBackToMenu} className="user-guesser-end-btn">Main Menu</button>
              </div>
            </>
          ) : (
            <>
              <h3>20 Questions Up!</h3>
              <p>Make your final guess or reveal the answer.</p>
              <div className="user-guesser-final-guess">
                <input
                  type="text"
                  className="user-guesser-final-input"
                  value={finalGuessInput}
                  onChange={(e) => setFinalGuessInput(e.target.value)}
                  placeholder="Type your guess..."
                  disabled={isLoading}
                />
                <button
                  onClick={handleFinalGuess}
                  className="user-guesser-final-submit"
                  disabled={isLoading || !finalGuessInput.trim()}
                >
                  Guess
                </button>
              </div>
              <div className="user-guesser-end-buttons">
                <button onClick={handleRevealAnswer} className="user-guesser-end-btn" disabled={isLoading}>
                  Give Up &amp; Reveal
                </button>
                <button onClick={initializeGame} className="user-guesser-end-btn">Play Again</button>
                <button onClick={onBackToMenu} className="user-guesser-end-btn">Main Menu</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserGuesserMode;
