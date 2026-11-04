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
      <div className="cyber-single-frame mb-3">
        <div className="cyber-single-content p-3 flex items-center justify-between text-xs">
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
            <span className="font-mono text-[10px] bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40 px-2 py-0.5 rounded font-bold animate-pulse shrink-0">
              {toPersianDigits(syncState.pendingCount)} رکورد در صف
            </span>
          )}
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="cyber-single-frame mb-4 w-full">
        <div className="cyber-single-content p-1">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleTabSwitch('games')}
              className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 transition-all cyber-chamfer-btn-sm ${
                subTab === 'games'
                  ? 'bg-[#5DF8D8] text-[#0A2821] font-black shadow-[0_0_15px_rgba(93,248,216,0.4)]'
                  : 'bg-[#181816] text-[#A3A39E] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">videogame_asset</span>
              <span className="text-xs font-bold">آرکید ۱۰ بازی</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono font-bold">
                ۱۰/۱۰
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch('leaderboard')}
              className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 transition-all cyber-chamfer-btn-sm ${
                subTab === 'leaderboard'
                  ? 'bg-[#F62477] text-white font-black shadow-[0_0_15px_rgba(246,36,119,0.4)]'
                  : 'bg-[#181816] text-[#A3A39E] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">leaderboard</span>
              <span className="text-xs font-bold">رتبه‌بندی کل</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 font-mono font-bold">
                LIVE
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini-Games Grid */}
      {subTab === 'games' && (
        <div className="grid grid-cols-2 gap-3 w-full">
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
