import React from 'react';
import { ActiveTab } from '../types';
import { toPersianDigits } from '../utils/jalali';
import { sound } from '../utils/audio';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
  pendingTasksCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  pendingTasksCount = 0,
}) => {
  const handleTabClick = (tab: ActiveTab) => {
    sound.play('tap');
    setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#0A0A09]/95 backdrop-blur-xl border-t border-[#5DF8D8]/20 shadow-[0_-4px_25px_rgba(0,0,0,0.85)]">
      <div className="h-20 px-2 sm:px-4 flex items-center justify-around gap-1.5 max-w-xl mx-auto">
        {/* Tab 1: Staff Hub */}
        <button
          onClick={() => handleTabClick('staff')}
          className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 transition-all duration-200 cyber-chamfer-btn-sm active:scale-95 ${
            activeTab === 'staff'
              ? 'bg-[#F62477] text-white shadow-[0_0_18px_rgba(246,36,119,0.5)] font-bold'
              : 'bg-[#151513] text-[#A3A39E] border border-white/5 hover:border-[#5DF8D8]/40 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">badge</span>
          <span className="text-[11px] sm:text-xs font-semibold">پرسنل</span>
        </button>

        {/* Tab 2: Tasks & Dispatch Board */}
        <button
          onClick={() => handleTabClick('tasks')}
          className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 transition-all duration-200 cyber-chamfer-btn-sm relative active:scale-95 ${
            activeTab === 'tasks'
              ? 'bg-[#5DF8D8] text-[#0A2821] shadow-[0_0_18px_rgba(93,248,216,0.5)] font-bold'
              : 'bg-[#151513] text-[#A3A39E] border border-white/5 hover:border-[#5DF8D8]/40 hover:text-white'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">checklist</span>
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#F62477] text-white text-[9px] font-bold rounded-full min-w-4 text-center shadow-[0_0_8px_#F62477]">
                {toPersianDigits(pendingTasksCount)}
              </span>
            )}
          </div>
          <span className="text-[11px] sm:text-xs font-semibold">وظایف</span>
        </button>

        {/* Tab 3: Arcade & Leaderboard */}
        <button
          onClick={() => handleTabClick('arcade')}
          className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 transition-all duration-200 cyber-chamfer-btn-sm active:scale-95 ${
            activeTab === 'arcade'
              ? 'bg-[#F62477] text-white shadow-[0_0_18px_rgba(246,36,119,0.5)] font-bold'
              : 'bg-[#151513] text-[#A3A39E] border border-white/5 hover:border-[#5DF8D8]/40 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">sports_esports</span>
          <span className="text-[11px] sm:text-xs font-semibold">آرکید</span>
        </button>

        {/* Tab 4: Admin Panel (Only for Admins) */}
        {isAdmin && (
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 px-1 transition-all duration-200 cyber-chamfer-btn-sm active:scale-95 ${
              activeTab === 'admin'
                ? 'bg-[#F62477] text-white shadow-[0_0_18px_rgba(246,36,119,0.5)] font-bold'
                : 'bg-[#151513] text-[#A3A39E] border border-white/5 hover:border-[#5DF8D8]/40 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">terminal</span>
            <span className="text-[11px] sm:text-xs font-semibold">مدیریت</span>
          </button>
        )}
      </div>
    </nav>
  );
};
