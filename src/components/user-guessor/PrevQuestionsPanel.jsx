import React from 'react';

const PrevQuestionsPanel = ({ questionLog, showPrevQuestions, lastLogAnswerType, onToggle }) => {
  if (questionLog.length === 0) return null;

  return (
    <div className="user-guesser-top">
      <div className={`prev-questions-panel${showPrevQuestions ? ' expanded' : ''}`}>
        {questionLog.map((entry, i) => (
          <div key={i} className={`prev-question prev-question--${entry.answerType}`}>
            <p>{entry.shortenedText}</p>
          </div>
        ))}
      </div>
      <button
        className={`pull-down-btn${lastLogAnswerType ? ` pull-down-btn--${lastLogAnswerType}` : ''}`}
        onClick={onToggle}
      >
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          className={`pull-down-chevron${showPrevQuestions ? ' rotated' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default PrevQuestionsPanel;
