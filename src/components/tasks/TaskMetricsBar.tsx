import React from 'react';
import { toPersianDigits } from '../../utils/jalali';
import { sound } from '../../utils/audio';

interface TaskMetricsBarProps {
  filterType: 'all' | 'mine' | 'global' | 'completed' | 'urgent';
  onSelectFilter: (f: 'all' | 'mine' | 'global' | 'completed' | 'urgent') => void;
  myCount: number;
  globalCount: number;
  completedCount: number;
  urgentCount: number;
}

export const TaskMetricsBar: React.FC<TaskMetricsBarProps> = ({
  filterType,
  onSelectFilter,
  myCount,
  globalCount,
  completedCount,
  urgentCount,
}) => {
  const tabs = [
    { id: 'all' as const, label: 'همه', count: myCount + globalCount },
    { id: 'mine' as const, label: 'وظایف من', count: myCount, highlight: true },
    { id: 'global' as const, label: 'همگانی', count: globalCount },
    { id: 'urgent' as const, label: 'فوری', count: urgentCount, urgent: true },
    { id: 'completed' as const, label: 'انجام‌شده', count: completedCount },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            sound.play('tap');
            onSelectFilter(tab.id);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            filterType === tab.id
              ? 'bg-[#5DF8D8] text-[#0A2821] font-bold shadow-[0_0_12px_rgba(93,248,216,0.3)]'
              : 'bg-[#141413] text-[#A3A39E] hover:text-white border border-white/5'
          }`}
        >
          <span>{tab.label}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              filterType === tab.id
                ? 'bg-[#0A2821]/20 text-[#0A2821]'
                : tab.urgent && tab.count > 0
                ? 'bg-[#F62477] text-white'
                : 'bg-white/10 text-white'
            }`}
          >
            {toPersianDigits(tab.count)}
          </span>
        </button>
      ))}
    </div>
  );
};
