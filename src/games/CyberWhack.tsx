import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface CyberWhackProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

type CellState = 'empty' | 'bug' | 'safe';

export const CyberWhack: React.FC<CyberWhackProps> = ({ onScoreUpdate, onGameOver }) => {
  const [grid, setGrid] = useState<CellState[]>(Array(16).fill('empty'));
  const [lives, setLives] = useState(3);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const isPlayingRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRateRef = useRef(750); // ms

  useEffect(() => {
    scoreRef.current = 0;
    livesRef.current = 3;
    isPlayingRef.current = true;
    spawnRateRef.current = 750;

    const spawnLoop = () => {
      if (!isPlayingRef.current) return;

      setGrid((prev) => {
        const next = [...prev];
        // Clear old items that were missed
        let missedBug = false;
        for (let i = 0; i < 16; i++) {
          if (next[i] === 'bug') {
            missedBug = true;
          }
          next[i] = 'empty';
        }

        if (missedBug) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          sound.play('gameover');
          triggerHaptic('error');

          if (livesRef.current <= 0) {
            isPlayingRef.current = false;
            onGameOver(scoreRef.current);
            return Array(16).fill('empty');
          }
        }

        // Pick random empty index
        const randIndex1 = Math.floor(Math.random() * 16);
        const isBug = Math.random() > 0.35; // 65% chance of bug, 35% safe decoy
        next[randIndex1] = isBug ? 'bug' : 'safe';

        // Occasionally spawn second decoy
        if (Math.random() > 0.6) {
          const randIndex2 = (randIndex1 + Math.floor(Math.random() * 15) + 1) % 16;
          next[randIndex2] = isBug ? 'safe' : 'bug';
        }

        return next;
      });

      // Increase speed as score climbs
      spawnRateRef.current = Math.max(420, 750 - scoreRef.current * 8);
      timerRef.current = setTimeout(spawnLoop, spawnRateRef.current);
    };

    timerRef.current = setTimeout(spawnLoop, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCellClick = (index: number) => {
    if (!isPlayingRef.current) return;
    const cell = grid[index];

    if (cell === 'bug') {
      // Whacked Bug!
      scoreRef.current += 1;
      onScoreUpdate(scoreRef.current);
      sound.play('whack');
      triggerHaptic('medium');

      // Clear that cell
      setGrid((prev) => {
        const next = [...prev];
        next[index] = 'empty';
        return next;
      });
    } else if (cell === 'safe') {
      // Tapped Safe node (Violation!)
      livesRef.current -= 1;
      setLives(livesRef.current);
      sound.play('gameover');
      triggerHaptic('error');

      if (livesRef.current <= 0) {
        isPlayingRef.current = false;
        onGameOver(scoreRef.current);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[360px] h-[400px] bg-[#141413] border border-[#5DF8D8]/20 rounded-xl p-4 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top telemetry & lives */}
      <div className="w-full flex items-center justify-between px-2 text-xs">
        <span className="font-tech-micro text-[#A3A39F] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#5DF8D8] animate-pulse"></span>
          GRID 4×4 // MATRIX LOCK
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <span
              key={idx}
              className={`w-3 h-3 rounded-full border transition-all ${
                idx < lives
                  ? 'bg-[#F62477] border-[#F62477] shadow-[0_0_6px_#F62477]'
                  : 'bg-transparent border-[#3A3A38]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4x4 Cyber Grid */}
      <div className="grid grid-cols-4 gap-2.5 w-full max-w-[300px] my-auto">
        {grid.map((cell, index) => {
          let styleClasses =
            'bg-[#1C1C1B] border border-[#2F2F2D] text-[#3A3A38] hover:border-[#5DF8D8]/40';

          if (cell === 'bug') {
            styleClasses =
              'bg-[#F62477] border-[#FFFFFF] text-white shadow-[0_0_16px_rgba(246,36,119,0.8)] animate-pulse scale-95';
          } else if (cell === 'safe') {
            styleClasses =
              'bg-[#5DF8D8] border-[#0A2821] text-[#0A2821] shadow-[0_0_12px_rgba(93,248,216,0.6)]';
          }

          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              className={`h-16 rounded flex items-center justify-center transition-all duration-100 active:scale-90 ${styleClasses}`}
            >
              {cell === 'bug' && (
                <span className="material-symbols-outlined text-2xl font-black">pest_control</span>
              )}
              {cell === 'safe' && (
                <span className="material-symbols-outlined text-2xl font-black">shield</span>
              )}
              {cell === 'empty' && (
                <span className="font-tech-micro text-[10px] text-[#2F2F2D]">::{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <span className="font-tech-micro text-[11px] text-[#F5F5F5] bg-[#1E1E1C] px-3 py-1 rounded border border-[#2F2F2D]">
          سرخابی (باگ) = تپ! | نعنایی (امن) = تپ نکنید!
        </span>
      </div>
    </div>
  );
};
