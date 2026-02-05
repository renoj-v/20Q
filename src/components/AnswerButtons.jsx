import React from 'react';
import { SWIPE_CONFIG, spawnParticles } from './SwipeCard';
import Button from './Button';

const AnswerButtons = ({ onAnswer, cardRef, setGlowOverride, disabled }) => {
  const handleSwipeAnswer = (direction) => {
    const card = cardRef.current;
    if (card) {
      spawnParticles(card.getBoundingClientRect(), direction, SWIPE_CONFIG.particles);
      card.swipeOut(direction);
    }
    const answer = direction === 'right' ? 'Yes' : 'No';
    setTimeout(() => onAnswer(answer), SWIPE_CONFIG.dissolveDuration);
  };

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
        <Button onClick={() => handleSwipeAnswer('left')} className="ai-guesser-no">
          <span className="arrow">↰</span>
          <span className="label">No</span>
        </Button>
        <Button onClick={() => handleSwipeAnswer('right')} className="ai-guesser-yes">
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
