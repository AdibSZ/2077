import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface NeuralSequenceProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
}

const PAD_COLORS = [
  '#F62477', // Cyber Magenta
  '#5DF8D8', // Neon Mint
  '#FFAEC4', // Light Pink
  '#3DE2C0', // Mint Bright
  '#FF4C87', // Neon Rose
  '#F5F5F5', // Ice White
];

export const NeuralSequence: React.FC<NeuralSequenceProps> = ({ onScoreUpdate, onGameOver }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [score, setScore] = useState(0);
  const isPlayingRef = useRef(true);

  // Play a pad with synth audio & haptic
  const activatePad = (padIndex: number, durationMs = 280) => {
    setActivePad(padIndex);
    sound.play('tone', padIndex);
    triggerHaptic('light');

    setTimeout(() => {
      setActivePad((curr) => (curr === padIndex ? null : curr));
    }, durationMs);
  };

  // Playback the sequence to player
  const playSequence = async (seq: number[]) => {
    setIsShowingSequence(true);
    setPlayerIndex(0);

    // Initial pause before sequence starts
    await new Promise((r) => setTimeout(r, 600));

    const stepSpeed = Math.max(220, 480 - seq.length * 15);

    for (let i = 0; i < seq.length; i++) {
      if (!isPlayingRef.current) break;
      activatePad(seq[i], stepSpeed * 0.7);
      await new Promise((r) => setTimeout(r, stepSpeed));
    }

    if (isPlayingRef.current) {
      setIsShowingSequence(false);
    }
  };

  // Start new game on mount
  useEffect(() => {
    isPlayingRef.current = true;
    const initialSeq = [Math.floor(Math.random() * 6)];
    setSequence(initialSeq);
    setScore(0);
    playSequence(initialSeq);

    return () => {
      isPlayingRef.current = false;
    };
  }, []);

  const handlePadClick = (padIndex: number) => {
    if (isShowingSequence || !isPlayingRef.current) return;

    activatePad(padIndex, 200);

    // Check if player hit the right pad in sequence
    if (sequence[playerIndex] === padIndex) {
      const nextPlayerIndex = playerIndex + 1;
      setPlayerIndex(nextPlayerIndex);

      // Successfully completed the sequence!
      if (nextPlayerIndex === sequence.length) {
        const nextScore = score + 1;
        setScore(nextScore);
        onScoreUpdate(nextScore);
        sound.play('score');
        triggerHaptic('success');

        // Add next step to sequence
        const nextSeq = [...sequence, Math.floor(Math.random() * 6)];
        setSequence(nextSeq);
        setTimeout(() => {
          if (isPlayingRef.current) {
            playSequence(nextSeq);
          }
        }, 800);
      }
    } else {
      // Wrong sequence! Game Over
      isPlayingRef.current = false;
      sound.play('gameover');
      triggerHaptic('error');
      onGameOver(score);
    }
  };

  return (
    <div className="relative w-full max-w-[360px] h-[400px] bg-[#141413] border border-[#5DF8D8]/20 rounded-xl p-5 flex flex-col items-center justify-between shadow-2xl select-none">
      {/* Top Telemetry */}
      <div className="w-full flex items-center justify-between text-xs">
        <span className="font-tech-micro text-[#A3A39F] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5DF8D8] animate-pulse"></span>
          NEURAL LINK // مرحله {score + 1}
        </span>
        <span className="font-tech-micro text-[#F62477] bg-[#F62477]/15 px-2 py-0.5 rounded border border-[#F62477]/30">
          ضریب: ×2.50
        </span>
      </div>

      {/* 6 Pads in 2x3 Grid */}
      <div className="grid grid-cols-3 gap-3 w-full my-auto max-w-[280px]">
        {PAD_COLORS.map((color, idx) => {
          const isActive = activePad === idx;
          return (
            <button
              key={idx}
              onClick={() => handlePadClick(idx)}
              disabled={isShowingSequence}
              className={`h-24 rounded-lg border transition-all duration-150 flex flex-col items-center justify-center relative overflow-hidden ${
                isActive
                  ? 'border-white scale-95 shadow-[0_0_24px_rgba(255,255,255,0.9)]'
                  : 'bg-[#1C1C1B] border-[#2F2F2D] hover:border-[#5DF8D8]/50 active:scale-95'
              }`}
              style={{
                backgroundColor: isActive ? color : undefined,
                borderColor: isActive ? '#FFFFFF' : undefined,
              }}
            >
              <div
                className="w-3 h-3 rounded-full mb-1"
                style={{ backgroundColor: color }}
              />
              <span
                className={`font-tech-micro text-[10px] font-bold ${
                  isActive ? 'text-[#0D0D0C]' : 'text-[#A3A39F]'
                }`}
              >
                P-0{idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="text-center">
        <span className="font-tech-micro text-[11px] text-[#F5F5F5] bg-[#1E1E1C] px-3.5 py-1 rounded border border-[#2F2F2D]">
          {isShowingSequence ? 'در حال پخش الگوی صوتی... [گوش دهید]' : 'نوبت شماست: توالی را تکرار کنید!'}
        </span>
      </div>
    </div>
  );
};
