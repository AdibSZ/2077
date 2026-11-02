import React, { useState, useEffect } from 'react';
import { UserProfile, GameId, GameMetadata, NetworkSyncState } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { db } from '../services/db';

interface ArcadeHubProps {
  profiles: UserProfile[];
  gameScores: Record<string, { userId: string; userName: string; score: number }>;
  onLaunchGame: (gameId: GameId) => void;
}

export const GAMES_CATALOG: GameMetadata[] = [
  {
    id: 'cyber_stack',
    nameFa: 'برج‌ساز نئونی',
    nameEn: 'Cyber Stack',
    multiplier: 0.5,
    description: 'چیدن بلوک‌های نئونی با تپ دقیق و بریدن لبه‌های اضافه',
    iconName: 'layers',
  },
  {
    id: 'breach_lock',
    nameFa: 'قفل‌شکن سرعتی',
    nameEn: 'Breach Lock',
    multiplier: 1.0,
    description: 'شلیک لیزر هنگام عبور عقربه از روی گره امنیتی',
    iconName: 'lock_open',
  },
  {
    id: 'glitch_flap',
    nameFa: 'فرار در ماتریکس',
    nameEn: 'Glitch Flap',
    multiplier: 1.25,
    description: 'هدایت پهپاد سایبری از میان دیوارهای لیزری عمودی',
    iconName: 'flight_takeoff',
  },
  {
    id: 'gravity_runner',
    nameFa: 'سوئیچ جاذبه',
    nameEn: 'Gravity Runner',
    multiplier: 0.025,
    description: 'دویدن پرسرعت روی سقف و زمین با معکوس کردن جاذبه',
    iconName: 'swap_vert',
  },
  {
    id: 'cyber_whack',
    nameFa: 'شکارچی باگ',
    nameEn: 'Cyber Whack',
    multiplier: 0.25,
    description: 'شکار سریع باگ‌های سرخابی در شبکه گرید ۴×۴',
    iconName: 'pest_control',
  },
  {
    id: 'zero_ms',
    nameFa: 'تایمر ۰.۰۰ ثانیه',
    nameEn: 'Zero-MS Precision',
    multiplier: 1.0,
    description: 'توقف تایمر دقیقاً روی ۵ ثانیه پس از مخفی‌سازی ارقام',
    iconName: 'timer',
  },
  {
    id: 'orbit_jump',
    nameFa: 'پرتابگر نئون',
    nameEn: 'Orbit Jump',
    multiplier: 1.0,
    description: 'پرتاب گوی نئونی از مدار فعلی به مدار جاذبه بعدی',
    iconName: 'track_changes',
  },
  {
    id: 'chroma_switch',
    nameFa: 'تطبیق رنگ لیزری',
    nameEn: 'Chroma Switch',
    multiplier: 0.5,
    description: 'تطبیق فوری رنگ سپر دفاعی با دیوارهای لیزری ورودی',
    iconName: 'palette',
  },
  {
    id: 'core_injector',
    nameFa: 'تیرانداز هسته',
    nameEn: 'Core Injector',
    multiplier: 1.0,
    description: 'شلیک پین‌های نئونی به هسته چرخان بدون برخورد با قبلی‌ها',
    iconName: 'adjust',
  },
  {
    id: 'neural_sequence',
    nameFa: 'حافظه سایبری',
    nameEn: 'Neural Sequence',
    multiplier: 2.5,
    description: 'به‌خاطرسپاری و تکرار الگوی صوتی-نوری پدهای سایبری',
    iconName: 'psychology',
  },
];

