import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface GlitchFlapProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

interface Gate {
  x: number;
  gapY: number;
  gapHeight: number;
  passed: boolean;
}

export const GlitchFlap: React.FC<GlitchFlapProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    droneY: 200,
    velocity: 0,
    gravity: 0.38,
    jumpStrength: -6.5,
    gates: [] as Gate[],
    gateSpeed: 2.8,
    gateSpacing: 180,
    lastSpawnX: 300,
    particles: [] as { x: number; y: number; alpha: number; color: string }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;

    stateRef.current = {
      score: 0,
      isPlaying: true,
      droneY: height / 2,
      velocity: 0,
      gravity: 0.38,
      jumpStrength: -6.5,
      gates: [
        { x: width + 50, gapY: 140, gapHeight: 110, passed: false },
        { x: width + 50 + 190, gapY: 200, gapHeight: 110, passed: false },
      ],
      gateSpeed: 2.8,
      gateSpacing: 190,
      lastSpawnX: width + 50 + 190,
      particles: [],
    };

    const render = () => {
      const state = stateRef.current;
      if (!ctx) return;

      // Update Drone Physics
      if (state.isPlaying) {
        state.velocity += state.gravity;
        state.droneY += state.velocity;

        // Boundary check
        if (state.droneY < 12 || state.droneY > height - 12) {
          state.isPlaying = false;
          sound.play('gameover');
          triggerHaptic('error');
          onGameOver(state.score);
          return;
        }

        // Spawn drone thruster particles
        if (Math.random() > 0.3) {
          state.particles.push({
            x: 60 - 8,
            y: state.droneY + (Math.random() * 6 - 3),
            alpha: 1,
            color: Math.random() > 0.5 ? '#5DF8D8' : '#F62477',
          });
        }

        // Gates update
        for (let i = state.gates.length - 1; i >= 0; i--) {
          const g = state.gates[i];
          g.x -= state.gateSpeed;

          // Score check
          if (!g.passed && g.x + 30 < 60) {
            g.passed = true;
            state.score += 1;
            state.gateSpeed = Math.min(5.0, state.gateSpeed + 0.08);
            sound.play('score');
            triggerHaptic('light');
            onScoreUpdate(state.score);
          }

          // Collision check
          const droneRadius = 10;
          const droneX = 60;
          if (droneX + droneRadius > g.x && droneX - droneRadius < g.x + 30) {
            // inside gate x-bounds
            if (state.droneY - droneRadius < g.gapY || state.droneY + droneRadius > g.gapY + g.gapHeight) {
              // Collided!
              state.isPlaying = false;
              sound.play('gameover');
              triggerHaptic('error');
              onGameOver(state.score);
              return;
            }
          }

          if (g.x < -60) {
            state.gates.splice(i, 1);
          }
        }

        // Spawn new gates
        const lastGate = state.gates[state.gates.length - 1];
        if (lastGate && lastGate.x < width - 60) {
          const gapHeight = Math.max(90, 120 - state.score * 1.5);
          const gapY = Math.random() * (height - gapHeight - 80) + 40;
          state.gates.push({
            x: lastGate.x + state.gateSpacing,
            gapY,
            gapHeight,
            passed: false,
          });
        }
      }

      // Draw Background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Draw laser columns (Gates)
      for (const g of state.gates) {
        // Top laser column
        ctx.fillStyle = 'rgba(246, 36, 119, 0.2)';
        ctx.fillRect(g.x, 0, 28, g.gapY);
        ctx.strokeStyle = '#F62477';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#F62477';
        ctx.shadowBlur = 10;
        ctx.strokeRect(g.x, 0, 28, g.gapY);

        // Bottom laser column
        const bottomY = g.gapY + g.gapHeight;
        ctx.fillStyle = 'rgba(246, 36, 119, 0.2)';
        ctx.fillRect(g.x, bottomY, 28, height - bottomY);
        ctx.strokeRect(g.x, bottomY, 28, height - bottomY);

        // Safe gate edge beacons
        ctx.fillStyle = '#5DF8D8';
        ctx.shadowColor = '#5DF8D8';
        ctx.shadowBlur = 12;
        ctx.fillRect(g.x - 2, g.gapY - 4, 32, 6);
        ctx.fillRect(g.x - 2, bottomY - 2, 32, 6);
      }

      // Render Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x -= 2.5;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.restore();
      }

      // Render Drone
      const droneX = 60;
      const droneY = state.droneY;

      ctx.save();
      ctx.translate(droneX, droneY);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, state.velocity * 0.08));
      ctx.rotate(angle);

      // Drone Body
      ctx.fillStyle = '#5DF8D8';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();

      // Drone Core Eye
      ctx.fillStyle = '#F62477';
      ctx.shadowColor = '#F62477';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
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

    state.velocity = state.jumpStrength;
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
          برای پرواز تپ کنید // TAP TO FLAP
        </span>
      </div>
    </div>
  );
};
