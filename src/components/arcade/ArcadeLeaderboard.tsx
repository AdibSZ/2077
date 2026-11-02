import React from 'react';
import { UserProfile } from '../../types';
import { toPersianDigits } from '../../utils/jalali';
import { getAssetUrl } from '../../utils/assets';
import { CyberAvatar } from '../CyberAvatar';

interface ArcadeLeaderboardProps {
  profiles: UserProfile[];
}

export const ArcadeLeaderboard: React.FC<ArcadeLeaderboardProps> = ({ profiles }) => {
  const sortedProfiles = [...profiles].sort((a, b) => b.totalCp - a.totalCp);
  const champ = sortedProfiles[0];
  const runnerUp = sortedProfiles[1];
  const thirdPlace = sortedProfiles[2];
  const others = sortedProfiles.slice(3);

  return (
    <div className="flex flex-col gap-space-md w-full transition-opacity duration-300">
      {/* Telemetry Status Bar */}
      <div className="flex items-center justify-between bg-[#141413] px-space-md py-space-sm rounded-lg shadow-sm border border-[#2F2F2D]">
        <div className="flex items-center gap-space-xs">
          <span className="w-2 h-2 rounded-full bg-[#5DF8D8] animate-ping" />
          <span className="font-tech-micro text-tech-micro text-[#5DF8D8] tracking-wider">
            LEADERBOARD_CYCLE // مسابقات پرسنل
          </span>
        </div>
        <div className="flex items-center gap-space-xs text-[#9E9E9C]">
          <span className="material-symbols-outlined text-[14px]">update</span>
          <span className="font-tech-micro text-tech-micro">بروزرسانی لحظه‌ای</span>
        </div>
      </div>

      {/* Formula Explainer Strip */}
      <div className="bg-[#141413]/80 p-2.5 rounded border border-[#5DF8D8]/20 flex items-center justify-between text-xs font-tech-micro">
        <span className="text-[#A3A39F]">فرمول محاسبه CP:</span>
        <span className="text-[#5DF8D8] font-bold">
          Total CP = Banked XP + (👑 Crowns × 500)
        </span>
      </div>

      {/* #1 Champion Card */}
      {champ && (
        <div className="relative overflow-hidden bg-[#141413] p-space-md rounded-lg shadow-[0_0_24px_rgba(246,36,119,0.25)] border border-[#F62477]/40">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#F62477] via-[#F62477]/80 to-transparent" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 opacity-[0.08] pointer-events-none">
            <img src={getAssetUrl('/brand/logo-magenta.png')} alt="" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-between mb-space-sm relative z-10">
            <div className="flex items-center gap-space-xs bg-[#F62477]/20 text-[#F62477] px-space-sm py-0.5 rounded border border-[#F62477]/30">
              <span className="material-symbols-outlined text-[16px] text-[#F62477]">military_tech</span>
              <span className="font-code-lg text-code-lg font-black tracking-widest text-[#F62477]">#1</span>
              <span className="font-tech-micro text-tech-micro text-[#F62477] tracking-tight">صدرنشین مسابقات</span>
            </div>
            <div className="font-tech-micro text-tech-micro text-[#9E9E9C] tracking-widest">// RANK_ALPHA</div>
          </div>

          <div className="flex items-center gap-space-md">
            <CyberAvatar
              src={champ.avatarUrl}
              alt={champ.fullName}
              size="lg"
              neonBorder="magenta"
              showReticle={true}
              shape="chamfer"
            />
            <div className="flex flex-col text-right">
              <span className="font-title-lg text-title-lg text-[#F5F5F5] font-bold">{champ.fullName}</span>
              <span className="font-body-sm text-body-sm text-[#9E9E9C]">{champ.roleTitle}</span>
              <div className="flex items-center gap-space-sm mt-space-xs">
                <span className="font-code-lg text-code-lg text-[#5DF8D8] font-bold">
                  {toPersianDigits(champ.totalCp.toLocaleString())} CP
                </span>
                <span className="font-tech-micro text-tech-micro text-[#F62477] bg-[#F62477]/15 px-1.5 py-0.5 rounded border border-[#F62477]/30">
                  👑 {toPersianDigits(champ.crownsCount)} جام
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* #2 and #3 Runners Up Podium */}
      <div className="grid grid-cols-2 gap-space-sm">
        {runnerUp && (
          <div className="bg-[#141413] p-space-sm rounded-lg border border-[#5DF8D8]/30 flex flex-col items-center text-center">
            <span className="text-xs font-code-md text-[#5DF8D8] font-bold mb-1">#2 نایب قهرمان</span>
            <CyberAvatar src={runnerUp.avatarUrl} alt={runnerUp.fullName} size="md" neonBorder="mint" />
            <span className="font-bold text-xs text-white mt-1 truncate max-w-full">{runnerUp.fullName}</span>
            <span className="text-[11px] text-[#5DF8D8] font-mono mt-0.5">
              {toPersianDigits(runnerUp.totalCp.toLocaleString())} CP
            </span>
          </div>
        )}

        {thirdPlace && (
          <div className="bg-[#141413] p-space-sm rounded-lg border border-white/10 flex flex-col items-center text-center">
            <span className="text-xs font-code-md text-[#A3A39E] font-bold mb-1">#3 جایگاه سوم</span>
            <CyberAvatar src={thirdPlace.avatarUrl} alt={thirdPlace.fullName} size="md" neonBorder="mint" />
            <span className="font-bold text-xs text-white mt-1 truncate max-w-full">{thirdPlace.fullName}</span>
            <span className="text-[11px] text-[#5DF8D8] font-mono mt-0.5">
              {toPersianDigits(thirdPlace.totalCp.toLocaleString())} CP
            </span>
          </div>
        )}
      </div>

      {/* Ranked Roster #4+ */}
      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          {others.map((person, idx) => (
            <div
              key={person.id}
              className="bg-[#141413] border border-white/5 p-3 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-code-md text-xs text-[#A3A39E] w-5 text-center font-bold">
                  #{toPersianDigits(idx + 4)}
                </span>
                <CyberAvatar src={person.avatarUrl} alt={person.fullName} size="sm" neonBorder="mint" />
                <div className="flex flex-col text-right truncate">
                  <span className="text-xs font-bold text-white truncate">{person.fullName}</span>
                  <span className="text-[10px] text-[#A3A39E] truncate">{person.roleTitle}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-[#5DF8D8] font-bold shrink-0">
                <span>{toPersianDigits(person.totalCp.toLocaleString())} CP</span>
                {person.crownsCount > 0 && (
                  <span className="text-[#F62477] text-[11px]">👑 {toPersianDigits(person.crownsCount)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