export const ArcadeHub: React.FC<ArcadeHubProps> = ({ profiles, gameScores, onLaunchGame }) => {
  const [subTab, setSubTab] = useState<'leaderboard' | 'games'>('games');
  const [syncState, setSyncState] = useState<NetworkSyncState>(() => db.getNetworkSyncState());

  useEffect(() => {
    const unsub = db.subscribeSyncState(setSyncState);
    return unsub;
  }, []);

  // Sorted leaderboard by Total CP descending
  const sortedProfiles = [...profiles].sort((a, b) => b.totalCp - a.totalCp);
  const champ = sortedProfiles[0];
  const runnerUp = sortedProfiles[1];
  const thirdPlace = sortedProfiles[2];
  const others = sortedProfiles.slice(3);

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
    <div className="flex flex-col w-full select-none">
      {/* Offline-First Sync Assurance Banner */}
      <div className="mb-3 p-2.5 bg-[#141413] border border-[#5DF8D8]/25 rounded-xl flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">
            {!syncState.isOnline ? 'cloud_off' : 'cloud_done'}
          </span>
          <span className="text-[#A3A39E]">
            {!syncState.isOnline
              ? 'حالت بازی ۱۰۰٪ آفلاین فعال است (رکوردها پس از اتصال اینترنت خودکار ارسال می‌شوند)'
              : 'لیدربورد ابری متصل است (اشتراک‌گذاری لحظه‌ای رکوردها میان تمام پرسنل)'}
          </span>
        </div>
        {syncState.pendingCount > 0 && (
          <span className="font-tech-micro text-[10px] bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40 px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
            {toPersianDigits(syncState.pendingCount)} رکورد در صف
          </span>
        )}
      </div>

      {/* Interactive Tactical Segmented Control */}
      <div className="relative w-full bg-[#141413] p-space-xs rounded-lg mb-space-lg shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-2 gap-space-xs">
          <button
            onClick={() => handleTabSwitch('games')}
            className={`relative min-h-[44px] flex items-center justify-center gap-space-sm px-space-md py-space-sm rounded transition-all duration-300 ${
              subTab === 'games'
                ? 'bg-[#1E1E1C] text-[#5DF8D8] shadow-[0_0_12px_rgba(93,248,216,0.3)]'
                : 'bg-transparent text-[#9E9E9C] hover:text-[#F5F5F5]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">videogame_asset</span>
            <span className="font-title-sm text-title-sm font-bold tracking-tight">آرکید ۱۰ بازی</span>
            <span className="font-tech-micro text-tech-micro px-1.5 py-0.5 rounded bg-[#252523] text-[#9E9E9C]">
              ۱۰/۱۰
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('leaderboard')}
            className={`relative min-h-[44px] flex items-center justify-center gap-space-sm px-space-md py-space-sm rounded transition-all duration-300 ${
              subTab === 'leaderboard'
                ? 'bg-[#1E1E1C] text-[#F62477] shadow-[0_0_12px_rgba(246,36,119,0.3)]'
                : 'bg-transparent text-[#9E9E9C] hover:text-[#F5F5F5]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">leaderboard</span>
            <span className="font-title-sm text-title-sm font-bold tracking-tight">رتبه‌بندی کل</span>
            <span className="font-tech-micro text-tech-micro px-1.5 py-0.5 rounded bg-[#F62477]/20 text-[#F62477]">
              [LIVE]
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 10 ARCADE MINI-GAMES GRID */}
      {subTab === 'games' && (
        <div className="flex flex-col gap-space-md w-full transition-opacity duration-300">
          {/* Section Banner */}
          <div className="flex items-center justify-between bg-[#141413] px-space-md py-space-sm rounded-lg border border-[#2F2F2D] relative overflow-hidden">
            <div className="flex items-center gap-space-sm z-10">
              <img src="/brand/logo-mint.png" alt="2077 Arcade" className="w-6 h-auto object-contain drop-shadow-[0_0_8px_#5DF8D8]" />
              <span className="font-title-sm text-title-sm font-bold text-[#F5F5F5]">اتاق چالش‌های سایبری</span>
            </div>
            <span className="font-tech-micro text-tech-micro text-[#F62477] bg-[#F62477]/15 px-2 py-0.5 rounded font-bold border border-[#F62477]/30 z-10">
              XP DBL BOOST
            </span>
          </div>

          {/* 2-Column Grid of 10 Games */}
          <div className="grid grid-cols-2 gap-space-sm w-full">
            {GAMES_CATALOG.map((game) => {
              const crownHolder = gameScores[game.id];

              return (
                <div
                  key={game.id}
                  className="bg-[#141413] p-space-sm rounded-lg flex flex-col justify-between shadow-sm relative group overflow-hidden border border-[#2F2F2D]"
                >
                  <div className="flex items-start justify-between mb-space-sm">
                    <div className="w-9 h-9 rounded bg-[#1E1E1C] flex items-center justify-center text-[#5DF8D8] shadow-[0_0_8px_rgba(93,248,216,0.25)] border border-[#5DF8D8]/20">
                      <span className="material-symbols-outlined text-[20px]">{game.iconName}</span>
                    </div>
                    <span className="font-tech-micro text-tech-micro px-1 py-0.5 bg-[#F62477]/20 text-[#F62477] rounded font-bold border border-[#F62477]/30">
                      ×{game.multiplier.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col mb-space-sm">
                    <span className="font-title-sm text-title-sm font-bold text-[#F5F5F5] truncate">
                      {game.nameFa}
                    </span>
                    <span className="font-tech-micro text-tech-micro text-[#9E9E9C] truncate">
                      {game.nameEn}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[#9E9E9C] font-body-sm text-xs truncate">
                      <span className="text-[#F62477] text-xs">👑</span>
                      <span className="truncate text-[#F5F5F5]">
                        {crownHolder ? crownHolder.userName.split(' ')[0] : 'بدون رکورد'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartGame(game.id)}
                    className="w-full min-h-[38px] bg-[#F62477] hover:bg-[#5DF8D8] text-white hover:text-[#0A2821] font-title-sm text-title-sm font-bold py-1.5 px-space-sm rounded flex items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_10px_rgba(246,36,119,0.35)]"
                  >
                    <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                    <span>شروع</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: LEADERBOARD VIEW */}
      {subTab === 'leaderboard' && (
        <div className="flex flex-col gap-space-md w-full transition-opacity duration-300">
          {/* Telemetry Status Bar */}
          <div className="flex items-center justify-between bg-[#141413] px-space-md py-space-sm rounded-lg shadow-sm border border-[#2F2F2D]">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-[#5DF8D8] animate-ping"></span>
              <span className="font-tech-micro text-tech-micro text-[#5DF8D8] tracking-wider">
                LEADERBOARD_CYCLE // مسابقات فروشگاه
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-[#9E9E9C]">
              <span className="material-symbols-outlined text-[14px]">update</span>
              <span className="font-tech-micro text-tech-micro">بروزرسانی زنده</span>
            </div>
          </div>

          {/* Formula Explainer Strip */}
          <div className="bg-[#141413]/80 p-2.5 rounded border border-[#5DF8D8]/20 flex items-center justify-between text-xs font-tech-micro">
            <span className="text-[#A3A39F]">فرمول امتیاز کل:</span>
            <span className="text-[#5DF8D8] font-bold">
              Total CP = Banked XP + (👑 Crowns × 500)
            </span>
          </div>

          {/* #1 Champion Card */}
          {champ && (
            <div className="relative overflow-hidden bg-[#141413] p-space-md rounded-lg shadow-[0_0_24px_rgba(246,36,119,0.25)] border border-[#F62477]/40">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#F62477] via-[#F62477]/80 to-transparent"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 opacity-[0.08] pointer-events-none">
                <img src="/brand/logo-magenta.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center justify-between mb-space-sm relative z-10">
                <div className="flex items-center gap-space-xs bg-[#F62477]/20 text-[#F62477] px-space-sm py-0.5 rounded border border-[#F62477]/30">
                  <span className="material-symbols-outlined text-[16px] text-[#F62477]">military_tech</span>
                  <span className="font-code-lg text-code-lg font-black tracking-widest text-[#F62477]">
                    #1
                  </span>
                  <span className="font-tech-micro text-tech-micro text-[#F62477] tracking-tight">
                    صدرنشین رقابت‌ها
                  </span>
                </div>
                <div className="font-tech-micro text-tech-micro text-[#9E9E9C] tracking-widest">
                  // SEC.RANK_ALPHA
                </div>
              </div>

              <div className="flex items-center gap-space-md">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-lg bg-[#1E1E1C] overflow-hidden shadow-[0_0_12px_rgba(246,36,119,0.4)] border border-[#F62477]/50">
                    <img
                      className="w-full h-full object-cover"
                      src={champ.avatarUrl}
                      alt={champ.fullName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/admin.svg';
                      }}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-[#F62477] text-white w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_8px_#F62477]">
                    <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <span className="font-headline-md text-headline-md font-bold text-[#F5F5F5] truncate">
                      {champ.fullName}
                    </span>
                    {champ.crownsCount > 0 && (
                      <span className="bg-[#F62477]/15 text-[#F62477] border border-[#F62477]/30 font-code-md text-code-md px-1.5 py-0.5 rounded font-bold">
                        👑 ×{toPersianDigits(champ.crownsCount)}
                      </span>
                    )}
                  </div>
                  <span className="font-body-sm text-body-sm text-[#9E9E9C] truncate">
                    {champ.crownsCount > 0
                      ? `دارنده ${toPersianDigits(champ.crownsCount)} رکورد برتر بازی‌ها`
                      : 'آماده ثبت اولین رکورد'}
                  </span>
                  <span className="font-tech-micro text-tech-micro text-[#F62477] mt-0.5">
                    {toPersianDigits(champ.bankedXp)} XP آرکید + {toPersianDigits(champ.crownsCount * 500)} پاداش تاج
                  </span>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-1">
                  <span className="font-code-lg text-code-lg font-black text-[#5DF8D8] drop-shadow-[0_0_8px_rgba(93,248,216,0.45)]">
                    {toPersianDigits(champ.totalCp)}
                  </span>
                  <span className="font-tech-micro text-tech-micro text-[#5DF8D8]">CP امتیاز</span>
                </div>
              </div>
            </div>
          )}

          {/* #2 Runner-Up Card */}
          {runnerUp && (
            <div className="relative overflow-hidden bg-[#141413] p-space-md rounded-lg shadow-[0_0_16px_rgba(93,248,216,0.15)] border border-[#5DF8D8]/30">
              <div className="absolute top-0 right-0 left-0 h-0.5 bg-[#5DF8D8]"></div>
              <div className="flex items-center justify-between mb-space-xs">
                <div className="flex items-center gap-space-xs text-[#5DF8D8]">
                  <span className="font-code-md text-code-md font-bold text-[#F5F5F5]">#2</span>
                  <span className="font-tech-micro text-tech-micro bg-[#5DF8D8]/10 text-[#5DF8D8] border border-[#5DF8D8]/20 px-1 rounded">
                    جایگاه دوم
                  </span>
                </div>
                <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">// OPERATOR.02</span>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-[#1E1E1C] overflow-hidden shadow-[0_0_8px_rgba(93,248,216,0.25)] border border-[#5DF8D8]/30">
                    <img
                      className="w-full h-full object-cover"
                      src={runnerUp.avatarUrl}
                      alt={runnerUp.fullName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/avatar1.svg';
                      }}
                    />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 bg-[#5DF8D8] text-[#0A2821] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[12px]">star</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-title-sm text-title-sm font-bold text-[#F5F5F5] truncate">
                      {runnerUp.fullName}
                    </span>
                    {runnerUp.crownsCount > 0 && (
                      <span className="bg-[#F62477]/15 text-[#F62477] border border-[#F62477]/25 font-code-md text-code-md px-1 py-0.2 rounded font-bold">
                        👑 ×{toPersianDigits(runnerUp.crownsCount)}
                      </span>
                    )}
                  </div>
                  <span className="font-body-sm text-body-sm text-[#9E9E9C]">
                    {toPersianDigits(runnerUp.bankedXp)} XP آرکید
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-1">
                  <span className="font-code-lg text-code-lg font-bold text-[#5DF8D8]">
                    {toPersianDigits(runnerUp.totalCp)}
                  </span>
                  <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">CP امتیاز</span>
                </div>
              </div>
            </div>
          )}

          {/* #3 Podium Card */}
          {thirdPlace && (
            <div className="relative overflow-hidden bg-[#141413] p-space-md rounded-lg shadow-sm border border-[#2F2F2D]">
              <div className="flex items-center justify-between mb-space-xs">
                <div className="flex items-center gap-space-xs text-[#9E9E9C]">
                  <span className="font-code-md text-code-md font-bold text-[#F5F5F5]">#3</span>
                  <span className="font-tech-micro text-tech-micro bg-[#5DF8D8]/10 text-[#5DF8D8] border border-[#5DF8D8]/20 px-1 rounded">
                    جایگاه سوم
                  </span>
                </div>
                <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">// OPERATOR.03</span>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-[#1E1E1C] overflow-hidden border border-[#2F2F2D]">
                    <img
                      className="w-full h-full object-cover"
                      src={thirdPlace.avatarUrl}
                      alt={thirdPlace.fullName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/avatar1.svg';
                      }}
                    />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 bg-[#2C2C2A] text-[#F5F5F5] w-5 h-5 rounded-full flex items-center justify-center border border-[#5DF8D8]/30">
                    <span className="material-symbols-outlined text-[12px]">grade</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-title-sm text-title-sm font-bold text-[#F5F5F5] truncate">
                      {thirdPlace.fullName}
                    </span>
                    {thirdPlace.crownsCount > 0 && (
                      <span className="bg-[#F62477]/15 text-[#F62477] border border-[#F62477]/25 font-code-md text-code-md px-1 py-0.2 rounded font-bold">
                        👑 ×{toPersianDigits(thirdPlace.crownsCount)}
                      </span>
                    )}
                  </div>
                  <span className="font-body-sm text-body-sm text-[#9E9E9C]">
                    {toPersianDigits(thirdPlace.bankedXp)} XP آرکید
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-1">
                  <span className="font-code-lg text-code-lg font-bold text-[#5DF8D8]">
                    {toPersianDigits(thirdPlace.totalCp)}
                  </span>
                  <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">CP امتیاز</span>
                </div>
              </div>
            </div>
          )}

          {/* Rows #4+ */}
          {others.length > 0 && (
            <div className="bg-[#141413] rounded-lg p-space-sm flex flex-col gap-space-xs shadow-sm border border-[#2F2F2D]">
              {others.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-space-sm bg-[#1E1E1C]/60 rounded hover:bg-[#1E1E1C] transition-colors border border-transparent hover:border-[#2F2F2D]"
                >
                  <div className="flex items-center gap-space-md min-w-0">
                    <span className="font-code-md text-code-md text-[#9E9E9C] font-bold w-6 text-center">
                      #{idx + 4}
                    </span>
                    <div className="w-8 h-8 rounded bg-[#252523] overflow-hidden shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={p.avatarUrl}
                        alt={p.fullName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/avatar1.svg';
                        }}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-body-md text-body-md font-semibold text-[#F5F5F5] truncate">
                        {p.fullName}
                      </span>
                      <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">
                        {p.roleTitle.split('//')[0]} {p.crownsCount > 0 && <span className="text-[#F62477]">👑 ×{toPersianDigits(p.crownsCount)}</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-code-md text-code-md font-bold text-[#5DF8D8]">
                      {toPersianDigits(p.totalCp)}
                    </span>
                    <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">CP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
