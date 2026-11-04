import React from 'react';
import { sound } from '../../utils/audio';

interface StaffFilterTabsProps {
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const StaffFilterTabs: React.FC<StaffFilterTabsProps> = ({
  currentFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
}) => {
  const tabs = [
    { id: 'all', label: 'همه پرسنل' },
    { id: 'online', label: 'فقط آنلاین' },
    { id: 'shift_day', label: 'شیفت روز' },
    { id: 'shift_night', label: 'شیفت شب' },
  ];

  const handleClear = () => {
    sound.play('tap');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* High-Tech Search Bar with Instant Clear Button */}
      <div className="relative flex items-center">
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجوی نام، نقش، نام کاربری یا شماره داخلی..."
          className="w-full bg-[#111110] border border-white/10 rounded-xl py-2.5 px-3 pr-10 pl-9 text-xs text-white placeholder:text-[#70706B] focus:border-[#5DF8D8] focus:shadow-[0_0_12px_rgba(93,248,216,0.2)] outline-none transition-all"
        />
        <span className="material-symbols-outlined text-[18px] text-[#5DF8D8] absolute right-3 pointer-events-none">
          search
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-[#F62477] text-white flex items-center justify-center transition-colors active:scale-90"
            title="پاک کردن جستجو"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              sound.play('tap');
              onSelectFilter(tab.id);
            }}
            className={`py-2 px-3.5 text-xs font-bold whitespace-nowrap transition-all active:scale-95 cyber-chamfer-btn-sm ${
              currentFilter === tab.id
                ? 'bg-[#5DF8D8] text-[#0A2821] shadow-[0_0_14px_rgba(93,248,216,0.4)]'
                : 'bg-[#141413] text-[#8E8E8A] hover:text-white hover:bg-[#1A1A18]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
