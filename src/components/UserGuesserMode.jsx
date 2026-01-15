import React, { useState, useEffect, useRef } from 'react';
import { initializeUserGuesser, answerUserQuestion } from '../services/claude';
import './GameMode.css';

const UserGuesserMode = ({ onBackToMenu }) => {
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { response, systemPrompt: prompt } = await initializeUserGuesser();

      setSystemPrompt(prompt);
      setMessages([
        { role: 'system', content: 'The AI is thinking of an object. Ask yes/no questions to guess it!' },
        { role: 'ai', content: response }
      ]);

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

      const newMessages = [...messages, { role: 'user', content: question }];
      setMessages(newMessages);

      const newQuestionCount = questionCount + 1;
      setQuestionCount(newQuestionCount);

      const userMessage = { role: 'user', content: question };
      const newHistory = [...conversationHistory, userMessage];

      let questionWithCount = question;
      if (newQuestionCount >= 20) {
        questionWithCount += '\n\n(This is question 20 - my last question!)';
      }

      const updatedHistory = [...conversationHistory, { role: 'user', content: questionWithCount }];

      const aiResponse = await answerUserQuestion(updatedHistory, systemPrompt);

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setConversationHistory([...updatedHistory, { role: 'assistant', content: aiResponse }]);

      if (newQuestionCount >= 20) {
        setTimeout(() => {
          setGameEnded(true);
          setMessages(prev => [...prev, {
            role: 'system',
            content: 'You\'ve reached 20 questions! Make your final guess or ask the AI to reveal the object.'
          }]);
        }, 500);
      }

      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleFinalGuess = async () => {
    if (!userInput.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const guess = userInput;
      setUserInput('');

      const newMessages = [...messages, { role: 'user', content: `My final guess: ${guess}` }];
      setMessages(newMessages);

      const finalMessage = {
        role: 'user',
        content: `Is it ${guess}? Please tell me if I guessed correctly and reveal what the object was.`
      };

      const newHistory = [...conversationHistory, finalMessage];
      const aiResponse = await answerUserQuestion(newHistory, systemPrompt);

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setGameEnded(true);
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
      const aiResponse = await answerUserQuestion(newHistory, systemPrompt);

      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'I give up! What was it?' },
        { role: 'ai', content: aiResponse }
      ]);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setGameEnded(true);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="game-mode">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <p className="error-hint">Make sure your API key is properly configured in the .env file.</p>
          <button onClick={onBackToMenu} className="back-button">Back to Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-mode">
      <div className="game-header">
        <button onClick={onBackToMenu} className="back-button">← Back</button>
        <h2>User Guesser Mode</h2>
        <div className="question-counter">
          Question {questionCount}/20
        </div>
      </div>

      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.role === 'ai' && <strong>AI: </strong>}
              {msg.role === 'user' && <strong>You: </strong>}
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              <strong>AI: </strong>
              <span className="loading">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!gameEnded && gameStarted && (
        <form onSubmit={handleAskQuestion} className="question-form">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a yes/no question..."
            className="question-input"
            disabled={isLoading || questionCount >= 20}
          />
          <button
            type="submit"
            className="question-submit"
            disabled={isLoading || questionCount >= 20}
          >
            Ask
          </button>
        </form>
      )}

      {gameEnded && (
        <div className="game-end">
          <h3>Game Over!</h3>
          {questionCount >= 20 && (
            <>
              <p>Want to make a final guess?</p>
              <div className="final-guess-container">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your guess..."
                  className="guess-input"
                  disabled={isLoading}
                />
                <button onClick={handleFinalGuess} className="guess-btn" disabled={isLoading}>
                  Submit Guess
                </button>
              </div>
              <button onClick={handleRevealAnswer} className="reveal-btn" disabled={isLoading}>
                Give Up & Reveal Answer
              </button>
            </>
          )}
          <div className="end-buttons">
            <button onClick={initializeGame} className="restart-btn">Play Again</button>
            <button onClick={onBackToMenu} className="menu-btn">Main Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGuesserMode;
