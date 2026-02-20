import React from 'react';

const ResultScreen = ({ guessCorrect, onPlayAgain, onBackToMenu }) => {
  return (
    <div className="user-guesser-result">
      <h2>{guessCorrect === 'correct' ? 'Yes, it is' : 'Oh no!'}</h2>
      <p>{guessCorrect === 'correct' ? 'You win!!!' : 'Better luck next time'}</p>
      <div className="user-guesser-result-buttons">
        <button onClick={onPlayAgain} className="user-guesser-result-btn">Play again</button>
        <button onClick={onBackToMenu} className="user-guesser-result-btn">Back to Menu</button>
      </div>
    </div>
  );
};

export default ResultScreen;
