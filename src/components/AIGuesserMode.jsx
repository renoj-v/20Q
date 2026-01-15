import React, { useState, useEffect, useRef } from 'react';
import { initializeAIGuesser, continueAIGuesser } from '../services/claude';
import './GameMode.css';

const AIGuesserMode = ({ onBackToMenu }) => {
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { firstQuestion, systemPrompt: prompt } = await initializeAIGuesser();

      setSystemPrompt(prompt);
      setMessages([
        { role: 'system', content: 'Think of an object, and I will try to guess it!' },
        { role: 'ai', content: firstQuestion }
      ]);

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
      const newMessages = [...messages, { role: 'user', content: answer }];
      setMessages(newMessages);

      const newHistory = [...conversationHistory, userMessage];

      if (questionCount >= 20) {
        setMessages([...newMessages, {
          role: 'system',
          content: '20 questions reached! The AI will now make its final guess.'
        }]);
        setGameEnded(true);
      }

      const aiResponse = await continueAIGuesser(newHistory, systemPrompt);

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setQuestionCount(prev => prev + 1);
      setIsLoading(false);

      if (aiResponse.toLowerCase().includes('is it')) {
        setGameEnded(true);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleCustomAnswer = (e) => {
    e.preventDefault();
    if (userInput.trim()) {
      handleAnswer(userInput);
      setUserInput('');
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
        <h2>AI Guesser Mode</h2>
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

      {!gameEnded && !isLoading && (
        <div className="answer-buttons">
          <button onClick={() => handleAnswer('Yes')} className="answer-btn yes-btn">
            Yes
          </button>
          <button onClick={() => handleAnswer('No')} className="answer-btn no-btn">
            No
          </button>
          <button onClick={() => handleAnswer('Maybe / Sometimes')} className="answer-btn maybe-btn">
            Maybe
          </button>
        </div>
      )}

      {!gameEnded && !isLoading && (
        <form onSubmit={handleCustomAnswer} className="custom-answer-form">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Or type a custom answer..."
            className="custom-answer-input"
          />
          <button type="submit" className="custom-answer-submit">Send</button>
        </form>
      )}

      {gameEnded && (
        <div className="game-end">
          <h3>Game Over!</h3>
          <p>Did the AI guess correctly?</p>
          <div className="end-buttons">
            <button onClick={startGame} className="restart-btn">Play Again</button>
            <button onClick={onBackToMenu} className="menu-btn">Main Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGuesserMode;
