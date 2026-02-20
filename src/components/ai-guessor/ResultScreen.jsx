import React from 'react';

const ResultScreen = ({ guessResult, onPlayAgain, onBackToMenu }) => {
  return (
    <div className="ai-guesser-result">
      <h2>{guessResult === 'correct' ? 'Yes, I win' : 'Oh no!'}</h2>
      <p>{guessResult === 'correct' ? 'I read your mind' : 'Better luck next time'}</p>
      <div className="ai-guesser-result-buttons">
        <button onClick={onPlayAgain} className="ai-guesser-result-btn">Play again</button>
        <button onClick={onBackToMenu} className="ai-guesser-result-btn">Back to Menu</button>
      </div>
    </div>
  );
};

export default ResultScreen;
