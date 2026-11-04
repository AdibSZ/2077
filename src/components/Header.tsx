import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, PresenceStatus } from '../types';
import { sound } from '../utils/audio';
import { toPersianDigits } from '../utils/jalali';
import { getAssetUrl } from '../utils/assets';
import { CyberAvatar } from './CyberAvatar';
import { CheckUpdateButton } from './CheckUpdateButton';
import { CyberPresenceSelector } from './presence/CyberPresenceSelector';
import { CyberAvatarBuilderModal } from './avatar/CyberAvatarBuilderModal';
import { db } from '../services/db';

interface HeaderProps {
  currentUser: UserProfile;
  activeTab: ActiveTab;
  onLogout: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  onRefresh?: () => void;
}

const EMBLEM_URL = getAssetUrl('/brand/logo-mint.png');

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onLogout,
  onOpenNotifications,
  unreadNotificationCount = 0,
  onRefresh,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [liveTime, setLiveTime] = useState('');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.play('tap');
    }
  };

  const handlePresenceChange = async (newStatus: PresenceStatus) => {
    await db.updateProfile(currentUser.id, {
      presenceStatus: newStatus,
      presenceUpdatedAt: new Date().toISOString(),
      isOnline: newStatus !== 'OFF_LINE',
    });
    setNoticeMessage('وضعیت حضور سایبری شما همگام‌سازی شد.');
    setTimeout(() => setNoticeMessage(null), 2500);
    onRefresh?.();
  };

  const handleSaveAvatar = async (avatarUrl: string) => {
    await db.updateProfile(currentUser.id, { avatarUrl });
    setNoticeMessage('آواتار سایبری با موفقیت ثبت و ذخیره شد.');
    setTimeout(() => setNoticeMessage(null), 2500);
    onRefresh?.();
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'staff':
        return 'هاب عملیات و پرسنل';
      case 'tasks':
        return 'تابلوی وظایف و تسک‌ها';
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#5DF8D8] shadow-[0_0_8px_#5DF8D8] animate-pulse" />
              <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">
                متصل به سرور ابری // {liveTime}
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

          {/* Cyber Live Presence Punch-In Selector */}
          <CyberPresenceSelector
            currentUser={currentUser}
            onStatusChange={handlePresenceChange}
          />

          {/* Notification Center Trigger Button */}
          <button
            onClick={onOpenNotifications}
            title="مرکز اعلانات و پیام‌های پایانه"
            aria-label="مرکز اعلانات"
            className="w-9 h-9 bg-[#161615] hover:bg-[#222220] text-[#5DF8D8] flex items-center justify-center transition-all active:scale-95 relative cyber-chamfer-btn-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {unreadNotificationCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F62477] animate-ping pointer-events-none" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F62477] border border-[#141413] pointer-events-none" />
              </>
            )}
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleAudio}
            title={isMuted ? 'فعال‌سازی صداهای سیستم' : 'بی‌صدا کردن سیستم'}
            aria-label="کنترل صدای سیستم"
            className="w-9 h-9 bg-[#161615] hover:bg-[#222220] text-[#5DF8D8] flex items-center justify-center transition-all active:scale-95 cyber-chamfer-btn-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>

          {/* Manual Update Check Button */}
          <CheckUpdateButton
            onStatusMessage={(msg) => {
              setNoticeMessage(msg);
              setTimeout(() => setNoticeMessage(null), 3500);
            }}
          />

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
            <div className="absolute left-0 top-12 w-64 bg-[#141413] border border-[#5DF8D8]/30 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2.5 backdrop-blur-2xl">
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
                  <span>نقش کاربری:</span>
                  <span className="text-[#5DF8D8] truncate max-w-[120px]">
                    {currentUser.roleTitle}
                  </span>
                </div>
              </div>

              {/* Cyber Avatar Builder Button */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowAvatarModal(true);
                }}
                className="w-full py-2 px-3 bg-[#5DF8D8]/10 hover:bg-[#5DF8D8]/20 text-[#5DF8D8] border border-[#5DF8D8]/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">
                  face_retouching_natural
                </span>
                <span>طراحی آواتار سایبری (Forge)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full mt-1 py-2 px-3 bg-[#F62477] hover:bg-[#ff1a6c] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(246,36,119,0.35)] active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>خروج از حساب (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cyber Avatar Builder Modal */}
      {showAvatarModal && (
        <CyberAvatarBuilderModal
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      {/* Toast notification if triggered */}
      {noticeMessage && (
        <div className="absolute top-20 left-0 right-0 py-1.5 px-4 bg-[#5DF8D8] text-[#0A2821] text-xs font-bold text-center shadow-lg animate-pulse transition-all">
          {noticeMessage}
        </div>
      )}
    </header>
  );
};
