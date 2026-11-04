import React, { useState, useEffect } from 'react';
import { UserProfile, Announcement, Task } from '../types';
import { db } from '../services/db';
import { AnnouncementBanner } from './staff/AnnouncementBanner';
import { StaffMetricsBar } from './staff/StaffMetricsBar';
import { StaffFilterTabs } from './staff/StaffFilterTabs';
import { StaffCard } from './staff/StaffCard';
import { StaffCallModal, StaffDossierModal, StaffTaskModal } from './staff/StaffModals';
import { getStaffLevelAndBirthdayInfo, toPersianDigits } from '../utils/jalali';

interface StaffOpsHubProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  announcement: Announcement;
  onRefresh: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToTasks?: () => void;
}

export const StaffOpsHub: React.FC<StaffOpsHubProps> = ({
  currentUser,
  profiles,
  announcement,
  onRefresh,
  onNavigateToTasks,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Selected modals target
  const [callTarget, setCallTarget] = useState<UserProfile | null>(null);
  const [dossierTarget, setDossierTarget] = useState<UserProfile | null>(null);
  const [taskTarget, setTaskTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    setTasks(db.getTasks());
  }, []);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const pendingTasksCount = tasks.filter((t) => !t.isCompleted).length;
  const onlineCount = profiles.filter((p) => p.isOnline).length;

  // Birthday events for other staff only (never notify currentUser of their own birthday)
  const otherStaffBirthdays = profiles
    .filter((p) => p.id !== currentUser.id)
    .map((p) => ({
      person: p,
      info: getStaffLevelAndBirthdayInfo(p.birthYear, p.birthMonthNum || p.birthMonth, p.birthDay),
    }))
    .filter((b) => b.info.isToday || b.info.isUpcoming3Days);

  const filteredProfiles = profiles.filter((p) => {
    // Filter tabs
    if (filter === 'online' && !p.isOnline) return false;
    if (filter === 'shift_day' && p.shiftName !== 'شیفت روز') return false;
    if (filter === 'shift_night' && p.shiftName !== 'شیفت شب') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = p.fullName.toLowerCase().includes(q);
      const matchRole = p.roleTitle.toLowerCase().includes(q);
      const matchUser = p.username.toLowerCase().includes(q);
      const matchExt = (p.internalExt || '').includes(q);
      if (!matchName && !matchRole && !matchUser && !matchExt) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-4 select-none pb-12">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="p-3 bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 rounded-xl text-[#5DF8D8] text-xs font-semibold text-center animate-pulse shadow-lg">
          {toastNotice}
        </div>
      )}

      {/* Store Announcement Wall */}
      <AnnouncementBanner
        announcement={announcement}
        currentUser={currentUser}
        onRefresh={onRefresh}
        showToast={showToast}
      />

      {/* Cyberpunk Birthday Alert Banner (For other staff only) */}
      {otherStaffBirthdays.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-[#5DF8D8]/10 via-[#141413] to-[#F62477]/10 border border-[#5DF8D8]/40 rounded-xl flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(93,248,216,0.15)] animate-pulse">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">🎂</span>
            <div className="flex flex-col text-right truncate">
              <span className="text-xs font-bold text-[#5DF8D8]">
                رویداد زادروز پرسنل سیستم ۲۰۷۷
              </span>
              <span className="text-[11px] text-[#F5F5F5] truncate mt-0.5">
                {otherStaffBirthdays
                  .map((b) =>
                    b.info.isToday
                      ? `امروز زادروز «${b.person.fullName}» (ارتقا به LVL ${toPersianDigits(b.info.level)}) مبارک!`
                      : `تنها ${toPersianDigits(b.info.daysRemaining)} روز تا زادروز «${b.person.fullName}» (ارتقا به LVL ${toPersianDigits(b.info.nextLevel)}) باقی مانده است.`
                  )
                  .join(' • ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Top Bar */}
      <StaffMetricsBar
        onlineCount={onlineCount}
        totalStaff={profiles.length}
        pendingTasksCount={pendingTasksCount}
        onNavigateToTasks={onNavigateToTasks}
      />

      {/* Filter and Search Bar */}
      <StaffFilterTabs
        currentFilter={filter}
        onSelectFilter={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Staff Roster Cards */}
      <div className="flex flex-col gap-3">
        {filteredProfiles.map((person, idx) => (
          <StaffCard
            key={person.id}
            person={person}
            index={idx}
            isAdmin={currentUser.isAdmin}
            onCall={(p) => setCallTarget(p)}
            onDossier={(p) => setDossierTarget(p)}
            onAssignTask={(p) => setTaskTarget(p)}
          />
        ))}

        {filteredProfiles.length === 0 && (
          <div className="text-center py-8 text-xs text-[#A3A39E] bg-[#141413] rounded-xl border border-white/5">
            پرسنلی با این مشخصات یافت نشد.
          </div>
        )}
      </div>

      {/* Action Modals */}
      <StaffCallModal person={callTarget} onClose={() => setCallTarget(null)} />
      <StaffDossierModal person={dossierTarget} onClose={() => setDossierTarget(null)} />
      <StaffTaskModal
        person={taskTarget}
        currentUser={currentUser}
        onClose={() => setTaskTarget(null)}
        onSuccess={(msg) => {
          showToast(msg);
          setTasks(db.getTasks());
          onRefresh();
        }}
      />
    </div>
  );
};
