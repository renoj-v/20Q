import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeUserGuesser, answerUserQuestion } from '../services/claude';
import './UserGuesserMode.css';

// Detect answer type from AI response
function getAnswerType(response) {
  const lower = response.toLowerCase().trim();
  if (lower.startsWith('yes')) return 'yes';
  if (lower.startsWith('no')) return 'no';
  if (lower.startsWith('maybe') || lower.startsWith('sometimes')) return 'sometimes';
  return 'unsure';
}

// Shorten question text for the prev-questions log
function shortenQuestion(question, answerType) {
  let stripped = question.replace(/\?+$/, '').trim();
  stripped = stripped.replace(/^is it\s+/i, '');
  switch (answerType) {
    case 'yes': return `Is ${stripped}`;
    case 'no': return `Not ${stripped}`;
    case 'sometimes': return `Sometimes ${stripped}`;
    case 'unsure': return `Unsure if ${stripped}`;
    default: return stripped;
  }
}

// Spawn persistent floating particles for result screen
function spawnPersistentParticles() {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden;';
  document.body.appendChild(container);

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

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

  // Chat-based design state
  const [questionLog, setQuestionLog] = useState([]);
  const [showPrevQuestions, setShowPrevQuestions] = useState(false);
  const [currentAnswerType, setCurrentAnswerType] = useState(null);

  // Phase-based game flow: 'playing' | 'final-guess' | 'result'
  const [gamePhase, setGamePhase] = useState('playing');
  const [guessCorrect, setGuessCorrect] = useState(null); // 'correct' | 'incorrect' | null
  const [finalGuessText, setFinalGuessText] = useState('');
  const particlesRef = useRef(null);

  // Auto-archive: refs to track current Q&A for the timer callback
  const archiveTimerRef = useRef(null);
  const currentQARef = useRef({ question: '', response: '' });
  const questionCountRef = useRef(0);

  // Keep questionCountRef in sync
  useEffect(() => {
    questionCountRef.current = questionCount;
  }, [questionCount]);

  // Archive the current Q&A to the prev-questions log
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

    // Transition to final-guess when Q20 answer is archived
    if (questionCountRef.current >= 20) {
      setGamePhase('final-guess');
    }
  }, []);

  // Start 5-second auto-archive timer when AI responds
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

  // Clean up particles on unmount
  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.remove();
      }
    };
  }, []);

  const initializeGame = async () => {
    // Clean up persistent particles from previous game
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

      // Archive previous Q&A to the log (also cancels the 5s timer)
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
      setCurrentQuestion(guess); // Show as user bubble

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

      // Spawn persistent particles
      particlesRef.current = spawnPersistentParticles();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Pull-down button color = last archived answer type
  const lastLogAnswerType = questionLog.length > 0
    ? questionLog[questionLog.length - 1].answerType
    : null;

  // Determine AI bubble content and styling (only during playing phase)
  let aiBubbleContent = null;
  let aiBubbleType = null;
  let aiBubbleThinking = false;

  if (gamePhase === 'playing') {
    if (isLoading && currentQuestion) {
      aiBubbleContent = 'hmmm...';
      aiBubbleThinking = true;
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

      {/* Previous questions panel */}
      {questionLog.length > 0 && gamePhase !== 'result' && (
        <div className="user-guesser-top">
          <div className={`prev-questions-panel${showPrevQuestions ? ' expanded' : ''}`}>
            {questionLog.map((entry, i) => (
              <div
                key={i}
                className={`prev-question prev-question--${entry.answerType}`}
              >
                <p>{entry.shortenedText}</p>
              </div>
            ))}
          </div>
          <button
            className={`pull-down-btn${lastLogAnswerType ? ` pull-down-btn--${lastLogAnswerType}` : ''}`}
            onClick={() => setShowPrevQuestions(!showPrevQuestions)}
          >
            <svg
              width="24" height="24" viewBox="0 0 24 24" fill="none"
              className={`pull-down-chevron${showPrevQuestions ? ' rotated' : ''}`}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Chat area */}
      <div className="user-guesser-chat">
        {aiBubbleContent && (
          <div
            key={aiBubbleThinking ? 'thinking' : `answer-${questionCount}`}
            className={`chat-bubble chat-bubble--ai${aiBubbleType ? ` chat-bubble--${aiBubbleType}` : ''}${aiBubbleThinking ? ' thinking' : ''}`}
          >
            <p>{aiBubbleContent}</p>
          </div>
        )}

        {/* User question bubble (playing phase) */}
        {gamePhase === 'playing' && currentQuestion && (
          <div key={`q-${questionCount}`} className="chat-bubble chat-bubble--user">
            <p>{currentQuestion}</p>
          </div>
        )}

        {/* User's final guess bubble (final-guess + result phases) */}
        {gamePhase !== 'playing' && finalGuessText && (
          <div className="chat-bubble chat-bubble--user">
            <p>{finalGuessText}</p>
          </div>
        )}

        {/* Final guess thinking bubble */}
        {gamePhase === 'final-guess' && isLoading && finalGuessText && (
          <div className="chat-bubble chat-bubble--ai thinking">
            <p>hmmm...</p>
          </div>
        )}
      </div>

      {/* Playing + Final-guess: counter and input */}
      {gamePhase !== 'result' && (
        <>
          <div className="user-guesser-counter">
            {gamePhase === 'final-guess' ? 'Final Guess' : `Question ${questionCount} of 20`}
          </div>

          <div className={`user-guesser-input-area${isLoading || !gameStarted ? ' disabled' : ''}`}>
            <form
              className="user-guesser-form"
              onSubmit={gamePhase === 'final-guess' ? handleFinalGuess : handleAskQuestion}
            >
              <input
                ref={inputRef}
                type="text"
                className="user-guesser-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={gamePhase === 'final-guess' ? 'Type your guess...' : 'Ask a yes/no question...'}
                disabled={isLoading || !gameStarted}
              />
              <button
                type="submit"
                className="user-guesser-submit"
                disabled={isLoading || !gameStarted || !userInput.trim()}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}

      {/* Result screen */}
      {gamePhase === 'result' && (
        <div className="user-guesser-result">
          <h2>{guessCorrect === 'correct' ? 'Yes, it is' : 'Oh no!'}</h2>
          <p>{guessCorrect === 'correct' ? 'You win!!!' : 'Better luck next time'}</p>
          <div className="user-guesser-result-buttons">
            <button onClick={initializeGame} className="user-guesser-result-btn">Play again</button>
            <button onClick={onBackToMenu} className="user-guesser-result-btn">Back to Menu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGuesserMode;
