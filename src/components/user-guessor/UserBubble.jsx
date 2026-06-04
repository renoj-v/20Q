import React, { useEffect } from 'react';
import { motion, useAnimate, usePresence } from 'motion/react';
import { spawnParticles, SWIPE_CONFIG } from '../shared/SwipeCard.jsx';

const userStyle = {
  maxWidth: '262px',
  padding: '32px',
  alignSelf: 'flex-end',
  borderRadius: '24px 24px 0 16px',
  position: 'absolute',
  bottom: '32px',
};

const userP = {
  fontSize: 'var(--text-md)',
  lineHeight: '1.53',
  whiteSpace: 'pre-wrap',
  margin: 0,
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text)',
};

const exitTransition = { duration: 0.2, ease: 'easeIn' };
const bubbleTransition = { duration: 0.4, ease: 'easeOut' };

const UserBubble = ({ children, style, questionOrigin }) => {
  const [scope, animate] = useAnimate();
  const [isPresent] = usePresence();

  useEffect(() => {
    if (!isPresent && scope.current) {
      spawnParticles(scope.current.getBoundingClientRect(), 'unsure', SWIPE_CONFIG.particles);
    }
  }, [isPresent]);

  useEffect(() => {
    if (!scope.current) return;

    const bubbleRect = scope.current.getBoundingClientRect();
    const p = scope.current.querySelector('p');
    if (p) p.style.opacity = '0';

    if (!questionOrigin) {
      animate(scope.current, { opacity: 0, y: 16, scale: 0.95 }, { duration: 0 })
        .then(() => animate(scope.current, { opacity: 1, y: 0, scale: 1 }, bubbleTransition))
        .then(() => { if (p) animate(p, { opacity: 1 }, { duration: 0.25, ease: 'easeOut' }); });
      return;
    }

    const dx = (questionOrigin.left + questionOrigin.width  / 2) - (bubbleRect.left + bubbleRect.width  / 2);
    const dy = (questionOrigin.top  + questionOrigin.height / 2) - (bubbleRect.top  + bubbleRect.height / 2);

    animate(scope.current, {
      opacity: 1,
      x: dx, y: dy,
      width: 32, height: 32,
      boxShadow: '0 0 23px 8px rgba(255,255,255,.9)',
    }, { duration: 0 })
    .then(() => animate(scope.current, {
      y: dy - 75,
      boxShadow: '0 0 14px 7px rgba(255,255,255,.9)',
    }, { duration: 0.15, ease: 'linear' }))
    .then(() => animate(scope.current, {
      x: 0, y: 0,
      width: bubbleRect.width, height: bubbleRect.height,
      boxShadow: '0 0 14px 0 rgba(255,255,255,0.8)',
    }, { duration: 0.45, ease: [0.2, 0.8, 0.8, 1.05] }))
    .then(() => {
      if (scope.current) {
        scope.current.style.width  = '';
        scope.current.style.height = '';
      }
    })
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

export { userStyle, userP };
export default UserBubble;
