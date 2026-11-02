import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface OrbitJumpProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

interface OrbitRing {
  x: number;
  y: number;
  radius: number;
  direction: number; // 1 or -1
}

export const OrbitJump: React.FC<OrbitJumpProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    rings: [] as OrbitRing[],
    currentRingIndex: 0,
    angle: 0,
    speed: 0.055,
    isFreeFlying: false,
    orbX: 0,
    orbY: 0,
    vx: 0,
    vy: 0,
    cameraY: 0,
    targetCameraY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;

    const ring0: OrbitRing = { x: width / 2, y: height - 90, radius: 46, direction: 1 };
    const ring1: OrbitRing = { x: width / 2 + (Math.random() * 80 - 40), y: height - 210, radius: 46, direction: -1 };
    const ring2: OrbitRing = { x: width / 2 + (Math.random() * 80 - 40), y: height - 330, radius: 46, direction: 1 };

    stateRef.current = {
      score: 0,
      isPlaying: true,
      rings: [ring0, ring1, ring2],
      currentRingIndex: 0,
      angle: 0,
      speed: 0.055,
      isFreeFlying: false,
      orbX: ring0.x + ring0.radius,
      orbY: ring0.y,
      vx: 0,
      vy: 0,
      cameraY: 0,
      targetCameraY: 0,
    };

    const render = () => {
      const state = stateRef.current;
      if (!ctx) return;

      // Smooth camera interpolation
      state.cameraY += (state.targetCameraY - state.cameraY) * 0.1;

      if (state.isPlaying) {
        if (!state.isFreeFlying) {
          // Orbiting current ring
          const currentRing = state.rings[state.currentRingIndex];
          state.angle += state.speed * currentRing.direction;
          state.orbX = currentRing.x + Math.cos(state.angle) * currentRing.radius;
          state.orbY = currentRing.y + Math.sin(state.angle) * currentRing.radius;
        } else {
          // Free flying in tangential direction
          state.orbX += state.vx;
          state.orbY += state.vy;

          // Check if captured by next ring
          const nextRing = state.rings[state.currentRingIndex + 1];
          if (nextRing) {
            const dx = state.orbX - nextRing.x;
            const dy = state.orbY - nextRing.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (Math.abs(dist - nextRing.radius) < 22) {
              // Captured!
              state.isFreeFlying = false;
              state.currentRingIndex += 1;
              state.angle = Math.atan2(dy, dx);
              state.score += 1;
              state.speed = Math.min(0.09, state.speed + 0.003);
              state.targetCameraY = state.currentRingIndex * 120;

              // Spawn new ring ahead
              const lastRing = state.rings[state.rings.length - 1];
              state.rings.push({
                x: width / 2 + (Math.random() * 100 - 50),
                y: lastRing.y - 120,
                radius: 46,
                direction: Math.random() > 0.5 ? 1 : -1,
              });

              sound.play('score');
              triggerHaptic('medium');
              onScoreUpdate(state.score);
            }
          }

          // Out of screen boundaries
          if (
            state.orbX < -40 ||
            state.orbX > width + 40 ||
            state.orbY > state.rings[state.currentRingIndex].y + 160 ||
            state.orbY < state.rings[state.rings.length - 1].y - 200
          ) {
            state.isPlaying = false;
            sound.play('gameover');
            triggerHaptic('error');
            onGameOver(state.score);
            return;
          }
        }
      }

      // Draw Background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(0, state.cameraY);

      // Render Orbital Rings
      for (let i = 0; i < state.rings.length; i++) {
        const ring = state.rings[i];
        const isCurrent = i === state.currentRingIndex;
        const isNext = i === state.currentRingIndex + 1;

        // Ring circle
        ctx.strokeStyle = isCurrent ? '#5DF8D8' : isNext ? '#F62477' : '#262624';
        ctx.shadowColor = isCurrent ? '#5DF8D8' : isNext ? '#F62477' : 'transparent';
        ctx.shadowBlur = isCurrent || isNext ? 12 : 0;
        ctx.lineWidth = isCurrent ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Ring center node
        ctx.fillStyle = isCurrent ? '#5DF8D8' : isNext ? '#F62477' : '#262624';
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Orb
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(state.orbX, state.orbY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow ring on orb
      ctx.strokeStyle = '#5DF8D8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.orbX, state.orbY, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleTap = () => {
    const state = stateRef.current;
    if (!state.isPlaying || state.isFreeFlying) return;

    // Launch orb along tangential vector
    const currentRing = state.rings[state.currentRingIndex];
    const launchSpeed = 8.0;

    // Tangent angle is perpendicular to radius
    const tangentAngle = state.angle + (Math.PI / 2) * currentRing.direction;
    state.vx = Math.cos(tangentAngle) * launchSpeed;
    state.vy = Math.sin(tangentAngle) * launchSpeed;
    state.isFreeFlying = true;

    sound.play('jump');
    triggerHaptic('light');
  };

  return (
    <div
      className="relative w-full h-[400px] flex items-center justify-center cursor-pointer select-none"
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    >
      <canvas
        ref={canvasRef}
        width={340}
        height={400}
        className="w-full h-full max-w-[360px] rounded-lg border border-[#5DF8D8]/20 shadow-inner"
      />
      <div className="absolute bottom-2 text-center pointer-events-none">
        <span className="font-tech-micro text-[11px] text-[#5DF8D8] bg-[#141413]/90 px-3 py-1 rounded border border-[#5DF8D8]/30">
          برای پرتاب به مدار بعدی تپ کنید // TAP TO LAUNCH
        </span>
      </div>
    </div>
  );
};
