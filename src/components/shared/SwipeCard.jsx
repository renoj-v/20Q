import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import './SwipeCard.css';

/* ─── Tunable animation config ─── */
export const SWIPE_CONFIG = {
  // How far (px) the card must travel to count as a committed swipe
  swipeThreshold: 100,

  // Maximum drag distance (px) used to normalise the glow intensity (0→1)
  maxDragDistance: 180,

  // How long the card takes to dissolve (ms) before the next card enters
  dissolveDuration: 90,

  // Slight rotation applied while dragging (deg per px of drag)
  rotationFactor: 0.08,

  // ── Glow ──
  glow: {
    neutral:   { color: 'rgba(255, 255, 255, 0.6)', blur: 13, spread: 0 },
    yes:       { color: 'rgba(72, 199, 108, 0.85)',  blur: 28, spread: 4 },
    no:        { color: 'rgba(220, 60, 60, 0.85)',    blur: 28, spread: 4 },
    sometimes: { color: 'rgba(240, 200, 40, 0.85)',   blur: 28, spread: 4 },
    unsure:    { color: 'rgba(255, 255, 255, 0.9)',    blur: 30, spread: 5 },
  },

  // ── Particles ──
  particles: {
    count: 32,
    // Min / max lifetime in ms
    lifetimeMin: 1600,
    lifetimeMax: 2000,
    // Min / max travel distance (px)
    distanceMin: 80,
    distanceMax: 280,
    // Size range (px)
    sizeMin: 8,
    sizeMax: 22,
    // Angular spread (radians) – full circle = Math.PI * 2
    spread: Math.PI * 2,
  },
};
/* ────────────────────────────── */

// Hue ranges for particle colors by direction/type
const PARTICLE_HUES = {
  right:     { base: 140, range: 30 },  // green
  left:      { base: 341,   range: 20 },  // red
  sometimes: { base: 45,  range: 20 },  // yellow/amber
  unsure:    { base: 0,   range: 360, saturation: 0, lightness: 85 }, // white
};

