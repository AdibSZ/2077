import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface GravityRunnerProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

interface Obstacle {
  x: number;
  isCeiling: boolean;
  width: number;
  height: number;
}

export const GravityRunner: React.FC<GravityRunnerProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    runnerY: 340,
    runnerGravity: 1, // 1: floor, -1: ceiling
    speed: 4.5,
    obstacles: [] as Obstacle[],
    lastObstacleX: 300,
    distanceRun: 0,
    particles: [] as { x: number; y: number; alpha: number }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const floorY = height - 40;
    const ceilingY = 40;

    stateRef.current = {
      score: 0,
      isPlaying: true,
      runnerY: floorY - 20,
      runnerGravity: 1,
      speed: 4.5,
      obstacles: [
        { x: width + 80, isCeiling: false, width: 22, height: 32 },
        { x: width + 260, isCeiling: true, width: 22, height: 32 },
      ],
      lastObstacleX: width + 260,
      distanceRun: 0,
      particles: [],
    };

    const render = () => {
      const state = stateRef.current;
      if (!ctx) return;

      if (state.isPlaying) {
        state.distanceRun += 1;
        state.score = Math.floor(state.distanceRun * 1.2);
        onScoreUpdate(state.score);

        // Gradually increase speed
        state.speed = Math.min(8.5, 4.5 + state.distanceRun * 0.002);

        // Gravity movement transition
        const targetY = state.runnerGravity === 1 ? floorY - 20 : ceilingY + 20;
        state.runnerY += (targetY - state.runnerY) * 0.25;

        // Dust/trail particles
        if (Math.random() > 0.4) {
          state.particles.push({
            x: 60 - 4,
            y: state.runnerY + (state.runnerGravity === 1 ? 10 : -10),
            alpha: 0.8,
          });
        }

        // Obstacles update
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;

          // Hitbox collision
          const runnerX = 60;
          const runnerRadius = 12;
          const obsTop = obs.isCeiling ? ceilingY : floorY - obs.height;
          const obsBottom = obs.isCeiling ? ceilingY + obs.height : floorY;

          if (
            runnerX + runnerRadius > obs.x &&
            runnerX - runnerRadius < obs.x + obs.width
          ) {
            if (
              (obs.isCeiling && state.runnerY - runnerRadius < obsBottom) ||
              (!obs.isCeiling && state.runnerY + runnerRadius > obsTop)
            ) {
              state.isPlaying = false;
              sound.play('gameover');
              triggerHaptic('error');
              onGameOver(state.score);
              return;
            }
          }

          if (obs.x < -40) {
            state.obstacles.splice(i, 1);
          }
        }

        // Spawn new obstacles
        const lastObs = state.obstacles[state.obstacles.length - 1];
        if (lastObs && lastObs.x < width - 60) {
          const spawnDistance = Math.random() * 120 + 170;
          state.obstacles.push({
            x: lastObs.x + spawnDistance,
            isCeiling: Math.random() > 0.5,
            width: 20,
            height: 32,
          });
        }
      }

      // Draw background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Draw Ceiling & Floor rails
      ctx.strokeStyle = '#5DF8D8';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;

      // Ceiling
      ctx.beginPath();
      ctx.moveTo(0, ceilingY);
      ctx.lineTo(width, ceilingY);
      ctx.stroke();

      // Floor
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(width, floorY);
      ctx.stroke();

      // Draw Grid dashes on rails
      ctx.strokeStyle = '#262624';
      ctx.lineWidth = 2;
      for (let x = -(state.distanceRun * state.speed) % 30; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ceilingY);
        ctx.moveTo(x, floorY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw Obstacles (spikes)
      for (const obs of state.obstacles) {
        ctx.fillStyle = '#F62477';
        ctx.shadowColor = '#F62477';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        if (obs.isCeiling) {
          // Pointing down from ceiling
          ctx.moveTo(obs.x, ceilingY);
          ctx.lineTo(obs.x + obs.width / 2, ceilingY + obs.height);
          ctx.lineTo(obs.x + obs.width, ceilingY);
        } else {
          // Pointing up from floor
          ctx.moveTo(obs.x, floorY);
          ctx.lineTo(obs.x + obs.width / 2, floorY - obs.height);
          ctx.lineTo(obs.x + obs.width, floorY);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Render Trail Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x -= 3;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#5DF8D8';
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.restore();
      }

      // Draw Runner (Cybernetic Diamond Pod)
      const runnerX = 60;
      const runnerY = state.runnerY;

      ctx.save();
      ctx.translate(runnerX, runnerY);
      ctx.fillStyle = '#5DF8D8';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 16;

      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(0, -10);
      ctx.lineTo(-12, 0);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#F62477';
      ctx.shadowColor = '#F62477';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(2, 0, 3, 0, Math.PI * 2);
      ctx.fill();

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
    if (!state.isPlaying) return;

    // Flip gravity
    state.runnerGravity = state.runnerGravity === 1 ? -1 : 1;
    sound.play('jump');
    triggerHaptic('medium');
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
          برای معکوس کردن جاذبه لمس کنید // TAP TO FLIP GRAVITY
        </span>
      </div>
    </div>
  );
};
