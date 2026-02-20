import React from 'react';

const ChatArea = ({
  aiBubbleContent,
  aiBubbleType,
  aiBubbleThinking,
  currentQuestion,
  questionCount,
  gamePhase,
  finalGuessText,
  isLoading,
}) => {
  return (
    <div className="user-guesser-chat">
      {aiBubbleContent && (
        <div
          key={aiBubbleThinking ? 'thinking' : `answer-${questionCount}`}
          className={`chat-bubble chat-bubble--ai${aiBubbleType ? ` chat-bubble--${aiBubbleType}` : ''}${aiBubbleThinking ? ' thinking' : ''}`}
        >
          <p>{aiBubbleContent}</p>
        </div>
      )}

      {gamePhase === 'playing' && currentQuestion && (
        <div key={`q-${questionCount}`} className="chat-bubble chat-bubble--user">
          <p>{currentQuestion}</p>
        </div>
      )}

      {gamePhase !== 'playing' && finalGuessText && (
        <div className="chat-bubble chat-bubble--user">
          <p>{finalGuessText}</p>
        </div>
      )}

      {gamePhase === 'final-guess' && isLoading && finalGuessText && (
        <div className="chat-bubble chat-bubble--ai thinking">
          <p>hmmm...</p>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
