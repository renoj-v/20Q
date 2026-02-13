import React, { useState, useEffect, useRef } from 'react';
import { initializeAIGuesser, continueAIGuesser } from '../services/claude';
import SwipeCard, { spawnParticles, SWIPE_CONFIG } from './SwipeCard';
import AnswerButtons from './AnswerButtons';
import './AIGuesserMode.css';

// Spawn persistent floating particles that remain on screen
function spawnPersistentParticles(rect) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden;';
  document.body.appendChild(container);

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 400;
    const x = cx + Math.cos(angle) * dist * 50;
    const y = cy + Math.sin(angle) * dist % 20;
    const size = 22 + Math.random() * 12;
    const driftX = (Math.random() - 0.5) * 100;
    const driftY = (Math.random() - 0.5) * 100;
    const duration = 5 + Math.random() * 4;
    const delay = Math.random() * 1;

    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;
      left:${x}px;top:${y}px;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:white;
      filter:blur(12px);
      opacity:0;
      pointer-events:none;
      --drift-x:${driftX}px;
      --drift-y:${driftY}px;
      animation:persistentDrift ${duration}s ease-in-out ${delay}s infinite alternate;
      transition:opacity 0.8s ease ${delay}s;
    `;
    container.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.opacity = '0.7';
    });
  }

  return container;
}

const AIGuesserMode = ({ onBackToMenu }) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [finalMessage, setFinalMessage] = useState('');
  const [glowOverride, setGlowOverride] = useState(null);
  const [guessResult, setGuessResult] = useState(null); // 'correct' | 'incorrect' | null
  const cardRef = useRef(null);
  const particlesRef = useRef(null);

  // Derive game phase
  const gamePhase = !gameEnded ? 'playing' : (!guessResult ? 'final-guess' : 'result');

  useEffect(() => {
    startGame();
  }, []);

  const startGame = async () => {
    // Clean up persistent particles from previous game
    if (particlesRef.current) {
      particlesRef.current.remove();
      particlesRef.current = null;
    }

    try {
      setIsLoading(true);
      setError(null);
      setGameEnded(false);
      setFinalMessage('');
      setGuessResult(null);

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

  // Handle Yes/No during the final guess phase (button click)
  const handleGuessResult = (result) => {
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      const direction = result === 'correct' ? 'right' : 'left';
      spawnParticles(rect, direction, SWIPE_CONFIG.particles);
      particlesRef.current = spawnPersistentParticles(rect);
    }
    setGuessResult(result);
  };

  // Handle swipe during final guess phase
  const handleGuessSwipe = (answer) => {
    const result = answer === 'Yes' ? 'correct' : 'incorrect';
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      particlesRef.current = spawnPersistentParticles(rect);
    }
    setGuessResult(result);
  };

  // Clean up particles on unmount
  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.remove();
      }
    };
  }, []);

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
    <div className={`ai-guesser phase-${gamePhase}${guessResult ? ` result-${guessResult}` : ''}`}>
      <div className="ai-guesser-bg" />
      <button onClick={onBackToMenu} className="ai-guesser-back">← Back</button>

      {/* Counter: "Question X of 20" during play, "Final Guess" at end */}
      {gamePhase !== 'result' && (
        <div className="ai-guesser-counter">
          {gamePhase === 'final-guess' ? 'Final Guess' : `Question ${questionCount} of 20`}
        </div>
      )}

      {/* Card: always visible, swipeable during playing + final-guess */}
      {questionCount > 0 && <SwipeCard
        key={questionCount}
        ref={cardRef}
        text={
          isLoading && !currentQuestion
            ? 'Thinking of a question...'
            : gameEnded && finalMessage
              ? finalMessage
              : currentQuestion
        }
        isLoading={isLoading && !currentQuestion}
        onSwipe={gamePhase === 'final-guess' ? handleGuessSwipe : handleAnswer}
        disabled={gamePhase === 'result' || isLoading}
        glowOverride={glowOverride}
      />
      }

      {/* Playing: answer buttons */}
      {gamePhase === 'playing' && (
        <AnswerButtons
          onAnswer={handleAnswer}
          cardRef={cardRef}
          setGlowOverride={setGlowOverride}
          disabled={isLoading}
        />
      )}

      {/* Final guess: simple Yes/No buttons */}
      {gamePhase === 'final-guess' && (
        <div className="ai-guesser-final-buttons">
          <button
            className="ai-guesser-final-btn"
            onClick={() => handleGuessResult('incorrect')}
          >
            No
          </button>
          <button
            className="ai-guesser-final-btn"
            onClick={() => handleGuessResult('correct')}
          >
            Yes
          </button>
        </div>
      )}

      {/* Result screen */}
      {gamePhase === 'result' && (
        <div className="ai-guesser-result">
          <h2>{guessResult === 'correct' ? 'Yes, I win' : 'Oh no!'}</h2>
          <p>{guessResult === 'correct' ? 'I read your mind' : 'Better luck next time'}</p>
          <div className="ai-guesser-result-buttons">
            <button onClick={startGame} className="ai-guesser-result-btn">Play again</button>
            <button onClick={onBackToMenu} className="ai-guesser-result-btn">Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGuesserMode;
