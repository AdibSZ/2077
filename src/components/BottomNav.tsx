import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#0D0D0C]/90 backdrop-blur-xl border-t border-[#5DF8D8]/20 shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
      <div className="h-20 px-space-md flex items-center justify-around">
        {/* Tab 1: Staff Ops Hub */}
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 rounded transition-all duration-200 ${
            activeTab === 'staff'
              ? 'text-[#F62477] bg-[#1E1E1C] border-b-2 border-[#F62477]'
              : 'text-[#9E9E9C] hover:text-[#5DF8D8]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">badge</span>
          <span className="font-body-sm text-body-sm tracking-tight font-semibold">پرسنل</span>
        </button>

        {/* Tab 2: Arcade & Leaderboard */}
        <button
          onClick={() => setActiveTab('arcade')}
          className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 rounded transition-all duration-200 ${
            activeTab === 'arcade'
              ? 'text-[#F62477] bg-[#1E1E1C] border-b-2 border-[#F62477]'
              : 'text-[#9E9E9C] hover:text-[#5DF8D8]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">sports_esports</span>
          <span className="font-body-sm text-body-sm tracking-tight font-semibold">آرکید و رکوردها</span>
        </button>

        {/* Tab 3: Admin Panel (Only for Admins) */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 rounded transition-all duration-200 ${
              activeTab === 'admin'
                ? 'text-[#F62477] bg-[#1E1E1C] border-b-2 border-[#F62477]'
                : 'text-[#9E9E9C] hover:text-[#5DF8D8]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">terminal</span>
            <span className="font-body-sm text-body-sm tracking-tight font-semibold">مدیریت</span>
          </button>
        )}
      </div>
    </nav>
  );
};
