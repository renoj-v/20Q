import React from 'react';

const FinalGuessButtons = ({ onCorrect, onIncorrect }) => {
  return (
    <div className="ai-guesser-final-buttons">
      <button className="ai-guesser-final-btn" onClick={onIncorrect}>
        No
      </button>
      <button className="ai-guesser-final-btn" onClick={onCorrect}>
        Yes
      </button>
    </div>
  );
};

export default FinalGuessButtons;
