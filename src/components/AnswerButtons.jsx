import React from 'react';
import { SWIPE_CONFIG, spawnParticles } from './SwipeCard';
import Button from './Button';

const AnswerButtons = ({ onAnswer, cardRef, setGlowOverride, disabled }) => {
  const handleParticleAnswer = (type) => {
    const card = cardRef.current;
    if (card) {
      spawnParticles(card.getBoundingClientRect(), type, SWIPE_CONFIG.particles);
      card.dissolve();
    }
    setTimeout(() => onAnswer(type === 'sometimes' ? 'Sometimes' : 'Unsure'), SWIPE_CONFIG.dissolveDuration);
  };

  return (
    <div className={`ai-guesser-answers${disabled ? ' disabled' : ''}`}>
      <div className="ai-guesser-yesno">
        <Button onClick={() => onAnswer('No')} className="ai-guesser-no">
          <span className="arrow">↰</span>
          <span className="label">No</span>
        </Button>
        <Button onClick={() => onAnswer('Yes')} className="ai-guesser-yes">
          <span className="arrow">↱</span>
          <span className="label">Yes</span>
        </Button>
      </div>
      <Button
        onClick={() => handleParticleAnswer('sometimes')}
        onPointerEnter={() => setGlowOverride('sometimes')}
        onPointerLeave={() => setGlowOverride(null)}
        className="ai-guesser-btn"
      >
        Sometimes
      </Button>
      <Button
        onClick={() => handleParticleAnswer('unsure')}
        onPointerEnter={() => setGlowOverride('unsure')}
        onPointerLeave={() => setGlowOverride(null)}
        className="ai-guesser-btn"
      >
        Unsure
      </Button>
    </div>
  );
};

export default AnswerButtons;
