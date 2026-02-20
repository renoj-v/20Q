import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Transition configs ──────────────────────────────────────────────────────
const bubbleTransition = { duration: .4, ease: 'easeOut' };
const exitTransition   = { duration: .2, ease: 'easeIn' };

// ── Layout / structural styles (never animated) ─────────────────────────────
const base = {
  maxWidth: '262px',
  padding: '32px',
  position: "absolute"
};

const aiStyle = {
  ...base,
  alignSelf: 'flex-start',
  borderRadius: '24px 24px 24px 0',
};

const userStyle = {
  ...base,
  alignSelf: 'flex-end',
  borderRadius: '24px 24px 0 16px',
};

// ── Paragraph styles ────────────────────────────────────────────────────────
const baseP = {
  fontSize: 'var(--text-md)',
  lineHeight: '1.53',
  whiteSpace: 'pre-wrap',
  margin: 0,
};

const aiP = {
  ...baseP,
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  color: 'var(--color-text)',
  textAlign: 'right',
};

const userP = {
  ...baseP,
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text)',
};

// ── Answer-type colors (used in Motion animate for smooth transitions) ───────
const answerAnimate = {
  default:   { background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 14px 0 rgba(255, 255, 255, 0.6)' },
  yes:       { background: 'rgba(200, 245, 215, 0.9)', boxShadow: '0 0 14px 0 rgba(72,  199, 108, 0.55)' },
  no:        { background: 'rgba(250, 200, 200, 0.9)', boxShadow: '0 0 14px 0 rgba(220,  60,  60, 0.55)' },
  sometimes: { background: 'rgba(250, 240, 190, 0.9)', boxShadow: '0 0 14px 0 rgba(240, 200,  40, 0.55)' },
  unsure:    { background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 14px 0 rgba(255, 255, 255, 0.6)' },
};

// ── Shared enter / exit motion props ────────────────────────────────────────
const enterExit = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  exit:    { opacity: 0, scale: 0.95, transition: exitTransition },
};

// ── ThinkingBubble: fades in then pulses ────────────────────────────────────
// Must receive a React `key` on the JSX element for AnimatePresence tracking.
const ThinkingBubble = ({ style, children }) => (
  <motion.div
    style={{ ...aiStyle, ...answerAnimate.default, ...style }}
    {...enterExit}
    animate={{ opacity: 1, y: 0, scale: 1, ...answerAnimate.default }}
    transition={bubbleTransition}
  >
    {children}
  </motion.div>
);

// ── ChatArea ─────────────────────────────────────────────────────────────────
const ChatArea = ({
  aiBubbleContent,
  aiBubbleType,
  aiBubbleThinking,
  currentQuestion,
  questionCount,
  gamePhase,
  finalGuessText,
  isLoading,
}) => {
  const aiColors = answerAnimate[aiBubbleType] ?? answerAnimate.default;

  return (
    <div className="user-guesser-chat">
      <AnimatePresence mode="popLayout">

        {aiBubbleContent && (
          aiBubbleThinking ? (
            <ThinkingBubble key="ai-thinking">
              <p style={aiP}>{aiBubbleContent}</p>
            </ThinkingBubble>
          ) : (
            <motion.div
              key={`answer-${questionCount}`}
              style={aiStyle}
              {...enterExit}
              animate={{ opacity: 1, y: 0, scale: 1, ...aiColors }}
              transition={bubbleTransition}
            >
              <p style={aiP}>{aiBubbleContent}</p>
            </motion.div>
          )
        )}

        {gamePhase === 'playing' && currentQuestion && (
          <motion.div
            key={`q-${questionCount}`}
            style={{ ...userStyle, ...answerAnimate.default }}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...answerAnimate.default }}
            transition={bubbleTransition}
          >
            <p style={userP}>{currentQuestion}</p>
          </motion.div>
        )}

        {gamePhase !== 'playing' && finalGuessText && (
          <motion.div
            key="final-guess-bubble"
            style={{ ...userStyle, ...answerAnimate.default }}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...answerAnimate.default }}
            transition={bubbleTransition}
          >
            <p style={userP}>{finalGuessText}</p>
          </motion.div>
        )}

        {gamePhase === 'final-guess' && isLoading && finalGuessText && (
          <ThinkingBubble key="final-thinking">
            <p style={aiP}>hmmm...</p>
          </ThinkingBubble>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ChatArea;
