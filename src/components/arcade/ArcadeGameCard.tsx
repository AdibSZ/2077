import React from 'react';
import { GameMetadata } from '../../types';

interface ArcadeGameCardProps {
  game: GameMetadata;
  crownHolder?: { userId: string; userName: string; score: number };
  onLaunch: (gameId: GameMetadata['id']) => void;
}

export const ArcadeGameCard: React.FC<ArcadeGameCardProps> = ({
  game,
  crownHolder,
  onLaunch,
}) => {
  return (
    <div className="bg-[#121211] p-3.5 flex flex-col justify-between shadow-lg relative group overflow-hidden border border-[#5DF8D8]/20 hover:border-[#5DF8D8]/60 transition-all cyber-chamfer-card-single">
      {/* Top Header of Card */}
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg bg-[#1A1A18] flex items-center justify-center text-[#5DF8D8] shadow-[0_0_8px_rgba(93,248,216,0.3)] border border-[#5DF8D8]/30">
          <span className="material-symbols-outlined text-[20px]">{game.iconName}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 bg-[#F62477]/20 text-[#F62477] rounded font-bold border border-[#F62477]/40 shadow-sm font-mono">
          ×{game.multiplier.toFixed(2)} CP
        </span>
      </div>

      {/* Game Details */}
      <div className="flex flex-col mb-3 text-right">
        <span className="text-xs sm:text-sm font-extrabold text-white truncate">
          {game.nameFa}
        </span>
        <span className="text-[10px] text-[#5DF8D8] font-mono truncate">
          {game.nameEn}
        </span>
        <div className="flex items-center gap-1 mt-1 text-[11px] text-[#A3A39E] truncate">
          <span className="text-[#F62477] text-xs">👑</span>
          <span className="truncate text-white font-medium">
            {crownHolder ? crownHolder.userName.split(' ')[0] : 'بدون رکورد'}
          </span>
        </div>
      </div>

      {/* Cyber Launch Button */}
      <button
        type="button"
        onClick={() => onLaunch(game.id)}
        className="w-full min-h-[38px] bg-[#F62477] hover:bg-[#ff1a6c] active:bg-[#d0135b] text-white font-black text-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(246,36,119,0.4)] cyber-chamfer-btn select-none"
      >
        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
        <span>شروع بازی // PLAY</span>
      </button>
    </div>
  );
};
