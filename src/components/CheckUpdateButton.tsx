import React, { useState } from 'react';
import { sound } from '../utils/audio';
import { checkForAppUpdate, CURRENT_APP_VERSION } from '../services/updateService';

interface CheckUpdateButtonProps {
  onStatusMessage?: (msg: string) => void;
}

export const CheckUpdateButton: React.FC<CheckUpdateButtonProps> = ({ onStatusMessage }) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    if (isChecking) return;
    sound.play('tap');
    setIsChecking(true);

    try {
      const result = await checkForAppUpdate();
      if (result.hasUpdate) {
        sound.play('score');
        if (onStatusMessage) {
          onStatusMessage('نسخه جدید یافت شد! در حال آماده‌سازی پنجره بروزرسانی...');
        }
      } else {
        if (onStatusMessage) {
          onStatusMessage(`سامانه به آخرین نسخه (v${CURRENT_APP_VERSION}) مجهز است.`);
        }
      }
    } catch {
      if (onStatusMessage) {
        onStatusMessage('بررسی بروزرسانی با خطا مواجه شد.');
      }
    } finally {
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheck}
      disabled={isChecking}
      title="بررسی دستی نسخه جدید و بروزرسانی نرم‌افزار"
      aria-label="بررسی بروزرسانی"
      className="w-9 h-9 rounded-lg bg-[#141413] border border-[#5DF8D8]/25 hover:border-[#5DF8D8] text-[#5DF8D8] flex items-center justify-center transition-colors active:scale-95 relative"
    >
      <span
        className={`material-symbols-outlined text-[18px] ${
          isChecking ? 'animate-spin text-[#F62477]' : ''
        }`}
      >
        {isChecking ? 'progress_activity' : 'system_update'}
      </span>
    </button>
  );
};
