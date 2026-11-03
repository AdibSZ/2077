import React, { useState, useEffect } from 'react';
import { webNotifications, NotificationPermState } from '../../services/webNotificationService';
import { sound } from '../../utils/audio';

export const WebPushToggleBanner: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermState>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPermission(webNotifications.getPermission());
  }, []);

  const handleRequest = async () => {
    sound.play('tap');
    setIsLoading(true);
    try {
      const res = await webNotifications.requestPermission();
      setPermission(res);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    sound.play('score');
    await webNotifications.showNotification('تست اتصال اعلان‌های سیستمی ۲۰۷۷', {
      body: 'ارتباط مستقیم با مرورگر و سیستم‌عامل برقرار است. هشدارهای فوری با موفقیت دریافت می‌شوند.',
      tag: 'test-ping',
    });
  };

  if (!webNotifications.isSupported()) {
    return null;
  }

  const isGranted = permission === 'granted';

  return (
    <div className="p-3 rounded-xl bg-[#161614] border border-[#5DF8D8]/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
      <div className="flex items-center gap-2 text-right">
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ color: isGranted ? '#5DF8D8' : '#FCEE0A' }}
        >
          {isGranted ? 'notifications_active' : 'notifications_off'}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white">
            {isGranted
              ? 'اعلان‌های واقعی مرورگر (سیستمی): فعال'
              : 'اعلان‌های سیستمی ویندوز و اندروید: غیرفعال'}
          </span>
          <span className="text-[10px] text-[#9E9E9C]">
            {isGranted
              ? 'هشدارهای اضطراری و تسک‌های جدید به صورت آنی به صفحه دستگاه ارسال می‌شوند.'
              : 'برای دریافت هشدارهای مدیر حتی در زمان بسته بودن تب مرورگر فعال کنید.'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isGranted ? (
          <button
            type="button"
            onClick={handleTestNotification}
            className="py-1 px-2.5 rounded-lg bg-[#5DF8D8]/15 hover:bg-[#5DF8D8]/25 text-[#5DF8D8] border border-[#5DF8D8]/30 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
            title="ارسال یک نوتیفیکیشن آزمایشی به سیستم"
          >
            <span className="material-symbols-outlined text-[15px]">send</span>
            <span>تست اعلان</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={handleRequest}
            className="py-1.5 px-3 rounded-lg bg-[#FCEE0A] hover:bg-[#ebd409] text-[#141413] text-xs font-bold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(252,238,10,0.3)] active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            <span>{isLoading ? 'در حال فعال‌سازی...' : 'فعال‌سازی اعلان‌ها'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
