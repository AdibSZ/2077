import React, { useState } from 'react';
import { UserProfile, Task } from '../types';
import { db } from '../services/db';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { TaskMetricsBar } from './tasks/TaskMetricsBar';
import { TaskCard } from './tasks/TaskCard';
import { CreateTaskModal } from './tasks/CreateTaskModal';

interface TasksHubProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  tasks: Task[];
  onRefresh: () => void;
}

export const TasksHub: React.FC<TasksHubProps> = ({
  currentUser,
  profiles,
  tasks,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'mine' | 'global' | 'completed' | 'urgent'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const visibleTasks = tasks.filter((t) => {
    const isGlobal = Boolean(t.isGlobal || t.assignedToId === 'ALL');
    const isMine = t.assignedToId === currentUser.id;

    if (!currentUser.isAdmin && !isGlobal && !isMine) return false;

    if (filterType === 'mine') return isMine;
    if (filterType === 'global') return isGlobal;
    if (filterType === 'completed') return t.isCompleted;
    if (filterType === 'urgent') return !t.isCompleted && t.priority === 'فوری';
    return true;
  });

  const myCount = tasks.filter((t) => t.assignedToId === currentUser.id && !t.isCompleted).length;
  const globalCount = tasks.filter((t) => (t.isGlobal || t.assignedToId === 'ALL') && !t.isCompleted).length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const urgentCount = tasks.filter((t) => !t.isCompleted && t.priority === 'فوری').length;

  const handleToggle = (task: Task) => {
    try {
      db.toggleTask(task.id, currentUser);
      if (!task.isCompleted) {
        sound.play('score');
        triggerHaptic('success');
        showToast('وظیفه با موفقیت تکمیل شد.');
      } else {
        sound.play('tap');
        showToast('وظیفه به وضعیت در حال انجام بازگشت.');
      }
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت');
    }
  };

  const handleDelete = (id: string) => {
    try {
      db.deleteTask(id, currentUser);
      sound.play('gameover');
      triggerHaptic('heavy');
      showToast('وظیفه با موفقیت حذف گردید.');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف وظیفه');
    }
  };

  const handleCreateSubmit = (taskData: any) => {
    try {
      db.addTask(taskData, currentUser);
      sound.play('score');
      triggerHaptic('success');
      showToast('وظیفه جدید با موفقیت ابلاغ شد.');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت وظیفه');
    }
  };

  return (
    <div className="flex flex-col gap-4 select-none pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 rounded-xl text-[#5DF8D8] text-xs font-semibold text-center animate-pulse shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Top Header & Admin Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5DF8D8] text-[24px]">task_alt</span>
          <h2 className="text-base font-bold text-white">تابلوی وظایف و تسک‌ها</h2>
        </div>

        {currentUser.isAdmin && (
          <button
            type="button"
            onClick={() => {
              sound.play('tap');
              setIsCreateModalOpen(true);
            }}
            className="py-2.5 px-4 bg-[#5DF8D8] text-[#0A2821] font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(93,248,216,0.35)] hover:brightness-110 active:scale-95 transition-all cyber-chamfer-btn"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>تعریف وظیفه جدید</span>
          </button>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <TaskMetricsBar
        filterType={filterType}
        onSelectFilter={setFilterType}
        myCount={myCount}
        globalCount={globalCount}
        completedCount={completedCount}
        urgentCount={urgentCount}
      />

      {/* Tasks List */}
      <div className="flex flex-col gap-2.5">
        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            currentUser={currentUser}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}

        {visibleTasks.length === 0 && (
          <div className="text-center py-12 text-xs text-[#A3A39E] bg-[#141413] rounded-2xl border border-white/5">
            هیچ وظیفه‌ای در این دسته‌بندی وجود ندارد.
          </div>
        )}
      </div>

      {/* Admin Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        profiles={profiles}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
};
