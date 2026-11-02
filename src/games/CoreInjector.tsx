import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface CoreInjectorProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

export const CoreInjector: React.FC<CoreInjectorProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    coreRotation: 0,
    coreSpeed: 0.035,
    pins: [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] as number[], // attached angles relative to core
    flyingPinY: null as number | null,
    flyingPinSpeed: 16,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height * 0.38;
    const coreRadius = 40;
    const pinLength = 70;
    const pinHeadRadius = 6;

    stateRef.current = {
      score: 0,
      isPlaying: true,
      coreRotation: 0,
      coreSpeed: 0.035,
      pins: [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5],
      flyingPinY: null,
      flyingPinSpeed: 16,
    };

    const render = () => {
      const state = stateRef.current;
      if (!ctx) return;

      if (state.isPlaying) {
        state.coreRotation += state.coreSpeed;

        // Animate flying pin
        if (state.flyingPinY !== null) {
          state.flyingPinY -= state.flyingPinSpeed;

          // Check if pin reached the core surface
          if (state.flyingPinY <= centerY + coreRadius + pinLength) {
            // Check collision with any existing pin
            // Flying pin enters at bottom (angle = PI/2 in screen space)
            const injectionAngle = (Math.PI / 2 - state.coreRotation) % (Math.PI * 2);
            const normalizedInjection = injectionAngle < 0 ? injectionAngle + Math.PI * 2 : injectionAngle;

            const minAngleTolerance = 0.22; // ~12 degrees
            let collided = false;

            for (const pinAngle of state.pins) {
              const diff = Math.abs(pinAngle - normalizedInjection);
              const angleDist = Math.min(diff, Math.PI * 2 - diff);
              if (angleDist < minAngleTolerance) {
                collided = true;
                break;
              }
            }

            if (collided) {
              // Collided!
              state.isPlaying = false;
              state.flyingPinY = null;
              sound.play('gameover');
              triggerHaptic('error');
              onGameOver(state.score);
              return;
            } else {
              // Successfully lodged!
              state.pins.push(normalizedInjection);
              state.score += 1;
              state.flyingPinY = null;

              // Modulate rotation
              if (state.score % 4 === 0) {
                state.coreSpeed = state.coreSpeed * -1.05;
              } else {
                state.coreSpeed = state.coreSpeed > 0 ? state.coreSpeed + 0.001 : state.coreSpeed - 0.001;
              }

              onScoreUpdate(state.score);
              sound.play('hit');
              triggerHaptic('light');
            }
          }
        }
      }

      // Draw Background
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Render Attached Pins
      for (const angle of state.pins) {
        const totalAngle = angle + state.coreRotation;
        const startX = centerX + Math.cos(totalAngle) * coreRadius;
        const startY = centerY + Math.sin(totalAngle) * coreRadius;
        const endX = centerX + Math.cos(totalAngle) * (coreRadius + pinLength);
        const endY = centerY + Math.sin(totalAngle) * (coreRadius + pinLength);

        // Pin Spoke
        ctx.strokeStyle = '#5DF8D8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Pin Head
        ctx.fillStyle = '#5DF8D8';
        ctx.shadowColor = '#5DF8D8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(endX, endY, pinHeadRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Central Core
      ctx.fillStyle = '#F62477';
      ctx.shadowColor = '#F62477';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core interior details
      ctx.fillStyle = '#141413';
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F5F5F5';
      ctx.font = 'bold 16px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(state.score.toString(), centerX, centerY);

      // Render Ready Pin at bottom OR flying pin
      const bottomY = height - 50;
      const currentPinY = state.flyingPinY !== null ? state.flyingPinY : bottomY;

      // Pin Spoke
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, currentPinY);
      ctx.lineTo(centerX, currentPinY - pinLength);
      ctx.stroke();

      // Pin Head
      ctx.fillStyle = '#5DF8D8';
      ctx.shadowColor = '#5DF8D8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(centerX, currentPinY - pinLength, pinHeadRadius, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleTap = () => {
    const state = stateRef.current;
    if (!state.isPlaying || state.flyingPinY !== null) return;

    state.flyingPinY = (canvasRef.current?.height || 400) - 50;
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
          برای شلیک پین لمس کنید // TAP TO INJECT
        </span>
      </div>
    </div>
  );
};
