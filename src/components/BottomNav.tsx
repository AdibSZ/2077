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

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: string;
    badgeCount?: number;
    color: 'magenta' | 'mint';
  }> = [
    { id: 'staff', label: 'پرسنل', icon: 'badge', color: 'magenta' },
    { id: 'tasks', label: 'وظایف', icon: 'checklist', badgeCount: pendingTasksCount, color: 'mint' },
    { id: 'arcade', label: 'آرکید', icon: 'sports_esports', color: 'magenta' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'مدیریت', icon: 'terminal', color: 'magenta' });
  }

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#080807]/95 backdrop-blur-2xl border-t border-[#5DF8D8]/20 shadow-[0_-6px_28px_rgba(0,0,0,0.85)] select-none">
      <div className="h-20 px-3 sm:px-6 flex items-center justify-around gap-2 max-w-xl mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isMagenta = item.color === 'magenta';

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex-1 min-h-[52px] flex flex-col items-center justify-center gap-1 py-1.5 px-2 transition-all duration-200 active:scale-95 relative cyber-chamfer-btn ${
                isActive
                  ? isMagenta
                    ? 'bg-[#F62477] text-white shadow-[0_0_20px_rgba(246,36,119,0.55)] font-black'
                    : 'bg-[#5DF8D8] text-[#0A2821] shadow-[0_0_20px_rgba(93,248,216,0.55)] font-black'
                  : 'bg-[#141413] text-[#8E8E8A] hover:text-white hover:bg-[#1A1A18] font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full min-w-4 text-center font-mono ${
                      isActive
                        ? isMagenta
                          ? 'bg-black text-[#5DF8D8]'
                          : 'bg-[#F62477] text-white'
                        : 'bg-[#F62477] text-white shadow-[0_0_8px_#F62477]'
                    }`}
                  >
                    {toPersianDigits(item.badgeCount)}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
