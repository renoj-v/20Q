export function spawnPersistentParticles(rect) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;overflow:hidden;';
  document.body.appendChild(container);

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 25; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 400;
    const x = cx + Math.cos(angle) * dist * 50;
    const y = cy + Math.sin(angle) * dist % 20;
    const size = 22 + Math.random() * 12;
    const driftX = (Math.random() - 0.5) * 100;
    const driftY = (Math.random() - 0.5) * 100;
    const duration = 5 + Math.random() * 4;
    const delay = Math.random() * 1;

    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;
      left:${x}px;top:${y}px;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:white;
      filter:blur(12px);
      opacity:0;
      pointer-events:none;
      --drift-x:${driftX}px;
      --drift-y:${driftY}px;
      animation:persistentDrift ${duration}s ease-in-out ${delay}s infinite alternate;
      transition:opacity 0.8s ease ${delay}s;
    `;
    container.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.opacity = '0.7';
    });
  }

  return container;
}

export function detectFinalGuess(aiResponse, questionCount) {
  const lower = aiResponse.toLowerCase();
  return (
    lower.includes('my final guess') ||
    lower.includes('my guess is') ||
    lower.includes('i think it is') ||
    lower.includes("i'm going to guess") ||
    lower.includes('i believe it is') ||
    (questionCount >= 10 && /\bis it [a-z]/.test(lower))
  );
}
