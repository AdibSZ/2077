import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { sound } from '../utils/audio';

export const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for updates periodically every 15 minutes
        setInterval(() => {
          r.update().catch(() => {});
        }, 15 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration issue:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      sound.play('score');
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    sound.play('tap');
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    sound.play('tap');
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-bounce-subtle">
      <div className="bg-[#1D1D1B]/95 border-2 border-cyber-pink shadow-[0_0_30px_rgba(246,36,119,0.5)] rounded-2xl p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-pink/20 border border-cyber-pink/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-cyber-pink text-2xl animate-spin">
              sync
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-cyber-mint animate-pulse" />
              <h4 className="text-sm font-black text-white">
                نسخه جدید 2077 Family آماده است!
              </h4>
            </div>
            <p className="text-xs text-cyber-muted leading-relaxed mb-3">
              بروزرسانی جدید هسته سیستم با موفقیت دریافت شد. برای اعمال تغییرات و ویژگی‌های تازه، کلیک کنید.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUpdate}
                className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-cyber-pink to-cyber-mint text-cyber-dark font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(246,36,119,0.4)] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-bold">bolt</span>
                بروزرسانی و بارگذاری مجدد
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-lg border border-white/10 text-cyber-muted text-xs hover:text-white hover:bg-white/5 active:scale-95 transition-all"
              >
                بعداً
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
