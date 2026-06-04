import React, { useEffect } from 'react';
import { motion, useAnimate, usePresence } from 'motion/react';
import { spawnParticles, SWIPE_CONFIG } from '../shared/SwipeCard.jsx';

const aiStyle = {
  maxWidth: '262px',
  padding: '32px',
  alignSelf: 'flex-start',
  borderRadius: '24px 24px 24px 0',
  position: 'absolute',
};

const aiP = {
  fontSize: 'var(--text-md)',
  lineHeight: '1.53',
  whiteSpace: 'pre-wrap',
  margin: 0,
  fontFamily: 'var(--font-serif)',
  fontStyle: 'italic',
  color: 'var(--color-text)',
  textAlign: 'right',
};

const TYPE_TO_DIR = { yes: 'right', no: 'left', sometimes: 'sometimes' };

const AiBubble = ({ children, answerType, style, ...motionProps }) => {
  const [scope] = useAnimate();
  const [isPresent] = usePresence();

  useEffect(() => {
    if (!isPresent && scope.current) {
      const dir = TYPE_TO_DIR[answerType] ?? 'unsure';
      spawnParticles(scope.current.getBoundingClientRect(), dir, SWIPE_CONFIG.particles);
    }
  }, [isPresent]);

  return (
    <motion.div ref={scope} style={style} {...motionProps}>
      {children}
    </motion.div>
  );
};

export { aiStyle, aiP };
export default AiBubble;
