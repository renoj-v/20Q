import React from 'react';

const QuestionInput = ({
  questionCount,
  gamePhase,
  userInput,
  isLoading,
  gameStarted,
  inputRef,
  submitRef,
  onChange,
  onSubmit,
}) => {
  return (
    <>
      <div className="user-guesser-counter">
        {gamePhase === 'final-guess' ? 'Final Guess' : `Question ${questionCount} of 20`}
      </div>

      <div className={`user-guesser-input-area${isLoading || !gameStarted ? ' disabled' : ''}`}>
        <form className="user-guesser-form" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="user-guesser-input"
            value={userInput}
            onChange={onChange}
            placeholder={gamePhase === 'final-guess' ? 'Type your guess...' : 'Ask a yes/no question...'}
            disabled={isLoading || !gameStarted}
          />
          <button
            ref={submitRef}
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
  );
};

export default QuestionInput;
