import React from 'react';
import './ModeSelection.css';

const ModeSelection = ({ onSelectMode }) => {
  return (
    <div className="mode-selection">
      <h1>20 Questions</h1>
      <p className="subtitle">Choose your game mode</p>

      <div className="mode-cards">
        <div className="mode-card" onClick={() => onSelectMode('ai-guesser')}>
          <div className="mode-icon">🤖</div>
          <h2>AI Guesser</h2>
          <p>Think of an object and let Claude AI guess it by asking you questions</p>
          <button className="mode-button">Play as Thinker</button>
        </div>

        <div className="mode-card" onClick={() => onSelectMode('user-guesser')}>
          <div className="mode-icon">🧠</div>
          <h2>User Guesser</h2>
          <p>Claude AI thinks of an object and you try to guess it by asking questions</p>
          <button className="mode-button">Play as Guesser</button>
        </div>
      </div>

      <div className="instructions">
        <h3>How to Play</h3>
        <ul>
          <li>One player thinks of an object</li>
          <li>The other player asks up to 20 yes/no questions</li>
          <li>Try to guess the object before running out of questions!</li>
        </ul>
      </div>
    </div>
  );
};

export default ModeSelection;
