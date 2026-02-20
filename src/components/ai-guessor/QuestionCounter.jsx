import React from 'react';

const QuestionCounter = ({ gamePhase, questionCount }) => {
  return (
    <div className="ai-guesser-counter">
      {gamePhase === 'final-guess' ? 'Final Guess' : `Question ${questionCount} of 20`}
    </div>
  );
};

export default QuestionCounter;
