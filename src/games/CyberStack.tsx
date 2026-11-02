import React, { useRef, useEffect } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface CyberStackProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Debris {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vy: number;
  alpha: number;
}

export const CyberStack: React.FC<CyberStackProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: true,
    stack: [] as Block[],
    debris: [] as Debris[],
    currentX: 0,
    currentWidth: 160,
    direction: 1,
    speed: 3.5,
    cameraOffset: 0,
    targetCameraOffset: 0,
    blockHeight: 32,
  });

  const colors = ['#5DF8D8', '#F62477', '#5DF8D8', '#F62477'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    const blockHeight = stateRef.current.blockHeight;

    // Reset game state
    const baseWidth = 160;
    const baseBlock: Block = {
      x: (width - baseWidth) / 2,
      y: height - blockHeight - 20,
      width: baseWidth,
      height: blockHeight,
      color: '#5DF8D8',
    };

    stateRef.current = {
      score: 0,
      isPlaying: true,
      stack: [baseBlock],
      debris: [],
      currentX: 0,
      currentWidth: baseWidth,
      direction: 1,
      speed: 3.5,
      cameraOffset: 0,
      targetCameraOffset: 0,
      blockHeight,
    };

    const render = () => {
      const state = stateRef.current;
      if (!ctx) return;

      // Smooth camera
      state.cameraOffset += (state.targetCameraOffset - state.cameraOffset) * 0.1;

      // Clear Canvas
      ctx.fillStyle = '#141413';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(93, 248, 216, 0.08)';
      ctx.lineWidth = 1;
      for (let y = (state.cameraOffset % 40); y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(0, state.cameraOffset);

      // Render Stack Blocks
      for (let i = 0; i < state.stack.length; i++) {
        const b = state.stack[i];
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Cyber outline
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y, b.width, b.height);
      }

      // Render Debris
      for (let i = state.debris.length - 1; i >= 0; i--) {
        const d = state.debris[i];
        d.y += d.vy;
        d.vy += 0.4;
        d.alpha -= 0.02;

        if (d.alpha <= 0) {
          state.debris.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x, d.y, d.width, d.height);
        ctx.restore();
      }

      // Render Moving Block
      if (state.isPlaying) {
        state.currentX += state.speed * state.direction;
        if (state.currentX + state.currentWidth >= width) {
          state.currentX = width - state.currentWidth;
          state.direction = -1;
        } else if (state.currentX <= 0) {
          state.currentX = 0;
          state.direction = 1;
        }

        const topY = height - (state.stack.length + 1) * blockHeight - 20;
        const currentColor = colors[state.stack.length % colors.length];

        ctx.fillStyle = currentColor;
        ctx.shadowColor = currentColor;
        ctx.shadowBlur = 14;
        ctx.fillRect(state.currentX, topY, state.currentWidth, blockHeight);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(state.currentX, topY, state.currentWidth, blockHeight);
      }

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

    const topBlock = state.stack[state.stack.length - 1];
    const topY = (canvasRef.current?.height || 500) - (state.stack.length + 1) * state.blockHeight - 20;
    const currentColor = colors[state.stack.length % colors.length];

    const left1 = state.currentX;
    const right1 = state.currentX + state.currentWidth;
    const left2 = topBlock.x;
    const right2 = topBlock.x + topBlock.width;

    const overlapLeft = Math.max(left1, left2);
    const overlapRight = Math.min(right1, right2);
    const overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0) {
      // Missed completely -> Game Over
      state.isPlaying = false;
      sound.play('gameover');
      triggerHaptic('error');
      onGameOver(state.score);
      return;
    }

    // Spawn falling debris for sliced part
    if (left1 < left2) {
      // Left overhang
      state.debris.push({
        x: left1,
        y: topY,
        width: left2 - left1,
        height: state.blockHeight,
        color: currentColor,
        vy: 1,
        alpha: 1,
      });
    } else if (right1 > right2) {
      // Right overhang
      state.debris.push({
        x: right2,
        y: topY,
        width: right1 - right2,
        height: state.blockHeight,
        color: currentColor,
        vy: 1,
        alpha: 1,
      });
    }

    // Add new block to stack
    state.stack.push({
      x: overlapLeft,
      y: topY,
      width: overlapWidth,
      height: state.blockHeight,
      color: currentColor,
    });

    state.currentWidth = overlapWidth;
    state.score += 1;
    state.speed = Math.min(7.5, state.speed + 0.15);
    onScoreUpdate(state.score);

    sound.play('hit');
    triggerHaptic('light');

    // Scroll view if tower is tall
    if (state.stack.length > 5) {
      state.targetCameraOffset = (state.stack.length - 5) * state.blockHeight;
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
        <span className="font-tech-micro text-[11px] text-[#5DF8D8] bg-[#141413]/90 px-3 py-1 rounded border border-[#5DF8D8]/30">
          برای قرار دادن بلوک لمس کنید // TAP TO DROP
        </span>
      </div>
    </div>
  );
};
