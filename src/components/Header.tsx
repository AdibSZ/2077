import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, NetworkSyncState } from '../types';
import { sound } from '../utils/audio';
import { toPersianDigits } from '../utils/jalali';
import { db } from '../services/db';
import { getAssetUrl } from '../utils/assets';
import { CyberAvatar } from './CyberAvatar';

interface HeaderProps {
  currentUser: UserProfile;
  activeTab: ActiveTab;
  onLogout: () => void;
}

const EMBLEM_URL = getAssetUrl('/brand/logo-mint.png');

export const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [liveTime, setLiveTime] = useState('');
  const [syncState, setSyncState] = useState<NetworkSyncState>(() => db.getNetworkSyncState());
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    // 1. Clock update
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setLiveTime(timeStr);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    // 2. Subscribe to sync and network changes
    const unsubscribe = db.subscribeSyncState((newState) => {
      setSyncState(newState);
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.play('tap');
    }
  };

  const handleManualSync = async () => {
    sound.play('tap');
    const res = await db.flushSyncQueue();
    if (res.syncedCount > 0) {
      sound.play('score');
      setSyncNotice(`همگام‌سازی ابری انجام شد (${toPersianDigits(res.syncedCount)} رکورد ارسال شد)`);
    } else {
      setSyncNotice('داده‌های محلی با سرور ابری کاملاً همگام هستند.');
    }
    setTimeout(() => {
      setSyncNotice(null);
    }, 3000);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'staff':
        return 'هاب عملیات و پرسنل';
      case 'arcade':
        return 'باشگاه بازی و لیدربورد';
      case 'admin':
        return 'پنل فرماندهی ادمین';
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#0D0D0C]/90 backdrop-blur-xl border-b border-[#5DF8D8]/20 shadow-[0_4px_20px_rgba(0,0,0,0.6)] select-none">
      <div className="h-20 px-gutter flex items-center justify-between">
        {/* Brand & Server Node */}
        <div className="flex items-center gap-space-sm">
          <img
            alt="2077 Cyber Emblem"
            className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(93,248,216,0.65)]"
            src={EMBLEM_URL}
          />
          <div className="flex flex-col text-right">
            <span className="font-code-md text-code-md text-[#5DF8D8] tracking-wider">
              SYS.2077 // فروشگاه مرکزی
            </span>
            <div className="flex items-center gap-space-xs mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !syncState.isOnline
                    ? 'bg-[#E5A93C] shadow-[0_0_8px_#E5A93C]'
                    : syncState.cloudConnected
                    ? 'bg-[#5DF8D8] shadow-[0_0_8px_#5DF8D8] animate-pulse'
                    : 'bg-[#5DF8D8]'
                }`}
              ></span>
              <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">
                {!syncState.isOnline
                  ? 'حالت آفلاین (بازی‌ها محلی ذخیره می‌شوند)'
                  : syncState.cloudConnected
                  ? 'متصل به سرور ابری'
                  : 'پایگاه داده مستقل'} // {liveTime}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-space-xs sm:gap-space-sm relative">
          {/* Active Hub Title for Large Screens */}
          <div className="text-left hidden lg:flex flex-col ml-1">
            <span className="font-title-sm text-xs text-[#F5F5F5] font-bold">{getTabTitle()}</span>
          </div>

          {/* Interactive Cloud Sync Button / Badge */}
          <button
            onClick={handleManualSync}
            disabled={syncState.isSyncing}
            title={
              !syncState.isOnline
                ? 'در حالت آفلاین؛ رکوردها پس از اتصال اینترنت خودکار ارسال می‌شوند'
                : syncState.pendingCount > 0
                ? `${toPersianDigits(syncState.pendingCount)} رکورد در صف ارسال؛ جهت ارسال فوری کلیک کنید`
                : 'همگام‌سازی دستی با سرور ابری'
            }
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all active:scale-95 ${
              syncState.pendingCount > 0
                ? 'bg-[#F62477]/20 border-[#F62477]/50 text-[#F62477] animate-pulse'
                : !syncState.isOnline
                ? 'bg-[#E5A93C]/15 border-[#E5A93C]/40 text-[#E5A93C]'
                : 'bg-[#141413] border-[#5DF8D8]/25 text-[#5DF8D8] hover:border-[#5DF8D8]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                syncState.isSyncing ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span className="font-tech-micro text-[10px] hidden xs:inline">
              {syncState.isSyncing
                ? 'در حال ارسال...'
                : syncState.pendingCount > 0
                ? `${toPersianDigits(syncState.pendingCount)} در صف`
                : !syncState.isOnline
                ? 'آفلاین'
                : 'ابری'}
            </span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'فعال‌سازی صداهای سیستم' : 'بی‌صدا کردن سیستم'}
            aria-label="کنترل صدای سیستم"
            className="w-9 h-9 rounded-lg bg-[#141413] border border-[#5DF8D8]/25 hover:border-[#5DF8D8] text-[#5DF8D8] flex items-center justify-center transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>

          {/* User Avatar & Status Pip */}
          <CyberAvatar
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            size="sm"
            shape="chamfer"
            isOnline={currentUser.isOnline}
            showOnlineBadge={true}
            neonBorder={currentUser.isAdmin ? 'magenta' : 'mint'}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />

          {/* Quick Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute left-0 top-12 w-64 bg-[#141413] border border-[#5DF8D8]/30 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2.5 backdrop-blur-2xl [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#252523]">
                <CyberAvatar
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  size="md"
                  shape="chamfer"
                  isOnline={currentUser.isOnline}
                  showOnlineBadge={true}
                  neonBorder={currentUser.isAdmin ? 'magenta' : 'mint'}
                />
                <div className="flex flex-col truncate text-right flex-1">
                  <span className="font-title-sm text-xs text-[#F5F5F5] font-bold truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="font-tech-micro text-[10px] text-[#5DF8D8]">
                    @{currentUser.username} {currentUser.isAdmin && '● مدیر'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-[#9E9E9C] py-1 border-b border-[#252523]">
                <div className="flex justify-between items-center">
                  <span>امتیاز کل (Total CP):</span>
                  <span className="font-code-md text-[#5DF8D8] font-bold">
                    {toPersianDigits(currentUser.totalCp)} CP
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>تاج‌های قهرمانی:</span>
                  <span className="font-code-md text-[#F62477] font-bold">
                    👑 {toPersianDigits(currentUser.crownsCount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>وضعیت همگام‌سازی:</span>
                  <span className="text-[#5DF8D8]">
                    {syncState.pendingCount > 0
                      ? `${toPersianDigits(syncState.pendingCount)} مورد در صف`
                      : 'کاملاً به‌روز'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full mt-1 py-2 px-3 bg-[#F62477]/15 hover:bg-[#F62477] text-[#F62477] hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(246,36,119,0.2)] active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>خروج از پایانه (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync toast notification if triggered */}
      {syncNotice && (
        <div className="absolute top-20 left-0 right-0 py-1.5 px-4 bg-[#5DF8D8] text-[#0A2821] text-xs font-bold text-center shadow-lg animate-pulse transition-all">
          {syncNotice}
        </div>
      )}
    </header>
  );
};