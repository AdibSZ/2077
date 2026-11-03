import React from 'react';
import { Task, UserProfile } from '../../types';

interface TaskCardProps {
  task: Task;
  currentUser: UserProfile;
  onToggle: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  currentUser,
  onToggle,
  onDelete,
}) => {
  const isGlobal = Boolean(task.isGlobal || task.assignedToId === 'ALL');
  const canToggle = currentUser.isAdmin || (!isGlobal && task.assignedToId === currentUser.id);

  return (
    <div
      className={`p-3.5 border transition-all flex flex-col gap-2.5 cyber-chamfer-card-single ${
        task.isCompleted
          ? 'bg-[#121211]/60 border-white/5 opacity-70'
          : task.priority === 'فوری'
          ? 'bg-[#121211] border-[#F62477]/50 shadow-[0_0_20px_rgba(246,36,119,0.2)]'
          : 'bg-[#121211] border-white/10 hover:border-[#5DF8D8]/40 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Custom Cyber Checkbox */}
          <button
            type="button"
            onClick={() => onToggle(task)}
            disabled={!canToggle}
            className={`w-6 h-6 border flex items-center justify-center shrink-0 mt-0.5 transition-all cyber-chamfer-btn-sm ${
              task.isCompleted
                ? 'bg-[#5DF8D8] border-[#5DF8D8] text-[#0A2821] shadow-[0_0_8px_#5DF8D8]'
                : canToggle
                ? 'border-white/30 hover:border-[#5DF8D8] bg-[#070706]'
                : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'
            }`}
            title={
              !canToggle
                ? isGlobal
                  ? 'تسک همگانی فقط توسط مدیران تیک می‌خورد'
                  : 'این تسک به پرسنل دیگری محول شده است'
                : 'تغییر وضعیت تسک'
            }
          >
            {task.isCompleted && (
              <span className="material-symbols-outlined text-[16px] font-black">check</span>
            )}
          </button>

          <div className="flex flex-col text-right min-w-0">
            <h4
              className={`text-xs font-bold leading-snug ${
                task.isCompleted ? 'text-[#A3A39E] line-through' : 'text-white'
              }`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-[11px] text-[#A3A39E] mt-1 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <span
          className={`text-[10px] px-2 py-0.5 font-bold shrink-0 font-mono cyber-chamfer-btn-sm ${
            task.priority === 'فوری'
              ? 'bg-[#F62477] text-white shadow-[0_0_10px_rgba(246,36,119,0.4)]'
              : task.priority === 'مهم'
              ? 'bg-[#5DF8D8] text-[#0A2821] shadow-[0_0_8px_rgba(93,248,216,0.3)]'
              : 'bg-white/10 text-[#A3A39E] border border-white/10'
          }`}
        >
          {task.priority}
        </span>
      </div>

      {/* Meta Footer */}
      <div className="flex items-center justify-between text-[10px] text-[#A3A39E] pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#5DF8D8]">
              {isGlobal ? 'public' : 'person'}
            </span>
            <span>{isGlobal ? 'همگانی' : task.assignedToName}</span>
          </span>
          {task.isCompleted && task.completedByName && (
            <span>• تایید توسط: {task.completedByName}</span>
          )}
        </div>

        {currentUser.isAdmin && (
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="text-gray-500 hover:text-[#F62477] transition-colors p-1"
            title="حذف وظیفه (مدیر)"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        )}
      </div>
    </div>
  );
};
