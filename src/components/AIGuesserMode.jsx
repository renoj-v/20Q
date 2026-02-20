import React, { useState, useEffect, useRef } from 'react';
import { initializeAIGuesser, continueAIGuesser } from '../services/claude';
import SwipeCard, { spawnParticles, SWIPE_CONFIG } from './SwipeCard';
import AnswerButtons from './AnswerButtons';
import { spawnPersistentParticles, detectFinalGuess } from './ai-guessor/utils';
import QuestionCounter from './ai-guessor/QuestionCounter';
import FinalGuessButtons from './ai-guessor/FinalGuessButtons';
import ResultScreen from './ai-guessor/ResultScreen';
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

      if (detectFinalGuess(aiResponse, questionCount)) {
        setFinalMessage(aiResponse);
        setGameEnded(true);
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

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

  const handleGuessSwipe = (answer) => {
    const result = answer === 'Yes' ? 'correct' : 'incorrect';
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      particlesRef.current = spawnPersistentParticles(rect);
    }
    setGuessResult(result);
  };

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

      {gamePhase !== 'result' && (
        <QuestionCounter gamePhase={gamePhase} questionCount={questionCount} />
      )}

      {questionCount > 0 && (
        <SwipeCard
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
      )}

      {gamePhase === 'playing' && (
        <AnswerButtons
          onAnswer={handleAnswer}
          cardRef={cardRef}
          setGlowOverride={setGlowOverride}
          disabled={isLoading}
        />
      )}

      {gamePhase === 'final-guess' && (
        <FinalGuessButtons
          onCorrect={() => handleGuessResult('correct')}
          onIncorrect={() => handleGuessResult('incorrect')}
        />
      )}

      {gamePhase === 'result' && (
        <ResultScreen
          guessResult={guessResult}
          onPlayAgain={startGame}
          onBackToMenu={onBackToMenu}
        />
      )}
    </div>
  );
};

export default AIGuesserMode;
