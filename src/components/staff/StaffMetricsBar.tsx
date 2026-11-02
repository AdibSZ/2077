import React from 'react';
import { toPersianDigits } from '../../utils/jalali';

interface StaffMetricsBarProps {
  onlineCount: number;
  totalStaff: number;
  pendingTasksCount: number;
  onNavigateToTasks?: () => void;
}

export const StaffMetricsBar: React.FC<StaffMetricsBarProps> = ({
  onlineCount,
  totalStaff,
  pendingTasksCount,
  onNavigateToTasks,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-[#141413] border border-[#5DF8D8]/20 p-2.5 rounded-xl text-center">
        <span className="text-[10px] text-[#A3A39E] block mb-0.5">پرسنل آنلاین</span>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5DF8D8] animate-pulse" />
          <span className="text-sm font-bold text-[#5DF8D8]">
            {toPersianDigits(onlineCount)} / {toPersianDigits(totalStaff)}
          </span>
        </div>
      </div>

      <div className="bg-[#141413] border border-white/10 p-2.5 rounded-xl text-center">
        <span className="text-[10px] text-[#A3A39E] block mb-0.5">کل پرسنل ثبت شده</span>
        <span className="text-sm font-bold text-white">
          {toPersianDigits(totalStaff)} نفر
        </span>
      </div>

      <button
        type="button"
        onClick={onNavigateToTasks}
        className="bg-[#141413] border border-[#F62477]/30 p-2.5 rounded-xl text-center hover:bg-[#F62477]/10 transition-colors"
      >
        <span className="text-[10px] text-[#A3A39E] block mb-0.5">وظایف در انتظار</span>
        <span className="text-sm font-bold text-[#F62477]">
          {toPersianDigits(pendingTasksCount)} مورد
        </span>
      </button>
    </div>
  );
};
