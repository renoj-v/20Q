import React from 'react';
import Button from './Button';
import './ModeSelection.css';

const ModeSelection = ({ onSelectMode }) => {
  return (
    <div className="mode-selection">
      <div className="mode-selection-bg" />

      <h1 className="mode-title">20 Questions</h1>
      <div className="mode-instructions">
        <h3>How to Play</h3>
        <ul>
          <li>One player thinks of an object</li>
          <li>The other player asks up to 20 yes/no questions</li>
          <li>Try to guess the object before running out of questions!</li>
        </ul>
      </div>
      <p className="mode-subtitle">Choose your game mode</p>

      <div className="mode-cards">
        <div className="mode-card" >
          <h2>AI Guesser</h2>
          <p>Think of an object and let Claude AI guess it by asking you questions</p>
          <Button className="mode-btn" onClick={() => onSelectMode('ai-guesser')}>
            Play as Thinker
          </Button>
        </div>

        <div className="mode-card" >
          <h2>User Guesser</h2>
          <p>Claude AI thinks of an object and you try to guess it by asking questions</p>
          <Button className="mode-btn" onClick={() => onSelectMode('user-guesser')}>
            Play as Guesser
          </Button>
        </div>
      </div>

      
    </div>
  );
};

export default ModeSelection;