export function spawnParticles(rect, direction, config) {
  const container = document.createElement('div');
  container.className = 'swipe-particles';
  container.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(container);

  const { count, lifetimeMin, lifetimeMax, distanceMin, distanceMax, sizeMin, sizeMax, spread } = config;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const hueInfo = PARTICLE_HUES[direction] || PARTICLE_HUES.right;
  // For directional swipes bias the angle; for button clicks burst in all directions
  const isDirectional = direction === 'right' || direction === 'left';
  const baseAngle = isDirectional ? (direction === 'right' ? 0 : Math.PI) : 0;

  for (let i = 0; i < count; i++) {
    const angle = isDirectional
      ? baseAngle + (Math.random() - 0.5) * spread
      : Math.random() * Math.PI * 2;
    const distance = distanceMin + Math.random() * (distanceMax - distanceMin);
    const lifetime = lifetimeMin + Math.random() * (lifetimeMax - lifetimeMin);
    const size = sizeMin + Math.random() * (sizeMax - sizeMin);

    // Scatter origin across the card face
    const ox = cx + (Math.random() - 0.5) * rect.width * 0.6;
    const oy = cy + (Math.random() - 0.5) * rect.height * 0.4;

    const hue = hueInfo.base + Math.random() * hueInfo.range;
    const sat = hueInfo.saturation ?? 80;
    const lightness = hueInfo.lightness ?? (55 + Math.random() * 25);

    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;
      left:${ox}px;top:${oy}px;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:hsl(${hue},${sat}%,${lightness}%);
      opacity:1;
      pointer-events:none;
      transition:transform ${lifetime}ms cubic-bezier(.15,.8,.3,1),opacity ${lifetime}ms ease-out;
    `;


    const dotBG = document.createElement('div');
    dotBG.style.cssText = dot.style.cssText;
    dotBG.style.filter = 'blur(15px)';

    container.appendChild(dotBG);
    container.appendChild(dot);

    dot.getBoundingClientRect();
    requestAnimationFrame(() => {
      dot.style.transform = `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(0.2)`;
      dot.style.opacity = '0';
      dotBG.style.transform = `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(0.2)`;
      dotBG.style.opacity = '0';
    });
  }

  setTimeout(() => container.remove(), lifetimeMax + 50);
}

const SwipeCard = forwardRef(({ text, isLoading, onSwipe, disabled, glowOverride }, ref) => {
  const cardRef = useRef(null);

  // Expose the card DOM element + dissolve trigger to parent via ref
  useImperativeHandle(ref, () => ({
    getBoundingClientRect: () => cardRef.current?.getBoundingClientRect(),
    dissolve: () => setDissolving(true),
    swipeOut: (direction) => {
      const dx = direction === 'right' ? SWIPE_CONFIG.swipeThreshold : -SWIPE_CONFIG.swipeThreshold;
      setOffset({ x: dx, y: 0 });
      setDissolving(true);
    },
  }));
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dissolving, setDissolving] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  const progress = Math.max(-1, Math.min(1, offset.x / SWIPE_CONFIG.maxDragDistance));

  const onPointerDown = useCallback((e) => {
    if (disabled || dissolving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    currentOffset.current = { x: 0, y: 0 };
    setDragging(true);
  }, [disabled, dissolving]);

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    currentOffset.current = { x: dx, y: dy };
    setOffset({ x: dx, y: dy });
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    const dx = currentOffset.current.x;

    if (Math.abs(dx) >= SWIPE_CONFIG.swipeThreshold) {
      const direction = dx > 0 ? 'right' : 'left';
      const answer = direction === 'right' ? 'Yes' : 'No';

      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        spawnParticles(rect, direction, SWIPE_CONFIG.particles);
      }

      // Dissolve the card in place
      setDissolving(true);

      setTimeout(() => {
        onSwipe(answer);
      }, SWIPE_CONFIG.dissolveDuration);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [dragging, onSwipe]);

  // ── Compute glow ──
  const glowCfg = SWIPE_CONFIG.glow;
  let shadowColor, shadowBlur, shadowSpread;
  const absProgress = Math.abs(progress);

  if (glowOverride && glowCfg[glowOverride]) {
    // External override (e.g. hovering Sometimes button)
    const g = glowCfg[glowOverride];
    shadowColor = g.color;
    shadowBlur = g.blur;
    shadowSpread = g.spread;
  } else if (absProgress < 0.05) {
    shadowColor = glowCfg.neutral.color;
    shadowBlur = glowCfg.neutral.blur;
    shadowSpread = glowCfg.neutral.spread;
  } else if (progress > 0) {
    shadowColor = glowCfg.yes.color;
    shadowBlur = glowCfg.neutral.blur + (glowCfg.yes.blur - glowCfg.neutral.blur) * absProgress;
    shadowSpread = glowCfg.neutral.spread + (glowCfg.yes.spread - glowCfg.neutral.spread) * absProgress;
  } else {
    shadowColor = glowCfg.no.color;
    shadowBlur = glowCfg.neutral.blur + (glowCfg.no.blur - glowCfg.neutral.blur) * absProgress;
    shadowSpread = glowCfg.neutral.spread + (glowCfg.no.spread - glowCfg.neutral.spread) * absProgress;
  }

  const rotation = offset.x * SWIPE_CONFIG.rotationFactor;
  const dur = SWIPE_CONFIG.dissolveDuration;

  const cardStyle = dissolving
    ? {
        transition: `transform ${dur}ms ease-in, opacity ${dur}ms ease-in, box-shadow ${dur}ms ease-in`,
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(1.2)`,
        opacity: 0,
        boxShadow: `0 0 ${Math.round(shadowBlur)}px ${Math.round(shadowSpread)}px ${shadowColor}`,
      }
    : {
        transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(.2,.8,.3,1), box-shadow 0.3s ease',
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        boxShadow: `0 0 ${Math.round(shadowBlur)}px ${Math.round(shadowSpread)}px ${shadowColor}`,
        cursor: disabled ? 'default' : 'grab',
      };

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      style={cardStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <p className={`swipe-card-text${isLoading ? ' loading' : ''}`}>
        {text}
      </p>
    </div>
  );
});

export default SwipeCard;
