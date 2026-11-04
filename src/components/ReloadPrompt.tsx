import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { sound } from '../utils/audio';
import {
  onAppUpdateAvailable,
  checkForAppUpdate,
  applyAppUpdate,
  RemoteVersionInfo,
  CURRENT_APP_VERSION,
} from '../services/updateService';

export const ReloadPrompt: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<RemoteVersionInfo | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for SW updates every 5 minutes
        setInterval(() => {
          r.update().catch(() => {});
        }, 5 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration issue:', error);
    },
  });

  // 1. Listen to service worker needRefresh
  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
      sound.play('score');
    }
  }, [needRefresh]);

  // 2. Listen to custom update service events
  useEffect(() => {
    const unsubscribe = onAppUpdateAvailable((info) => {
      setUpdateInfo(info);
      setShowPrompt(true);
      sound.play('score');
    });

    // Check once after initial startup (2 seconds delay)
    const initialTimer = setTimeout(() => {
      checkForAppUpdate().catch(() => {});
    }, 2000);

    // Periodic check every 5 minutes
    const intervalTimer = setInterval(() => {
      checkForAppUpdate().catch(() => {});
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const handleUpdate = () => {
    sound.play('tap');
    applyAppUpdate(updateServiceWorker);
  };

  const handleDismiss = () => {
    sound.play('tap');
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  if (!showPrompt && !needRefresh) return null;

  const newVersion = updateInfo?.version || '2.8.5';
  const description =
    updateInfo?.description ||
    'بروزرسانی جدید هسته سیستم با موفقیت دریافت شد. برای اعمال تغییرات و ویژگی‌های تازه، کلیک کنید.';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md cyber-card-frame-pink shadow-[0_0_50px_rgba(246,36,119,0.45)]">
        <div className="cyber-card-content-pink p-5 overflow-hidden">
          {/* Cyberpunk Top Neon Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5DF8D8] via-[#F62477] to-[#E5A93C]" />

          {/* Header with Icon, Title, and Close Button */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F62477]/20 border border-[#F62477]/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(246,36,119,0.3)]">
                <span className="material-symbols-outlined text-[#F62477] text-2xl animate-spin">
                  sync
                </span>
              </div>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#5DF8D8] animate-pulse" />
                  <h3 className="text-base font-black text-white">
                    بروزرسانی سامانه 2077 Family
                  </h3>
                </div>
                <span className="text-[11px] font-code-md text-[#5DF8D8] mt-0.5 font-mono">
                  نسخه کنونی: v{CURRENT_APP_VERSION} ➔ نسخه جدید: v{newVersion}
                </span>
              </div>
            </div>

            {/* Close X Button (ضربدر) */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="بستن پنجره بروزرسانی"
              className="w-8 h-8 rounded-lg bg-[#252523] hover:bg-[#F62477] text-[#9E9E9C] hover:text-white flex items-center justify-center transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="bg-[#181816] border border-[#252523] rounded-xl p-3 mb-5 text-right">
            <p className="text-xs text-[#E0E0E0] leading-relaxed">
              {description}
            </p>
            <div className="mt-2.5 pt-2 border-t border-[#252523] flex items-center justify-between text-[11px] text-[#9E9E9C]">
              <span>سازگاری داده‌ها:</span>
              <span className="text-[#5DF8D8] font-bold">بدون حذف اطلاعات (Zero-Data-Loss)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleUpdate}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#F62477] to-[#E5A93C] text-[#141413] cyber-chamfer-btn font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(246,36,119,0.5)] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>بروزرسانی و بارگذاری مجدد</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="py-3 px-4 bg-[#1E1E1C] hover:bg-[#282825] text-[#A3A39E] hover:text-white text-xs rounded-lg active:scale-95 transition-all"
            >
              بعداً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
