import React from 'react';
import { UserProfile } from '../../types';
import { CyberAvatar } from '../CyberAvatar';
import { sound } from '../../utils/audio';
import { getPresenceConfig } from '../../utils/presenceConstants';

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

  return (
    <div className="bg-[#141413] border border-[#5DF8D8]/20 hover:border-[#5DF8D8]/50 p-3.5 rounded-2xl shadow-lg transition-all flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CyberAvatar
            src={person.avatarUrl}
            alt={person.fullName}
            size="md"
            isOnline={person.isOnline}
            neonBorder={person.isAdmin ? 'magenta' : 'mint'}
          />
          <div className="flex flex-col text-right truncate">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-bold text-white truncate">{person.fullName}</span>
              {person.isAdmin && (
                <span className="text-[9px] bg-[#F62477]/20 border border-[#F62477]/40 text-[#F62477] px-1.5 py-0.2 rounded font-bold">
                  ADMIN
                </span>
              )}
            </div>
            <span className="text-xs text-[#5DF8D8] font-medium truncate">{person.roleTitle}</span>
            <div className="flex items-center gap-2 text-[11px] text-[#A3A39E] mt-0.5">
              <span>{person.shiftName}</span>
              {person.internalExt && (
                <>
                  <span>•</span>
                  <span>داخلی: {person.internalExt}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Presence Status Badge */}
        <div
          className="px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 shrink-0 self-start mt-0.5 shadow-sm"
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => {
            sound.play('tap');
            onCall(person);
          }}
          className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-[#5DF8D8]/15 text-[#5DF8D8] border border-[#5DF8D8]/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">call</span>
          <span>تماس / داخلی</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.play('tap');
            onDossier(person);
          }}
          className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">badge</span>
          <span>مشخصات</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              sound.play('tap');
              onAssignTask(person);
            }}
            className="py-1.5 px-2.5 bg-[#F62477]/15 hover:bg-[#F62477]/25 text-[#F62477] border border-[#F62477]/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="تعریف تسک برای این شخص"
          >
            <span className="material-symbols-outlined text-[15px]">add_task</span>
            <span>تسک</span>
          </button>
        )}
      </div>
    </div>
  );
};
