import React, { useState } from 'react';
import { GameId, UserProfile } from '../types';
import { GAMES_CATALOG } from './ArcadeHub';
import { db } from '../services/db';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { toPersianDigits } from '../utils/jalali';

// Import All 10 Mini-Games
import { CyberStack } from '../games/CyberStack';
import { BreachLock } from '../games/BreachLock';
import { GlitchFlap } from '../games/GlitchFlap';
import { GravityRunner } from '../games/GravityRunner';
import { CyberWhack } from '../games/CyberWhack';
import { ZeroMs } from '../games/ZeroMs';
import { OrbitJump } from '../games/OrbitJump';
import { ChromaSwitch } from '../games/ChromaSwitch';
import { CoreInjector } from '../games/CoreInjector';
import { NeuralSequence } from '../games/NeuralSequence';
import { getAssetUrl } from '../utils/assets';
import { CyberAvatar } from './CyberAvatar';

interface GameModalProps {
  gameId: GameId;
  currentUser: UserProfile;
  crownHolder?: { userName: string; score: number };
  onClose: () => void;
  onRefresh: () => void;
}

const EMBLEM_URL = getAssetUrl('/brand/logo-mint.png');

export const GameModal: React.FC<GameModalProps> = ({
  gameId,
  currentUser,
  crownHolder,
  onClose,
  onRefresh,
}) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [gameOverResult, setGameOverResult] = useState<{
    score: number;
    earnedXp: number;
    newHighScore: boolean;
    newCrown: boolean;
    queuedOffline?: boolean;
  } | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const gameMeta = GAMES_CATALOG.find((g) => g.id === gameId)!;
  const potentialXp = Math.round(currentScore * gameMeta.multiplier);

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score);
  };

  const handleGameOver = async (finalScore: number) => {
    try {
      const res = await db.submitGameResult(
        currentUser.id,
        gameId,
        finalScore,
        gameMeta.multiplier
      );
      setGameOverResult({
        score: finalScore,
        earnedXp: res.earnedXp,
        newHighScore: res.newHighScore,
        newCrown: res.newCrown,
        queuedOffline: res.queuedOffline,
      });
      onRefresh();
    } catch (e) {
      console.warn('Game over submit failed:', e);
      setGameOverResult({
        score: finalScore,
        earnedXp: Math.round(finalScore * gameMeta.multiplier),
        newHighScore: false,
        newCrown: false,
        queuedOffline: true,
      });
    }
  };

  const handleReplay = () => {
    sound.play('tap');
    triggerHaptic('light');
    setCurrentScore(0);
    setGameOverResult(null);
    setGameKey((prev) => prev + 1);
  };

  const renderGameComponent = () => {
    const props = {
      key: gameKey,
      onScoreUpdate: handleScoreUpdate,
      onGameOver: handleGameOver,
    };

    switch (gameId) {
      case 'cyber_stack':
        return <CyberStack {...props} />;
      case 'breach_lock':
        return <BreachLock {...props} />;
      case 'glitch_flap':
        return <GlitchFlap {...props} />;
      case 'gravity_runner':
        return <GravityRunner {...props} />;
      case 'cyber_whack':
        return <CyberWhack {...props} />;
      case 'zero_ms':
        return <ZeroMs {...props} />;
      case 'orbit_jump':
        return <OrbitJump {...props} />;
      case 'chroma_switch':
        return <ChromaSwitch {...props} />;
      case 'core_injector':
        return <CoreInjector {...props} />;
      case 'neural_sequence':
        return <NeuralSequence {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1D1D1B] flex flex-col overflow-y-auto select-none">
      {/* Top HUD Header */}
      <header className="sticky top-0 w-full z-50 pt-safe bg-[#141413]/90 backdrop-blur-xl border-b border-[#3A3A38]/40 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="h-16 px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              aria-label="بازگشت"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded text-[#F5F5F5] hover:text-[#5DF8D8] hover:bg-[#1E1E1C] transition-colors"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_forward_ios</span>
            </button>
            <img
              alt="2077 Cyber Emblem"
              className="h-7 w-auto object-contain"
              src={EMBLEM_URL}
            />
            <div className="flex flex-col text-right">
              <span className="font-code-md text-code-md text-[#5DF8D8] tracking-wider">
                {gameMeta.nameEn}
              </span>
              <h1 className="font-title-sm text-sm text-[#F5F5F5] font-bold">
                {gameMeta.nameFa}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            <CyberAvatar
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              size="xs"
              shape="rounded"
              neonBorder={currentUser.isAdmin ? 'magenta' : 'mint'}
              isOnline={true}
              showOnlineBadge={true}
            />
          </div>
        </div>
      </header>

      {/* Main Arena View */}
      <main className="flex-1 flex flex-col items-center justify-start p-gutter max-w-lg mx-auto w-full gap-space-md">
        {/* Top HUD Telemetry Bar */}
        <div className="w-full bg-[#141413] rounded-xl p-4 shadow-xl flex flex-col space-y-3 relative overflow-hidden border border-[#262624]">
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#1E1E1C] text-[#F62477] font-code-md text-xs shadow-sm border border-[#F62477]/20 font-bold">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span>ضریب: ×{gameMeta.multiplier.toFixed(2)}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#5DF8D8]/10 text-[#5DF8D8] font-code-md text-xs animate-pulse border border-[#5DF8D8]/20 font-bold">
                +{toPersianDigits(potentialXp)} XP
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#1E1E1C] px-2.5 py-1 rounded text-[#F62477] font-body-sm text-xs shadow-inner border border-[#F62477]/20">
              <span>
                👑 رکورد: {crownHolder ? `${toPersianDigits(crownHolder.score)} (${crownHolder.userName.split(' ')[0]})` : 'بدون رکورد'}
              </span>
            </div>
          </div>

          {/* Main Score Readout */}
          <div className="flex items-end justify-between z-10 pt-1">
            <div className="flex flex-col text-right">
              <span className="text-[#A3A39F] font-tech-micro text-[10px] tracking-widest uppercase">
                CURRENT OVERRIDE // امتیاز دست
              </span>
              <span className="font-code-lg text-4xl text-[#5DF8D8] font-extrabold tracking-tight drop-shadow-[0_0_12px_rgba(93,248,216,0.45)]">
                {toPersianDigits(currentScore)}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="font-tech-micro text-[10px] text-[#A3A39F]">
                TOTAL CP: {toPersianDigits(currentUser.totalCp)}
              </span>
            </div>
          </div>
        </div>

        {/* Center Interactive Game Arena */}
        <div className="relative w-full flex items-center justify-center min-h-[400px]">
          {renderGameComponent()}

          {/* Game Over Modal Screen Overlay */}
          {gameOverResult && (
            <div className="absolute inset-0 bg-[#0D0D0C]/95 backdrop-blur-md rounded-xl border border-[#F62477]/40 p-6 flex flex-col items-center justify-between z-30 shadow-2xl animate-fade-in text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-[#F62477]/15 border border-[#F62477] flex items-center justify-center p-2 shadow-[0_0_20px_#F62477]">
                  <img src={getAssetUrl('/brand/logo-magenta.png')} alt="2077" className="w-full h-full object-contain drop-shadow-[0_0_8px_#F62477]" />
                </div>
                <h2 className="font-display-sm text-2xl font-black text-[#F5F5F5] mt-2">
                  اتمام دست بازی // GAME OVER
                </h2>
                <span className="font-tech-micro text-xs text-[#9E9E9C]">
                  سیستم ثبت داده‌های تله‌متری به پایان رسید
                </span>
              </div>

              {/* Score Breakdown Panel */}
              <div className="w-full bg-[#141413] p-4 rounded-lg border border-[#2F2F2D] flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#A3A39F]">امتیاز کسب شده:</span>
                  <span className="font-code-md text-[#5DF8D8] font-bold text-lg">
                    {toPersianDigits(gameOverResult.score)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#A3A39F]">پاداش XP اندوخته (Banked XP):</span>
                  <span className="font-code-md text-[#F62477] font-bold text-lg">
                    +{toPersianDigits(gameOverResult.earnedXp)} XP
                  </span>
                </div>

                {gameOverResult.newCrown && (
                  <div className="p-2 bg-[#F62477]/20 border border-[#F62477] rounded text-[#F62477] text-xs font-bold animate-pulse mt-1">
                    👑 تبریک! شما رکورددار کل فروشگاه شدید (+۵۰۰ CP پاداش تاج)
                  </div>
                )}

                {/* Cloud Replication & Offline Queue Pip */}
                <div className="pt-2 mt-1 border-t border-[#232321] flex items-center justify-center gap-1.5 text-center text-xs">
                  {gameOverResult.queuedOffline ? (
                    <span className="text-[#E5A93C] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">cloud_queue</span>
                      <span>امتیاز در حافظه آفلاین ثبت شد؛ پس از اتصال خودکار به سرور ارسال می‌شود.</span>
                    </span>
                  ) : (
                    <span className="text-[#5DF8D8] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                      <span>امتیاز فوراً با لیدربورد ابری کل فروشگاه همگام شد.</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={handleReplay}
                  className="w-full py-3 bg-[#F62477] hover:bg-[#5DF8D8] text-white hover:text-[#0A2821] font-title-sm font-extrabold rounded-lg shadow-[0_0_16px_rgba(246,36,119,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">replay</span>
                  <span>تلاش مجدد // REPLAY</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-[#252523] text-[#F5F5F5] hover:text-[#5DF8D8] font-body-sm font-semibold rounded-lg border border-[#3A3A38] active:scale-95 transition-all"
                >
                  بازگشت به لیدربورد // EXIT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
