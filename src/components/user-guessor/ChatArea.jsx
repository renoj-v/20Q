import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AiBubble, { aiStyle, aiP } from './AiBubble.jsx';
import UserBubble, { userStyle, userP } from './UserBubble.jsx';

// ── Transition configs ───────────────────────────────────────────────────────
const bubbleTransition = { duration: 0.4, ease: 'easeOut' };
const exitTransition   = { duration: 0.2, ease: 'easeIn' };

// ── Answer-type colors (animated by Motion when answer arrives) ──────────────
const answerAnimate = {
  default:   { background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 14px 0 rgba(255, 255, 255, 0.6)' },
  yes:       { background: 'rgba(200, 245, 215, 0.9)', boxShadow: '0 0 14px 0 rgba(72,  199, 108, 0.55)' },
  no:        { background: 'rgba(250, 200, 200, 0.9)', boxShadow: '0 0 14px 0 rgba(220,  60,  60, 0.55)' },
  sometimes: { background: 'rgba(250, 240, 190, 0.9)', boxShadow: '0 0 14px 0 rgba(240, 200,  40, 0.55)' },
  unsure:    { background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 14px 0 rgba(255, 255, 255, 0.6)' },
};

// ── Shared enter/exit props ──────────────────────────────────────────────────
const enterExit = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  exit:    { opacity: 0, scale: 0.95, transition: exitTransition },
};

// ── ChatArea ──────────────────────────────────────────────────────────────────
const ChatArea = ({
  aiBubbleContent,
  aiBubbleType,
  currentQuestion,
  questionCount,
  questionOrigin,
  gamePhase,
  finalGuessText,
  isLoading,
}) => {
  const aiColors = answerAnimate[aiBubbleType] ?? answerAnimate.default;

  return (
    <div className="user-guesser-chat">
      <AnimatePresence mode="popLayout">

        {/* AI bubble — stays mounted through thinking → answer; Motion animates color */}
        {aiBubbleContent && (
          <AiBubble
            key={`ai-${questionCount}`}
            answerType={aiBubbleType}
            style={aiStyle}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...aiColors }}
            transition={{...bubbleTransition, delay: 1 }}
          >
            <motion.p style={aiP}
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: .1, delay: 1.5 }}>{aiBubbleContent}</motion.p>
          </AiBubble>
        )}

        {/* User bubble — orb → bubble send animation */}
        {gamePhase === 'playing' && currentQuestion && (
          <UserBubble
            key={`q-${questionCount}`}
            style={{ ...userStyle, ...answerAnimate.default }}
            questionOrigin={questionOrigin}
          >
            <p style={userP}>{currentQuestion}</p>
          </UserBubble>
        )}

        {gamePhase !== 'playing' && finalGuessText && (
          <AiBubble
            key="final-guess-bubble"
            style={{ ...userStyle, ...answerAnimate.default }}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...answerAnimate.default }}
            transition={bubbleTransition}
          >
            <p style={userP}>{finalGuessText}</p>
          </AiBubble>
        )}

        {gamePhase === 'final-guess' && isLoading && (
          <AiBubble
            key="final-thinking"
            style={{ ...aiStyle, ...answerAnimate.default }}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...answerAnimate.default }}
            transition={bubbleTransition}
          >
            <p style={aiP}>hmmm...</p>
          </AiBubble>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ChatArea;
