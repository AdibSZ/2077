import React from 'react';
import { Announcement, Task, UserProfile } from '../types';
import { getTodayJalali, getMonthNumber, toPersianDigits } from '../utils/jalali';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { getAssetUrl } from '../utils/assets';
import { WebPushToggleBanner } from './notifications/WebPushToggleBanner';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  announcement: Announcement;
  tasks: Task[];
  profiles: UserProfile[];
  onNavigateToTasks?: () => void;
  onClearUrgentAlert?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  announcement,
  tasks,
  profiles,
  onNavigateToTasks,
  onClearUrgentAlert,
}) => {
  if (!isOpen) return null;

  const today = getTodayJalali();

  // 1. Birthdays today
  const birthdayStaff = profiles.filter((p) => {
    const pMonthNum = p.birthMonthNum || getMonthNumber(p.birthMonth);
    return p.birthDay === today.jd && pMonthNum === today.jm;
  });

  // 2. Pending tasks relevant to this user (global or assigned specifically to this user)
  const pendingTasks = tasks.filter(
    (t) => !t.isCompleted && (t.isGlobal || t.assignedToId === 'ALL' || t.assignedToId === currentUser.id)
  );

  // 3. Active announcement/urgent alert
  const hasActiveAnnouncement = Boolean(
    announcement && announcement.content && announcement.content.trim() && announcement.isActive !== false
  );
  const isUrgentAnnouncement = hasActiveAnnouncement && announcement.priority === 'فوری';

  const handleClose = () => {
    sound.play('tap');
    triggerHaptic('light');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141413] border border-[#5DF8D8]/40 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.85)] p-space-md sm:p-space-lg flex flex-col gap-4 text-right max-h-[90vh] overflow-hidden [clip-path:polygon(16px_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_16px)]">
        {/* Subtle Watermark */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 opacity-[0.05] pointer-events-none">
          <img src={getAssetUrl('/brand/logo-white.png')} alt="" className="w-full h-full object-contain" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#252523] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F62477]/15 border border-[#F62477]/40 flex items-center justify-center text-[#F62477]">
              <span className="material-symbols-outlined text-[20px] animate-pulse">
                {isUrgentAnnouncement ? 'crisis_alert' : 'notifications_active'}
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-title-sm text-sm sm:text-base text-[#F5F5F5] font-bold">
                مرکز اعلانات و پیام‌های پایانه ۲۰۷۷
              </h2>
              <span className="font-tech-micro text-[10px] text-[#5DF8D8] tracking-wider uppercase">
                // SYSTEM_NOTIFICATIONS_HUB
              </span>
            </div>
          </div>

          {/* Prominent Close (X) Button */}
          <button
            onClick={handleClose}
            aria-label="بستن پنجره"
            className="w-8 h-8 rounded-lg bg-[#20201E] hover:bg-[#F62477] text-[#A3A39E] hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/10 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

                {/* Web Push OS Notification Banner */}
        <WebPushToggleBanner />

        {/* Scrollable Notification Cards Area */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[55vh]">
          {/* Card 1: Urgent Alert / Store Announcement */}
          {hasActiveAnnouncement && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all ${
                isUrgentAnnouncement
                  ? 'bg-[#F62477]/15 border-[#F62477]/60 shadow-[0_0_20px_rgba(246,36,119,0.3)]'
                  : 'bg-[#181816] border-[#5DF8D8]/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isUrgentAnnouncement ? 'text-[#F62477] animate-bounce' : 'text-[#5DF8D8]'
                    }`}
                  >
                    {isUrgentAnnouncement ? 'warning' : 'campaign'}
                  </span>
                  <span className="font-title-sm text-xs sm:text-sm text-[#F5F5F5] font-bold">
                    {announcement.title}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    isUrgentAnnouncement
                      ? 'bg-[#F62477] text-white animate-pulse'
                      : 'bg-[#5DF8D8]/20 text-[#5DF8D8]'
                  }`}
                >
                  {isUrgentAnnouncement ? '🚨 هشدار فوری عملیاتی' : 'پیام تابلوی اعلانات'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#EAEAEA] leading-relaxed pr-6">
                {announcement.content}
              </p>

              {/* Admin Dismiss Button for Urgent Alert */}
              {isUrgentAnnouncement && currentUser.isAdmin && onClearUrgentAlert && (
                <div className="pt-2 border-t border-[#F62477]/30 flex justify-end">
                  <button
                    onClick={() => {
                      onClearUrgentAlert();
                      handleClose();
                    }}
                    className="py-1 px-3 bg-[#F62477] hover:bg-[#d01c62] text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-[0_0_10px_rgba(246,36,119,0.4)]"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    <span>پاکسازی و لغو این هشدار فوری برای همه</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card 2: Birthdays Today */}
          {birthdayStaff.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#5DF8D8]/10 border border-[#5DF8D8]/40 flex items-center gap-3">
              <span className="text-2xl">🎂</span>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-[#5DF8D8]">
                  رویداد خجسته // زادروز همکاران سیستم
                </span>
                <span className="text-xs text-[#F5F5F5] mt-0.5">
                  امروز زادروز {birthdayStaff.map((p) => `«${p.fullName}»`).join(' و ')} است! شادباش بگویید.
                </span>
              </div>
            </div>
          )}

          {/* Card 3: Pending Tasks Notification */}
          {pendingTasks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#191917] border border-[#5DF8D8]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#5DF8D8]">
                  <span className="material-symbols-outlined text-[18px]">checklist</span>
                  <span className="font-title-sm text-xs font-bold">
                    وظایف در انتظار انجام ({toPersianDigits(pendingTasks.length)} اقدام)
                  </span>
                </div>
                {onNavigateToTasks && (
                  <button
                    onClick={() => {
                      onNavigateToTasks();
                      handleClose();
                    }}
                    className="text-[11px] text-[#5DF8D8] hover:underline flex items-center gap-0.5"
                  >
                    <span>مشاهده در تب وظایف</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                {pendingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg bg-[#0E0E0D] border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5DF8D8]"></span>
                      <span className="text-xs text-[#F5F5F5] truncate">{task.title}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        task.priority === 'فوری'
                          ? 'bg-[#F62477]/20 text-[#F62477]'
                          : task.priority === 'مهم'
                          ? 'bg-[#5DF8D8]/20 text-[#5DF8D8]'
                          : 'bg-[#292926] text-[#A3A39E]'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
                {pendingTasks.length > 3 && (
                  <span className="text-[10px] text-[#9E9E9C] text-center pt-0.5">
                    و {toPersianDigits(pendingTasks.length - 3)} وظیفه دیگر در تب وظایف...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasActiveAnnouncement && birthdayStaff.length === 0 && pendingTasks.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl text-[#5DF8D8]/40">
                mark_email_read
              </span>
              <p className="text-xs text-[#A3A39E]">
                کلیه اعلانات و پیام‌ها بررسی شده‌اند و مورد فوری جدیدی وجود ندارد.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#252523] flex items-center justify-between gap-3">
          <span className="font-tech-micro text-[10px] text-[#6E6E6A]">
            نکته: پیام‌ها از طریق آیکون زنگوله بالای صفحه همواره در دسترس هستند.
          </span>
          <button
            onClick={handleClose}
            className="py-2.5 px-6 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs hover:bg-[#46deb9] active:scale-95 transition-all shadow-[0_0_15px_rgba(93,248,216,0.3)] shrink-0"
          >
            متوجه شدم // بستن
          </button>
        </div>
      </div>
    </div>
  );
};
