import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeUserGuesser, answerUserQuestion } from '../services/claude';
import { getAnswerType, shortenQuestion, spawnPersistentParticles } from './user-guessor/utils';
import PrevQuestionsPanel from './user-guessor/PrevQuestionsPanel';
import ChatArea from './user-guessor/ChatArea';
import QuestionInput from './user-guessor/QuestionInput';
import ResultScreen from './user-guessor/ResultScreen';
import './UserGuesserMode.css';

const UserGuesserMode = ({ onBackToMenu }) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const inputRef = useRef(null);

  const [questionLog, setQuestionLog] = useState([]);
  const [showPrevQuestions, setShowPrevQuestions] = useState(false);
  const [currentAnswerType, setCurrentAnswerType] = useState(null);

  // Phase-based game flow: 'playing' | 'final-guess' | 'result'
  const [gamePhase, setGamePhase] = useState('playing');
  const [guessCorrect, setGuessCorrect] = useState(null);
  const [finalGuessText, setFinalGuessText] = useState('');
  const particlesRef = useRef(null);

  const archiveTimerRef = useRef(null);
  const currentQARef = useRef({ question: '', response: '' });
  const questionCountRef = useRef(0);

  useEffect(() => {
    questionCountRef.current = questionCount;
  }, [questionCount]);

  const archiveCurrentQA = useCallback(() => {
    const { question, response } = currentQARef.current;
    if (question && response) {
      const answerType = getAnswerType(response);
      setQuestionLog(prev => [...prev, {
        question,
        answerType,
        shortenedText: shortenQuestion(question, answerType),
      }]);
    }
    setCurrentQuestion('');
    setAiResponse('');
    setCurrentAnswerType(null);
    currentQARef.current = { question: '', response: '' };

    if (archiveTimerRef.current) {
      clearTimeout(archiveTimerRef.current);
      archiveTimerRef.current = null;
    }

    if (questionCountRef.current >= 20) {
      setGamePhase('final-guess');
    }
  }, []);

  useEffect(() => {
    if (archiveTimerRef.current) {
      clearTimeout(archiveTimerRef.current);
      archiveTimerRef.current = null;
    }

    if (currentQuestion && aiResponse && !isLoading) {
      currentQARef.current = { question: currentQuestion, response: aiResponse };
      const delay = questionCountRef.current >= 20 ? 500 : 5000;
      archiveTimerRef.current = setTimeout(archiveCurrentQA, delay);
    }

    return () => {
      if (archiveTimerRef.current) {
        clearTimeout(archiveTimerRef.current);
      }
    };
  }, [currentQuestion, aiResponse, isLoading, archiveCurrentQA]);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (gameStarted && !isLoading && gamePhase !== 'result' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameStarted, isLoading, gamePhase]);

  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.remove();
      }
    };
  }, []);

  const initializeGame = async () => {
    if (particlesRef.current) {
      particlesRef.current.remove();
      particlesRef.current = null;
    }

    try {
      setIsLoading(true);
      setError(null);
      setGamePhase('playing');
      setGuessCorrect(null);
      setFinalGuessText('');
      setCurrentQuestion('');
      setAiResponse('');
      setQuestionCount(0);
      setFinalResult('');
      setQuestionLog([]);
      setShowPrevQuestions(false);
      setCurrentAnswerType(null);
      if (archiveTimerRef.current) {
        clearTimeout(archiveTimerRef.current);
        archiveTimerRef.current = null;
      }

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
    if (!userInput.trim() || gamePhase !== 'playing' || isLoading || questionCount >= 20) return;

    try {
      setIsLoading(true);
      setError(null);

      const question = userInput;
      setUserInput('');

      archiveCurrentQA();

      setCurrentQuestion(question);
      setAiResponse('');
      setCurrentAnswerType(null);

      const newQuestionCount = questionCount + 1;
      setQuestionCount(newQuestionCount);

      let questionWithCount = question;
      if (newQuestionCount >= 20) {
        questionWithCount += '\n\n(This is question 20 - my last question!)';
      }

      const updatedHistory = [...conversationHistory, { role: 'user', content: questionWithCount }];
      const aiResp = await answerUserQuestion(updatedHistory, systemPrompt);

      const answerType = getAnswerType(aiResp);
      setAiResponse(aiResp);
      setCurrentAnswerType(answerType);
      setConversationHistory([...updatedHistory, { role: 'assistant', content: aiResp }]);

      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleFinalGuess = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      const guess = userInput;
      setUserInput('');
      setFinalGuessText(guess);
      setCurrentQuestion(guess);

      const finalMessage = {
        role: 'user',
        content: `Is it ${guess}? Please tell me if I guessed correctly and reveal what the object was.`
      };

      const newHistory = [...conversationHistory, finalMessage];
      const aiResp = await answerUserQuestion(newHistory, systemPrompt);

      const isCorrect = aiResp.toLowerCase().trim().startsWith('yes');
      setGuessCorrect(isCorrect ? 'correct' : 'incorrect');
      setFinalResult(aiResp);
      setConversationHistory([...newHistory, { role: 'assistant', content: aiResp }]);
      setGamePhase('result');
      setIsLoading(false);

      particlesRef.current = spawnPersistentParticles();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const lastLogAnswerType = questionLog.length > 0
    ? questionLog[questionLog.length - 1].answerType
    : null;

  let aiBubbleContent = null;
  let aiBubbleType = null;

  if (gamePhase === 'playing') {
    if (isLoading && currentQuestion) {
      aiBubbleContent = 'hmmm...';
    } else if (aiResponse) {
      aiBubbleContent = aiResponse;
      aiBubbleType = currentAnswerType;
    }
  }

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
    <div className={`user-guesser phase-${gamePhase}${guessCorrect ? ` result-${guessCorrect}` : ''}`}>
      <div className="user-guesser-bg" />
      <button onClick={onBackToMenu} className="user-guesser-back">&larr; Back</button>

      {gamePhase !== 'result' && (
        <PrevQuestionsPanel
          questionLog={questionLog}
          showPrevQuestions={showPrevQuestions}
          lastLogAnswerType={lastLogAnswerType}
          onToggle={() => setShowPrevQuestions(!showPrevQuestions)}
        />
      )}

      <ChatArea
        aiBubbleContent={aiBubbleContent}
        aiBubbleType={aiBubbleType}
        currentQuestion={currentQuestion}
        questionCount={questionCount}
        gamePhase={gamePhase}
        finalGuessText={finalGuessText}
        isLoading={isLoading}
      />

      {gamePhase !== 'result' && (
        <QuestionInput
          questionCount={questionCount}
          gamePhase={gamePhase}
          userInput={userInput}
          isLoading={isLoading}
          gameStarted={gameStarted}
          inputRef={inputRef}
          onChange={(e) => setUserInput(e.target.value)}
          onSubmit={gamePhase === 'final-guess' ? handleFinalGuess : handleAskQuestion}
        />
      )}

      {gamePhase === 'result' && (
        <ResultScreen
          guessCorrect={guessCorrect}
          onPlayAgain={initializeGame}
          onBackToMenu={onBackToMenu}
        />
      )}
    </div>
  );
};

export default UserGuesserMode;
