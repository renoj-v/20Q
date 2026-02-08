import React, { useState, useEffect, useRef } from 'react';
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
  const [finalGuessInput, setFinalGuessInput] = useState('');
  const [finalResult, setFinalResult] = useState('');
  const inputRef = useRef(null);

  // Chat-based design state
  const [questionLog, setQuestionLog] = useState([]);
  const [showPrevQuestions, setShowPrevQuestions] = useState(false);
  const [currentAnswerType, setCurrentAnswerType] = useState(null);

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
      setQuestionLog([]);
      setShowPrevQuestions(false);
      setCurrentAnswerType(null);

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

      // Archive previous Q&A to the log
      if (currentQuestion && aiResponse) {
        const prevAnswerType = getAnswerType(aiResponse);
        setQuestionLog(prev => [...prev, {
          question: currentQuestion,
          answerType: prevAnswerType,
          shortenedText: shortenQuestion(currentQuestion, prevAnswerType),
        }]);
      }

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

  // Pull-down button color = last archived answer type
  const lastLogAnswerType = questionLog.length > 0
    ? questionLog[questionLog.length - 1].answerType
    : null;

  // Determine AI bubble content and styling
  let aiBubbleContent = null;
  let aiBubbleType = null;
  let aiBubbleThinking = false;

  if (isLoading && currentQuestion) {
    aiBubbleContent = 'hmmm...';
    aiBubbleThinking = true;
  } else if (aiResponse) {
    aiBubbleContent = aiResponse;
    aiBubbleType = currentAnswerType;
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
    <div className="user-guesser">
      <div className="user-guesser-bg" />
      <button onClick={onBackToMenu} className="user-guesser-back">&larr; Back</button>

      {/* Previous questions panel */}
      {questionLog.length > 0 && (
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

        {currentQuestion && (
          <div key={`q-${questionCount}`} className="chat-bubble chat-bubble--user">
            <p>{currentQuestion}</p>
          </div>
        )}

        {!currentQuestion && !isLoading && gameStarted && (
          <div className="chat-bubble chat-bubble--user chat-bubble--placeholder">
            <p>Ask your first question!</p>
          </div>
        )}
      </div>

      {!gameEnded ? (
        <>
          <div className="user-guesser-counter">
            Question {questionCount} of 20
          </div>

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
