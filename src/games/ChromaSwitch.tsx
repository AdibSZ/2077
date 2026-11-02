import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface ChromaSwitchProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

const CHROMA_COLORS = ['#F62477', '#5DF8D8', '#F5F5F5'];

interface LaserWall {
  y: number;
  colorIndex: number;
  height: number;
  passed: boolean;
}

export const ChromaSwitch: React.FC<ChromaSwitchProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    playerColorIndex: 0,
    walls: [] as LaserWall[],
    speed: 3.2,
    wallSpacing: 180,
    particles: [] as { x: number; y: number; color: string; alpha: number; vy: number }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const shieldY = height - 70;

    stateRef.current = {
      score: 0,
      isPlaying: true,
      playerColorIndex: 0,
      walls: [
        { y: -30, colorIndex: Math.floor(Math.random() * 3), height: 18, passed: false },
        { y: -30 - 180, colorIndex: Math.floor(Math.random() * 3), height: 18, passed: false },
      ],
      speed: 3.2,
      wallSpacing: 180,
      particles: [],
    };

    const render = () => {
      const state = stateRef.current;
      if (!ctx) return;

      if (state.isPlaying) {
        // Walls descending
        for (let i = state.walls.length - 1; i >= 0; i--) {
          const w = state.walls[i];
          w.y += state.speed;

          // Check collision with shield (y reaches shieldY)
          if (!w.passed && w.y + w.height >= shieldY && w.y <= shieldY + 12) {
            if (w.colorIndex === state.playerColorIndex) {
              // Match!
              w.passed = true;
              state.score += 1;
              state.speed = Math.min(6.5, state.speed + 0.12);
              onScoreUpdate(state.score);

              // Spawn particles
              const wallColor = CHROMA_COLORS[w.colorIndex];
              for (let p = 0; p < 14; p++) {
                state.particles.push({
                  x: Math.random() * (width - 40) + 20,
                  y: shieldY,
                  color: wallColor,
                  alpha: 1.0,
                  vy: Math.random() * 4 - 2,
                });
              }

              sound.play('hit');
              triggerHaptic('light');
            } else {
              // Color mismatch -> Game Over!
              state.isPlaying = false;
              sound.play('gameover');
              triggerHaptic('error');
              onGameOver(state.score);
              return;
            }
          }

          if (w.y > height + 20) {
            state.walls.splice(i, 1);
          }
        }

        // Spawn new walls
        const lastWall = state.walls[state.walls.length - 1];
        if (lastWall && lastWall.y > -50) {
          state.walls.push({
            y: lastWall.y - state.wallSpacing,
            colorIndex: Math.floor(Math.random() * 3),
            height: 18,
            passed: false,
          });
        }
      }

      // Draw Background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Render Walls
      for (const w of state.walls) {
        if (w.passed) continue;
        const color = CHROMA_COLORS[w.colorIndex];
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.fillRect(24, w.y, width - 48, w.height);

        // Cyber grid marks on wall
        ctx.fillStyle = '#141413';
        for (let x = 36; x < width - 48; x += 24) {
          ctx.fillRect(x, w.y + 4, 10, w.height - 8);
        }
      }

      // Render Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.y += p.vy;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.restore();
      }

      // Render Player Shield
      const activeColor = CHROMA_COLORS[state.playerColorIndex];
      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 18;
      ctx.fillRect(24, shieldY, width - 48, 14);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, shieldY, width - 48, 14);

      // Shield emitter pod
      ctx.fillStyle = '#1C1C1B';
      ctx.fillRect(width / 2 - 30, shieldY + 14, 60, 16);
      ctx.strokeStyle = activeColor;
      ctx.strokeRect(width / 2 - 30, shieldY + 14, 60, 16);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleTap = () => {
    const state = stateRef.current;
    if (!state.isPlaying) return;

    // Cycle shield color
    state.playerColorIndex = (state.playerColorIndex + 1) % 3;
    sound.play('tap');
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
          برای تغییر رنگ سپر تپ کنید // TAP TO SWITCH COLOR
        </span>
      </div>
    </div>
  );
};
