import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface ZeroMsProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

export const ZeroMs: React.FC<ZeroMsProps> = ({ onScoreUpdate, onGameOver }) => {
  const [phase, setPhase] = useState<'ready' | 'running' | 'stopped'>('ready');
  const [targetTime] = useState(5.0); // 5.000 seconds
  const [elapsedTime, setElapsedTime] = useState(0);
  const [resultDiff, setResultDiff] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleStart = () => {
    setPhase('running');
    setResultDiff(null);
    startTimeRef.current = performance.now();
    sound.play('tap');
    triggerHaptic('light');

    const updateTimer = () => {
      if (!startTimeRef.current) return;
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedTime(elapsed);

      // Auto-fail if over 10 seconds
      if (elapsed > 10.0) {
        handleStop(elapsed);
        return;
      }

      animFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animFrameRef.current = requestAnimationFrame(updateTimer);
  };

  const handleStop = (forcedElapsed?: number) => {
    if (phase !== 'running') return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const finalElapsed = forcedElapsed ?? (startTimeRef.current ? (performance.now() - startTimeRef.current) / 1000 : 0);
    setElapsedTime(finalElapsed);
    setPhase('stopped');

    const diffSeconds = Math.abs(finalElapsed - targetTime);
    const diffMs = Math.round(diffSeconds * 1000);
    setResultDiff(diffMs);

    // Calculate score out of 1000
    let earnedScore = Math.max(0, 1000 - Math.round(diffMs * 1.5));
    if (diffMs < 30) earnedScore = 1000; // Perfect bonus!

    setScore(earnedScore);
    onScoreUpdate(earnedScore);

    if (diffMs < 100) {
      sound.play('score');
      triggerHaptic('success');
    } else {
      sound.play('hit');
      triggerHaptic('medium');
    }

    // After 2.5 seconds, trigger game over to submit score
    setTimeout(() => {
      onGameOver(earnedScore);
    }, 2500);
  };

  const isHidden = phase === 'running' && elapsedTime > 1.25;

  return (
    <div className="relative w-full max-w-[360px] h-[400px] bg-[#141413] border border-[#5DF8D8]/20 rounded-xl p-6 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Telemetry */}
      <div className="w-full flex items-center justify-between text-xs">
        <span className="font-tech-micro text-[#A3A39F]">// ZERO-MS QUANTUM CLOCK</span>
        <span className="font-code-md text-[#5DF8D8] bg-[#1E1E1C] px-2 py-0.5 rounded border border-[#5DF8D8]/30">
          هدف: ۵.۰۰۰s
        </span>
      </div>

      {/* Center Digital Display */}
      <div className="flex flex-col items-center justify-center my-auto w-full">
        <div className="relative w-full bg-[#0D0D0C] border border-[#5DF8D8]/30 p-6 rounded-lg shadow-inner text-center overflow-hidden">
          {/* Ambient scanner line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#5DF8D8]/5 to-transparent pointer-events-none animate-pulse"></div>

          <span className="font-tech-micro text-[#A3A39F] text-xs uppercase tracking-widest block mb-2">
            {phase === 'ready' && 'آماده شلیک زمانی'}
            {phase === 'running' && (isHidden ? 'سیستم مخفی‌سازی فعال [STEALTH]' : 'ثبت فرکانس')}
            {phase === 'stopped' && 'نتیجه ارزیابی میلی‌ثانیه'}
          </span>

          <div className="font-code-lg text-4xl sm:text-5xl font-black tracking-widest text-[#5DF8D8] drop-shadow-[0_0_15px_rgba(93,248,216,0.6)]">
            {phase === 'ready' && '0.000s'}
            {phase === 'running' && (isHidden ? '??.???s' : `${elapsedTime.toFixed(3)}s`)}
            {phase === 'stopped' && `${elapsedTime.toFixed(3)}s`}
          </div>

          {resultDiff !== null && (
            <div className="mt-3 pt-3 border-t border-[#262624] flex items-center justify-between font-tech-micro text-xs">
              <span className="text-[#A3A39F]">خطا:</span>
              <span className={`font-bold ${resultDiff < 100 ? 'text-[#5DF8D8]' : 'text-[#F62477]'}`}>
                {resultDiff}ms ±
              </span>
              <span className="text-[#A3A39F]">امتیاز:</span>
              <span className="text-[#5DF8D8] font-bold">+{score} XP</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full">
        {phase === 'ready' && (
          <button
            onClick={handleStart}
            className="w-full py-4 bg-[#5DF8D8] text-[#0A2821] font-title-sm font-extrabold rounded-lg shadow-[0_0_16px_rgba(93,248,216,0.5)] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            <span>شروع تایمر // START</span>
          </button>
        )}

        {phase === 'running' && (
          <button
            onClick={() => handleStop()}
            className="w-full py-4 bg-[#F62477] text-white font-title-sm font-extrabold rounded-lg shadow-[0_0_20px_rgba(246,36,119,0.7)] active:scale-95 transition-transform flex items-center justify-center gap-2 animate-pulse"
          >
            <span className="material-symbols-outlined">timer_off</span>
            <span>توقف دقیق روی ۵ ثانیه // STOP</span>
          </button>
        )}

        {phase === 'stopped' && (
          <div className="text-center font-tech-micro text-xs text-[#5DF8D8] animate-pulse">
            در حال ثبت امتیاز در شبکه... [ACK_OK]
          </div>
        )}
      </div>
    </div>
  );
};
