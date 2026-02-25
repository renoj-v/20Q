import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimate } from 'motion/react';

// ── Transition configs ──────────────────────────────────────────────────────
const bubbleTransition = { duration: 0.4, ease: 'easeOut' };
const exitTransition   = { duration: 0.2, ease: 'easeIn' };

// ── Layout / structural styles (never animated) ─────────────────────────────
const base = {
  maxWidth: '262px',
  padding: '32px',
};

const aiStyle = {
  ...base,
  alignSelf: 'flex-start',
  borderRadius: '24px 24px 24px 0',
  position:" absolute",
  
};

const userStyle = {
  ...base,
  alignSelf: 'flex-end',
  borderRadius: '24px 24px 0 16px',
  position:" absolute",
  bottom: "32px",
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

// ── Answer-type colors (animated by Motion when answer arrives) ──────────────
const answerAnimate = {
  default:   { background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 14px 0 rgba(255, 255, 255, 0.6)' },
  yes:       { background: 'rgba(200, 245, 215, 0.9)', boxShadow: '0 0 14px 0 rgba(72,  199, 108, 0.55)' },
  no:        { background: 'rgba(250, 200, 200, 0.9)', boxShadow: '0 0 14px 0 rgba(220,  60,  60, 0.55)' },
  sometimes: { background: 'rgba(250, 240, 190, 0.9)', boxShadow: '0 0 14px 0 rgba(240, 200,  40, 0.55)' },
  unsure:    { background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 0 14px 0 rgba(255, 255, 255, 0.6)' },
};

// ── Shared exit props for non-user bubbles ───────────────────────────────────
const enterExit = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  exit:    { opacity: 0, scale: 0.95, transition: exitTransition },
};

// ── UserBubble: orb → bubble send animation ──────────────────────────────────
// Renders at its natural flex position with opacity 0, measures itself,
// then teleports to the send button and plays the two-phase animation.
const UserBubble = ({ children, style, questionOrigin }) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (!scope.current) return;

    const bubbleRect = scope.current.getBoundingClientRect();
    const p = scope.current.querySelector('p');
    if (p) p.style.opacity = '0';

    if (!questionOrigin) {
      // Fallback: simple fade-in if no origin captured
      animate(scope.current, { opacity: 0, y: 16, scale: 0.95 }, { duration: 0 })
        .then(() => animate(scope.current, { opacity: 1, y: 0, scale: 1 }, bubbleTransition))
        .then(() => { if (p) animate(p, { opacity: 1 }, { duration: 0.25, ease: 'easeOut' }); });
      return;
    }

    // Offset from bubble's natural center to button's center
    const dx = (questionOrigin.left + questionOrigin.width  / 2) - (bubbleRect.left + bubbleRect.width  / 2);
    const dy = (questionOrigin.top  + questionOrigin.height / 2) - (bubbleRect.top  + bubbleRect.height / 2);

    // Phase 0: instantly place small orb at the send button
    animate(scope.current, {
      opacity: 1,
      x: dx, y: dy,
      width: 32, height: 32,
      boxShadow: '0 0 23px 8px rgba(255,255,255,.9)',
    }, { duration: 0 })
    // Phase 1: float upward (orb stays small)
    .then(() => animate(scope.current, {
      y: dy - 75,
      boxShadow: '0 0 14px 7px rgba(255,255,255,.9)',
    }, { duration: 0.15, ease: 'linear' }))
    // Phase 2: expand into full bubble at natural position
    .then(() => animate(scope.current, {
      x: 0, y: 0,
      width: bubbleRect.width, height: bubbleRect.height,
      boxShadow: '0 0 14px 0 rgba(255,255,255,0.8)',
    }, { duration: 0.45, ease: [0.2, 0.8, 0.8, 1.05] }))
    // Clean up explicit dimensions so CSS controls size going forward
    .then(() => {
      if (scope.current) {
        scope.current.style.width  = '';
        scope.current.style.height = '';
      }
    })
    // Phase 3: fade in the text
    .then(() => { if (p) animate(p, { opacity: 1 }, { duration: 0.1, ease: 'easeOut' }); });
  }, []);

  return (
    <motion.div
      ref={scope}
      style={{ ...style, opacity: 0, overflow: 'hidden' }}
      exit={{ opacity: 0, scale: 0.95, transition: exitTransition }}
    >
      {children}
    </motion.div>
  );
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
          <motion.div
            key={`ai-${questionCount}`}
            style={aiStyle}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...aiColors }}
            transition={{...bubbleTransition, delay: 1 }}
          >
            <motion.p style={aiP}
            initial={{ opacity: 0}}
            exit={{ opacity: 0}}
            animate={{ opacity: 1}}
            transition={{duration: .1, delay: 1.5}}>{aiBubbleContent}</motion.p>
          </motion.div>
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

        {gamePhase === 'final-guess' && isLoading && (
          <motion.div
            key="final-thinking"
            style={{ ...aiStyle, ...answerAnimate.default }}
            {...enterExit}
            animate={{ opacity: 1, y: 0, scale: 1, ...answerAnimate.default }}
            transition={bubbleTransition}
          >
            <p style={aiP}>hmmm...</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ChatArea;
