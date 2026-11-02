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
    <div className="bg-[#141413] p-space-sm rounded-xl flex flex-col justify-between shadow-sm relative group overflow-hidden border border-[#2F2F2D] hover:border-[#5DF8D8]/50 transition-all">
      <div className="flex items-start justify-between mb-space-sm">
        <div className="w-9 h-9 rounded bg-[#1E1E1C] flex items-center justify-center text-[#5DF8D8] shadow-[0_0_8px_rgba(93,248,216,0.25)] border border-[#5DF8D8]/20">
          <span className="material-symbols-outlined text-[20px]">{game.iconName}</span>
        </div>
        <span className="font-tech-micro text-tech-micro px-1 py-0.5 bg-[#F62477]/20 text-[#F62477] rounded font-bold border border-[#F62477]/30">
          ×{game.multiplier.toFixed(2)}
        </span>
      </div>

      <div className="flex flex-col mb-space-sm text-right">
        <span className="font-title-sm text-title-sm font-bold text-[#F5F5F5] truncate">
          {game.nameFa}
        </span>
        <span className="font-tech-micro text-tech-micro text-[#9E9E9C] truncate">
          {game.nameEn}
        </span>
        <div className="flex items-center gap-1 mt-1 text-[#9E9E9C] font-body-sm text-xs truncate">
          <span className="text-[#F62477] text-xs">👑</span>
          <span className="truncate text-[#F5F5F5]">
            {crownHolder ? crownHolder.userName.split(' ')[0] : 'بدون رکورد'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onLaunch(game.id)}
        className="w-full min-h-[38px] bg-[#F62477] hover:bg-[#5DF8D8] text-white hover:text-[#0A2821] font-title-sm text-title-sm font-bold py-1.5 px-space-sm rounded flex items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_10px_rgba(246,36,119,0.35)]"
      >
        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
        <span>شروع بازی</span>
      </button>
    </div>
  );
};
