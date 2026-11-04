import React from 'react';
import { UserProfile } from '../../types';
import { CyberAvatar } from '../CyberAvatar';
import { sound } from '../../utils/audio';
import { getPresenceConfig } from '../../utils/presenceConstants';
import {
  formatBirthdate,
  toPersianDigits,
  getStaffLevelAndBirthdayInfo,
} from '../../utils/jalali';

interface StaffCardProps {
  person: UserProfile;
  index: number;
  isAdmin: boolean;
  onCall: (person: UserProfile) => void;
  onDossier: (person: UserProfile) => void;
  onAssignTask: (person: UserProfile) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  person,
  isAdmin,
  onCall,
  onDossier,
  onAssignTask,
}) => {
  const presenceCfg = getPresenceConfig(
    person.presenceStatus || (person.isOnline ? 'ON_DUTY' : 'OFF_LINE')
  );

  const levelInfo = getStaffLevelAndBirthdayInfo(
    person.birthYear,
    person.birthMonthNum || person.birthMonth,
    person.birthDay
  );

  return (
    <div className="cyber-single-frame select-none">
      <div className="cyber-single-content p-3.5 flex flex-col gap-3">
        {/* Top: Avatar + Staff Info + Presence Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CyberAvatar
              src={person.avatarUrl}
              alt={person.fullName}
              size="md"
              isOnline={person.isOnline}
              neonBorder={person.isAdmin ? 'magenta' : 'mint'}
            />
            <div className="flex flex-col text-right truncate flex-1 min-w-0">
              {/* Row 1: Name + Admin + Cyberpunk Level Badge + XP Progress Bar */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-sm font-bold text-white truncate">{person.fullName}</span>
                {person.isAdmin && (
                  <span className="text-[9px] bg-[#F62477]/20 border border-[#F62477]/40 text-[#F62477] px-1.5 py-0.2 rounded font-bold font-mono">
                    ADMIN
                  </span>
                )}
                {/* Cyberpunk Level Badge */}
                <span
                  className="text-[10px] bg-[#5DF8D8]/10 border border-[#5DF8D8]/50 text-[#5DF8D8] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider shadow-[0_0_8px_rgba(93,248,216,0.25)] flex items-center gap-1 shrink-0"
                  title={`سطح بر اساس سن: ${toPersianDigits(levelInfo.level)} سال`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5DF8D8] animate-pulse" />
                  <span>LVL.{toPersianDigits(levelInfo.level)}</span>
                </span>

                {/* Progress bar to next level */}
                <div
                  className="flex items-center gap-1 min-w-[65px] max-w-[90px] flex-1"
                  title={`${toPersianDigits(levelInfo.progressPercent)}٪ تا لول ${toPersianDigits(levelInfo.nextLevel)} (${toPersianDigits(levelInfo.daysRemaining)} روز مانده)`}
                >
                  <div className="flex-1 h-1.5 bg-[#0D0D0C] border border-[#5DF8D8]/40 rounded-full overflow-hidden p-[0.5px]">
                    <div
                      className="h-full bg-gradient-to-r from-[#5DF8D8] to-[#F62477] rounded-full transition-all duration-500 shadow-[0_0_6px_#5DF8D8]"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[#5DF8D8] font-bold shrink-0">
                    %{toPersianDigits(levelInfo.progressPercent)}
                  </span>
                </div>

                {levelInfo.isToday && (
                  <span className="text-[9px] bg-[#F62477] text-white px-1.5 py-0.5 rounded font-bold animate-bounce shadow-[0_0_8px_#F62477]">
                    🎉 زادروز امروز!
                  </span>
                )}
              </div>

              {/* Row 2: Role Title */}
              <span className="text-xs text-[#5DF8D8] font-medium truncate">{person.roleTitle}</span>

              {/* Row 3: Shift + Ext + Birthdate */}
              <div className="flex items-center gap-2 text-[11px] text-[#A3A39E] mt-0.5 flex-wrap">
                <span>{person.shiftName}</span>
                {person.internalExt && (
                  <>
                    <span>•</span>
                    <span className="font-mono">داخلی: {person.internalExt}</span>
                  </>
                )}
                <span>•</span>
                {/* Birthdate */}
                <div className="flex items-center gap-1 text-[#5DF8D8]" title="تاریخ تولد">
                  <span className="material-symbols-outlined text-[13px]">cake</span>
                  <span className="font-medium">
                    {formatBirthdate(person.birthDay, person.birthMonth)} {toPersianDigits(person.birthYear)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Presence Status Badge */}
          <div
            className="px-2.5 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1.5 shrink-0 self-start mt-0.5 shadow-sm font-mono"
            style={{
              backgroundColor: presenceCfg.bg,
              borderColor: presenceCfg.border,
              color: presenceCfg.color,
            }}
            title={`وضعیت: ${presenceCfg.faLabel} (${presenceCfg.enLabel})`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                backgroundColor: presenceCfg.color,
                boxShadow: `0 0 6px ${presenceCfg.color}`,
              }}
            />
            <span>{presenceCfg.faLabel}</span>
          </div>
        </div>

        {/* Cyber Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              sound.play('tap');
              onCall(person);
            }}
            className="flex-1 min-h-[38px] py-1.5 px-2 bg-[#181816] hover:bg-[#5DF8D8]/15 text-[#5DF8D8] border border-[#5DF8D8]/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>تماس / داخلی</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.play('tap');
              onDossier(person);
            }}
            className="flex-1 min-h-[38px] py-1.5 px-2 bg-[#181816] hover:bg-white/10 text-white border border-white/15 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>مشخصات</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                sound.play('tap');
                onAssignTask(person);
              }}
              className="min-h-[38px] py-1.5 px-3 bg-[#F62477] hover:bg-[#ff1a6c] active:bg-[#d0135b] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(246,36,119,0.35)] shrink-0"
              title="تعریف تسک برای این شخص"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              <span>تسک</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
