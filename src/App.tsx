import { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, GameId, Announcement, Task } from './types';
import { db } from './services/db';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { StaffOpsHub } from './components/StaffOpsHub';
import { TasksHub } from './components/TasksHub';
import { ArcadeHub } from './components/ArcadeHub';
import { AdminPanel } from './components/AdminPanel';
import { GameModal } from './components/GameModal';
import { NotificationModal } from './components/NotificationModal';
import { ReloadPrompt } from './components/ReloadPrompt';
import { webNotifications } from './services/webNotificationService';
import { getStaffLevelAndBirthdayInfo } from './utils/jalali';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => db.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('staff');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [gameScores, setGameScores] = useState<Record<string, { userId: string; userName: string; score: number }>>({});
  const [announcement, setAnnouncement] = useState<Announcement>(() => db.getAnnouncement());
  const [tasks, setTasks] = useState<Task[]>(() => db.getTasks());
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  const loadData = async () => {
    const p = await db.getProfiles();
    setProfiles(p);
    setGameScores(db.getGameScores());
    setAnnouncement(db.getAnnouncement());
    setTasks(db.getTasks());

    // Update current user stats if logged in
    const current = db.getCurrentUser();
    if (current) {
      setCurrentUser(current);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribeSyncState(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    loadData();
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setActiveTab('staff');
  };

  // Birthday notifications: ONLY for other staff (never notify current user of their own birthday)
  const otherStaffBirthdays = currentUser
    ? profiles
        .filter((p) => p.id !== currentUser.id)
        .map((p) => ({
          person: p,
          info: getStaffLevelAndBirthdayInfo(p.birthYear, p.birthMonthNum || p.birthMonth, p.birthDay),
        }))
        .filter((b) => b.info.isToday || b.info.isUpcoming3Days)
    : [];

  // Calculate pending tasks for current user
  const myPendingTasksCount = currentUser
    ? tasks.filter(
        (t) => !t.isCompleted && (t.isGlobal || t.assignedToId === 'ALL' || t.assignedToId === currentUser.id)
      ).length
    : 0;

  // Auto popup on app entry / login if there are active notifications
  useEffect(() => {
    if (!currentUser) return;

    const hasUrgent = Boolean(
      announcement && announcement.priority === 'فوری' && announcement.content && announcement.isActive !== false
    );
    const hasAnnouncement = Boolean(
      announcement && announcement.content && announcement.content.trim() && announcement.isActive !== false
    );
    const hasPendingTasks = myPendingTasksCount > 0;

    const hasBirthdays = otherStaffBirthdays.length > 0;
    if (hasUrgent || hasAnnouncement || hasPendingTasks || hasBirthdays) {
      const bdaySig = otherStaffBirthdays.map((b) => `${b.person.id}:${b.info.daysRemaining}`).join(',');
      const noticeSig = `${announcement.id || ''}-${announcement.priority || ''}-${announcement.createdAt || ''}-${myPendingTasksCount}-${bdaySig}`;
      const lastSeen = sessionStorage.getItem('2077_last_seen_notice_sig');
      if (lastSeen !== noticeSig) {
        setIsNotificationModalOpen(true);
        sessionStorage.setItem('2077_last_seen_notice_sig', noticeSig);

        // Also trigger OS system notification if granted!
        if (hasUrgent) {
          webNotifications.notifyEmergencyAlert(announcement.title, announcement.content);
        } else if (hasBirthdays) {
          const bdayNames = otherStaffBirthdays.map((b) => b.person.fullName).join(' و ');
          webNotifications.notifyBirthday(bdayNames, otherStaffBirthdays.some((b) => b.info.isToday));
        } else if (hasPendingTasks && lastSeen) {
          webNotifications.notifyNewTask('شما وظیفه جدید در انتظار اقدام دارید.');
        }
      }
    }
  }, [currentUser, announcement, myPendingTasksCount]);

  if (!currentUser) {
    return (
      <>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
        <ReloadPrompt />
      </>
    );
  }

  const unreadNoticeCount =
    myPendingTasksCount +
    (announcement?.priority === 'فوری' ? 1 : 0) +
    otherStaffBirthdays.length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#1D1D1B] text-[#F5F5F5] selection:bg-[#5DF8D8] selection:text-[#0A2821]">
      {/* Fixed Top Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        unreadNotificationCount={unreadNoticeCount}
        onRefresh={loadData}
      />

      {/* Main Tab View with safe paddings */}
      <main className="flex-1 flex flex-col relative w-full pt-24 pb-28 px-gutter max-w-xl mx-auto z-10">
        {activeTab === 'staff' && (
          <StaffOpsHub
            currentUser={currentUser}
            profiles={profiles}
            announcement={announcement}
            onRefresh={loadData}
            onNavigateToAdmin={() => setActiveTab('admin')}
            onNavigateToTasks={() => setActiveTab('tasks')}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksHub
            currentUser={currentUser}
            profiles={profiles}
            tasks={tasks}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'arcade' && (
          <ArcadeHub
            profiles={profiles}
            gameScores={gameScores}
            onLaunchGame={(gId) => setActiveGameId(gId)}
          />
        )}

        {activeTab === 'admin' && currentUser.isAdmin && (
          <AdminPanel
            profiles={profiles}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={currentUser.isAdmin}
        pendingTasksCount={myPendingTasksCount}
      />

      {/* Active Game Modal */}
      {activeGameId && (
        <GameModal
          gameId={activeGameId}
          currentUser={currentUser}
          crownHolder={gameScores[activeGameId]}
          onClose={() => setActiveGameId(null)}
          onRefresh={loadData}
        />
      )}

      {/* Entry & On-Demand Notification Modal Popup with blurred backdrop and close X */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        currentUser={currentUser}
        announcement={announcement}
        tasks={tasks}
        profiles={profiles}
        onNavigateToTasks={() => {
          setActiveTab('tasks');
          setIsNotificationModalOpen(false);
        }}
        onClearUrgentAlert={() => {
          db.clearAnnouncement();
          loadData();
        }}
      />

      {/* PWA Self-Update Banner Prompt */}
      <ReloadPrompt />
    </div>
  );
}

export default App;
