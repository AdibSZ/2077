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

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجوی نام، نقش، نام کاربری یا شماره داخلی..."
          className="w-full bg-[#141413] border border-white/10 rounded-xl py-2 px-3 pr-9 text-xs text-white placeholder:text-[#A3A39E] focus:border-[#5DF8D8] outline-none"
        />
        <span className="material-symbols-outlined text-[18px] text-[#A3A39E] absolute right-2.5 top-2.5">
          search
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              sound.play('tap');
              onSelectFilter(tab.id);
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              currentFilter === tab.id
                ? 'bg-[#5DF8D8] text-[#0A2821] font-bold shadow-[0_0_10px_rgba(93,248,216,0.3)]'
                : 'bg-[#141413] text-[#A3A39E] hover:text-white border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
