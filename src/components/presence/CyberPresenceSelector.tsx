import React, { useState } from 'react';
import { PresenceStatus, UserProfile } from '../../types';
import { PRESENCE_CONFIGS, getPresenceConfig } from '../../utils/presenceConstants';
import { sound } from '../../utils/audio';

interface CyberPresenceSelectorProps {
  currentUser: UserProfile;
  onStatusChange: (status: PresenceStatus) => Promise<void> | void;
}

export const CyberPresenceSelector: React.FC<CyberPresenceSelectorProps> = ({
  currentUser,
  onStatusChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatus = currentUser.presenceStatus || (currentUser.isOnline ? 'ON_DUTY' : 'OFF_LINE');
  const activeCfg = getPresenceConfig(currentStatus);

  const handleSelect = async (status: PresenceStatus) => {
    if (status === currentStatus) {
      setIsOpen(false);
      return;
    }
    sound.play('tap');
    setIsUpdating(true);
    try {
      await onStatusChange(status);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => {
          sound.play('tap');
          setIsOpen(!isOpen);
        }}
        className="h-8 px-2.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-semibold shadow-sm active:scale-95 select-none"
        style={{
          backgroundColor: activeCfg.bg,
          borderColor: activeCfg.border,
          color: activeCfg.color,
        }}
        title={`وضعیت حضور سایبری شما: ${activeCfg.faLabel} (${activeCfg.enLabel})`}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: activeCfg.color,
            boxShadow: `0 0 8px ${activeCfg.color}`,
          }}
        />
        <span className="hidden sm:inline font-bold">{activeCfg.faLabel}</span>
        <span className="material-symbols-outlined text-[15px] opacity-80">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Cyber Dropdown / Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-10 w-72 bg-[#141413] border border-[#5DF8D8]/30 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2 backdrop-blur-2xl [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
            <div className="flex items-center justify-between pb-2 border-b border-[#252523]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[18px]">
                  badge
                </span>
                <span className="text-xs font-bold text-white">ثبت وضعیت حضور سایبری</span>
              </div>
              <span className="text-[10px] text-[#5DF8D8] font-mono">STATUS // SYNC</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {(Object.keys(PRESENCE_CONFIGS) as PresenceStatus[]).map((st) => {
                const cfg = PRESENCE_CONFIGS[st];
                const isSelected = st === currentStatus;
                return (
                  <button
                    key={st}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleSelect(st)}
                    className="p-2 rounded-lg border text-right transition-all flex items-center justify-between gap-2 text-xs"
                    style={{
                      backgroundColor: isSelected ? cfg.bg : 'rgba(255,255,255,0.03)',
                      borderColor: isSelected ? cfg.border : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ color: cfg.color }}
                      >
                        {cfg.icon}
                      </span>
                      <div className="flex flex-col">
                        <span
                          className="font-bold"
                          style={{ color: isSelected ? cfg.color : '#FFFFFF' }}
                        >
                          {cfg.faLabel}
                        </span>
                        <span className="text-[10px] text-[#9E9E9C] truncate">
                          {cfg.description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ color: cfg.color }}
                      >
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-[#252523] flex items-center justify-between text-[10px] text-[#9E9E9C]">
              <span>همگام‌سازی لحظه‌ای با تمام همکاران</span>
              <span className="text-[#5DF8D8] font-mono">2077 CLOUD</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
