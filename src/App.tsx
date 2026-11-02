import { useState, useEffect } from 'react';
import { UserProfile, ActiveTab, GameId, Announcement } from './types';
import { db } from './services/db';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './components/AuthScreen';
import { StaffOpsHub } from './components/StaffOpsHub';
import { ArcadeHub } from './components/ArcadeHub';
import { AdminPanel } from './components/AdminPanel';
import { GameModal } from './components/GameModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => db.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('staff');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [gameScores, setGameScores] = useState<Record<string, { userId: string; userName: string; score: number }>>({});
  const [announcement, setAnnouncement] = useState<Announcement>(() => db.getAnnouncement());
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);

  const loadData = async () => {
    const p = await db.getProfiles();
    setProfiles(p);
    setGameScores(db.getGameScores());
    setAnnouncement(db.getAnnouncement());

    // Update current user stats if logged in
    const current = db.getCurrentUser();
    if (current) {
      setCurrentUser(current);
    }
  };

  useEffect(() => {
    loadData();
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

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#1D1D1B] text-[#F5F5F5] selection:bg-[#5DF8D8] selection:text-[#0A2821]">
      {/* Fixed Top Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onLogout={handleLogout}
      />

      {/* Main Tab View with safe paddings */}
      <main className="flex-1 flex flex-col relative w-full pt-24 pb-28 px-gutter max-w-xl mx-auto z-10">
        {activeTab === 'staff' && (
          <StaffOpsHub
            profiles={profiles}
            announcement={announcement}
            onRefresh={loadData}
            onNavigateToAdmin={() => setActiveTab('admin')}
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
    </div>
  );
}

export default App;
