import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface BreachLockProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

export const BreachLock: React.FC<BreachLockProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    needleAngle: 0, // radians
    targetAngle: Math.PI * 0.75, // radians
    targetTolerance: 0.35, // angular hit window (~20 deg)
    speed: 0.045, // rad/frame
    direction: 1,
    timeRemaining: 15.0, // seconds
    splashAlpha: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 28;

    stateRef.current = {
      score: 0,
      isPlaying: true,
      needleAngle: 0,
      targetAngle: Math.PI * 0.65,
      targetTolerance: 0.38,
      speed: 0.045,
      direction: 1,
      timeRemaining: 12.0,
      splashAlpha: 0,
    };

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const state = stateRef.current;

      if (state.isPlaying) {
        state.needleAngle = (state.needleAngle + state.speed * state.direction) % (Math.PI * 2);
        if (state.needleAngle < 0) state.needleAngle += Math.PI * 2;

        state.timeRemaining -= dt;
        if (state.timeRemaining <= 0) {
          state.isPlaying = false;
          sound.play('gameover');
          triggerHaptic('error');
          onGameOver(state.score);
          return;
        }

        if (state.splashAlpha > 0) {
          state.splashAlpha = Math.max(0, state.splashAlpha - 0.05);
        }
      }

      // Draw background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Flash hit effect
      if (state.splashAlpha > 0) {
        ctx.fillStyle = `rgba(246, 36, 119, ${state.splashAlpha * 0.35})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Dial Outer Ring
      ctx.save();
      ctx.translate(centerX, centerY);

      // Dash calibration circle
      ctx.strokeStyle = '#262624';
      ctx.lineWidth = 8;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Core Matrix
      ctx.strokeStyle = '#181817';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 24, 0, Math.PI * 2);
      ctx.stroke();

      // Target Arc / Node in #F62477
      const startArc = state.targetAngle - state.targetTolerance;
      const endArc = state.targetAngle + state.targetTolerance;

      ctx.strokeStyle = '#F62477';
      ctx.shadowColor = '#F62477';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(0, 0, radius, startArc, endArc);
      ctx.stroke();

      // Target Node Dot
      const nodeX = Math.cos(state.targetAngle) * radius;
      const nodeY = Math.sin(state.targetAngle) * radius;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Laser Needle in #5DF8D8
      const needleX = Math.cos(state.needleAngle) * radius;
      const needleY = Math.sin(state.needleAngle) * radius;

      ctx.strokeStyle = '#5DF8D8';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(needleX, needleY);
      ctx.stroke();

      // Needle Tip Marker
      ctx.fillStyle = '#5DF8D8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(needleX, needleY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Center Hub
      ctx.fillStyle = '#141413';
      ctx.strokeStyle = '#5DF8D8';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center Icon text
      ctx.fillStyle = '#F5F5F5';
      ctx.font = 'bold 12px "Peyda", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('SYNC', 0, 0);

      ctx.restore();

      // Time Gauge Linear Bar at top
      ctx.fillStyle = '#262624';
      ctx.fillRect(20, 16, width - 40, 6);
      const timePercent = Math.max(0, state.timeRemaining / 12.0);
      const gradient = ctx.createLinearGradient(20, 0, width - 20, 0);
      gradient.addColorStop(0, '#F62477');
      gradient.addColorStop(1, '#5DF8D8');
      ctx.fillStyle = gradient;
      ctx.fillRect(20, 16, (width - 40) * timePercent, 6);

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

    // Check angular difference between needle and target
    let diff = Math.abs(state.needleAngle - state.targetAngle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;

    if (diff <= state.targetTolerance) {
      // SUCCESS HIT!
      state.score += 1;
      state.speed = Math.min(0.09, state.speed + 0.0035);
      state.direction = state.direction * -1; // Reverse direction
      state.targetTolerance = Math.max(0.24, state.targetTolerance - 0.008);
      // Pick next target at least 90 degrees away
      const offset = (Math.random() * 0.8 + 0.5) * Math.PI;
      state.targetAngle = (state.needleAngle + (state.direction > 0 ? offset : -offset)) % (Math.PI * 2);
      if (state.targetAngle < 0) state.targetAngle += Math.PI * 2;
      state.timeRemaining = Math.min(12.0, state.timeRemaining + 2.5);
      state.splashAlpha = 1.0;

      sound.play('laser');
      triggerHaptic('medium');
      onScoreUpdate(state.score);
    } else {
      // MISSED!
      state.isPlaying = false;
      sound.play('gameover');
      triggerHaptic('error');
      onGameOver(state.score);
    }
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
        <span className="font-tech-micro text-[11px] text-[#F62477] bg-[#141413]/90 px-3 py-1 rounded border border-[#F62477]/30">
          هنگام عبور از گره سرخابی کلیک کنید // TAP ON TARGET
        </span>
      </div>
    </div>
  );
};
