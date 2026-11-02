import React, { useState, useEffect } from 'react';
import { UserProfile, GameId, NetworkSyncState } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { db } from '../services/db';
import { GAMES_CATALOG } from './arcade/arcadeCatalog';
import { ArcadeGameCard } from './arcade/ArcadeGameCard';
import { ArcadeLeaderboard } from './arcade/ArcadeLeaderboard';

export { GAMES_CATALOG };

interface ArcadeHubProps {
  profiles: UserProfile[];
  gameScores: Record<string, { userId: string; userName: string; score: number }>;
  onLaunchGame: (gameId: GameId) => void;
}

export const ArcadeHub: React.FC<ArcadeHubProps> = ({ profiles, gameScores, onLaunchGame }) => {
  const [subTab, setSubTab] = useState<'leaderboard' | 'games'>('games');
  const [syncState, setSyncState] = useState<NetworkSyncState>(() => db.getNetworkSyncState());

  useEffect(() => {
    const unsub = db.subscribeSyncState(setSyncState);
    return unsub;
  }, []);

  const handleTabSwitch = (tab: 'leaderboard' | 'games') => {
    sound.play('tap');
    triggerHaptic('light');
    setSubTab(tab);
  };

  const handleStartGame = (gameId: GameId) => {
    sound.play('hit');
    triggerHaptic('medium');
    onLaunchGame(gameId);
  };

  return (
    <div className="flex flex-col w-full select-none pb-12">
      {/* Offline-First Sync Assurance Banner */}
      <div className="mb-3 p-2.5 bg-[#141413] border border-[#5DF8D8]/25 rounded-xl flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">
            {!syncState.isOnline ? 'cloud_off' : 'cloud_done'}
          </span>
          <span className="text-[#A3A39E]">
            {!syncState.isOnline
              ? 'حالت بازی آفلاین فعال است (رکوردها ذخیره و خودکار ارسال می‌شوند)'
              : 'لیدربورد ابری متصل است (اشتراک‌گذاری زنده رکوردها)'}
          </span>
        </div>
        {syncState.pendingCount > 0 && (
          <span className="font-tech-micro text-[10px] bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40 px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
            {toPersianDigits(syncState.pendingCount)} رکورد در صف
          </span>
        )}
      </div>

      {/* Segmented Control Tabs */}
      <div className="relative w-full bg-[#141413] p-1 rounded-xl mb-4 border border-white/5">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => handleTabSwitch('games')}
            className={`min-h-[42px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
              subTab === 'games'
                ? 'bg-[#1E1E1C] text-[#5DF8D8] font-bold shadow-[0_0_12px_rgba(93,248,216,0.3)]'
                : 'bg-transparent text-[#9E9E9C] hover:text-[#F5F5F5]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">videogame_asset</span>
            <span className="text-xs font-bold">آرکید ۱۰ بازی</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#252523] text-[#9E9E9C]">
              ۱۰/۱۰
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('leaderboard')}
            className={`min-h-[42px] flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
              subTab === 'leaderboard'
                ? 'bg-[#1E1E1C] text-[#F62477] font-bold shadow-[0_0_12px_rgba(246,36,119,0.3)]'
                : 'bg-transparent text-[#9E9E9C] hover:text-[#F5F5F5]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">leaderboard</span>
            <span className="text-xs font-bold">رتبه‌بندی کل</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F62477]/20 text-[#F62477] font-bold">
              LIVE
            </span>
          </button>
        </div>
      </div>

      {/* Mini-Games Grid */}
      {subTab === 'games' && (
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {GAMES_CATALOG.map((game) => (
            <ArcadeGameCard
              key={game.id}
              game={game}
              crownHolder={gameScores[game.id]}
              onLaunch={handleStartGame}
            />
          ))}
        </div>
      )}

      {/* Leaderboard View */}
      {subTab === 'leaderboard' && (
        <ArcadeLeaderboard profiles={profiles} />
      )}
    </div>
  );
};
