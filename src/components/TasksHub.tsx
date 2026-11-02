import React, { useState } from 'react';
import { UserProfile, Task } from '../types';
import { db } from '../services/db';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { toPersianDigits } from '../utils/jalali';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [targetAssigneeId, setTargetAssigneeId] = useState<'ALL' | string>('ALL');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'عادی' | 'مهم' | 'فوری'>('مهم');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter tasks based on role:
  // - Regular users ONLY see global tasks + tasks assigned to themselves
  // - Admins see all tasks
  const visibleTasks = tasks.filter((t) => {
    const isGlobal = Boolean(t.isGlobal || t.assignedToId === 'ALL');
    const isMine = t.assignedToId === currentUser.id;

    if (!currentUser.isAdmin) {
      if (!isGlobal && !isMine) return false;
    }

    if (filterType === 'mine') return isMine;
    if (filterType === 'global') return isGlobal;
    if (filterType === 'completed') return t.isCompleted;
    if (filterType === 'urgent') return !t.isCompleted && t.priority === 'فوری';
    return true;
  });

  const myTasksCount = tasks.filter((t) => t.assignedToId === currentUser.id && !t.isCompleted).length;
  const globalTasksCount = tasks.filter((t) => (t.isGlobal || t.assignedToId === 'ALL') && !t.isCompleted).length;
  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const urgentTasksCount = tasks.filter((t) => !t.isCompleted && t.priority === 'فوری').length;

  const handleToggleTask = (task: Task) => {
    const isGlobal = Boolean(task.isGlobal || task.assignedToId === 'ALL');

    // Permissions check
    if (isGlobal && !currentUser.isAdmin) {
      sound.play('gameover');
      triggerHaptic('error');
      showToast('خطا: تسک‌های همگانی فقط توسط مدیران سیستم قابل تایید و تیک زدن هستند.');
      return;
    }

    if (!isGlobal && !currentUser.isAdmin && task.assignedToId !== currentUser.id) {
      sound.play('gameover');
      triggerHaptic('error');
      showToast('خطا: شما فقط مجاز به تغییر وضعیت تسک‌های محوله به خود هستید.');
      return;
    }

    try {
      db.toggleTask(task.id, currentUser);
      if (!task.isCompleted) {
        sound.play('score');
        triggerHaptic('success');
        showToast('وظیفه با موفقیت تیک خورد و تکمیل شد.');
      } else {
        sound.play('tap');
        triggerHaptic('light');
        showToast('وضعیت وظیفه به حالت جاری (در انتظار انجام) بازگردانده شد.');
      }
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت تسک');
    }
  };

  const handleDeleteTask = (id: string) => {
    if (!currentUser.isAdmin) {
      showToast('فقط مدیران سیستم مجاز به حذف تسک‌ها هستند.');
      return;
    }

    try {
      db.deleteTask(id, currentUser);
      sound.play('gameover');
      triggerHaptic('heavy');
      showToast('وظیفه از تابلوی سیستم حذف گردید.');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف وظیفه');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser.isAdmin) {
      showToast('فقط مدیران سیستم مجاز به تعریف وظیفه هستند.');
      return;
    }

    if (!taskTitle.trim()) {
      showToast('لطفاً عنوان وظیفه را وارد نمایید.');
      return;
    }

    const isGlobal = targetAssigneeId === 'ALL';
    let assignedToName = 'عمومی // کلیه پرسنل';
    if (!isGlobal) {
      const targetUser = profiles.find((p) => p.id === targetAssigneeId);
      if (targetUser) {
        assignedToName = targetUser.fullName;
      }
    }

    try {
      db.addTask(
        {
          assignedToId: isGlobal ? 'ALL' : targetAssigneeId,
          assignedToName,
          title: taskTitle.trim(),
          description: taskDescription.trim(),
          priority: taskPriority,
          isGlobal,
        },
        currentUser
      );

      sound.play('score');
      triggerHaptic('success');
      showToast(
        isGlobal
          ? 'تسک همگانی با موفقیت برای کلیه پرسنل تعریف و منتشر شد.'
          : `تسک با موفقیت به «${assignedToName}» تخصیص داده شد.`
      );

      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('مهم');
      setTargetAssigneeId('ALL');
      setIsCreateModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت وظیفه');
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-md select-none pb-12">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-[#5DF8D8]/20 border border-[#5DF8D8]/50 text-[#5DF8D8] text-xs font-bold text-center animate-pulse shadow-lg sticky top-24 z-40 backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* Top Banner & Stats Overview */}
      <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#252523] pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5DF8D8] text-[22px]">checklist</span>
            <div className="flex flex-col">
              <h2 className="font-title-sm text-base text-[#F5F5F5] font-bold">
                تابلوی فرماندهی وظایف و تسک‌ها
              </h2>
              <span className="font-tech-micro text-[10px] text-[#5DF8D8]">
                SYS.2077 // OPERATIONAL DISPATCH BOARD
              </span>
            </div>
          </div>

          {/* Admin Add Task Trigger Button */}
          {currentUser.isAdmin && (
            <button
              onClick={() => {
                sound.play('tap');
                setIsCreateModalOpen(true);
              }}
              className="py-2 px-3 bg-[#5DF8D8] hover:bg-[#46deb9] text-[#0A2821] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(93,248,216,0.35)] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_task</span>
              <span>+ تعریف وظیفه جدید</span>
            </button>
          )}
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div
            onClick={() => setFilterType('global')}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              filterType === 'global'
                ? 'bg-[#5DF8D8]/20 border-[#5DF8D8] text-[#5DF8D8]'
                : 'bg-[#0E0E0D] border-white/5 text-[#A3A39E] hover:border-[#5DF8D8]/30'
            }`}
          >
            <span className="text-[10px] block">همگانی</span>
            <span className="font-code-md text-sm font-bold text-[#5DF8D8]">
              {toPersianDigits(globalTasksCount)}
            </span>
          </div>

          <div
            onClick={() => setFilterType('mine')}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              filterType === 'mine'
                ? 'bg-[#5DF8D8]/20 border-[#5DF8D8] text-[#5DF8D8]'
                : 'bg-[#0E0E0D] border-white/5 text-[#A3A39E] hover:border-[#5DF8D8]/30'
            }`}
          >
            <span className="text-[10px] block">وظایف من</span>
            <span className="font-code-md text-sm font-bold text-[#F5F5F5]">
              {toPersianDigits(myTasksCount)}
            </span>
          </div>

          <div
            onClick={() => setFilterType('urgent')}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              filterType === 'urgent'
                ? 'bg-[#F62477]/20 border-[#F62477] text-[#F62477]'
                : 'bg-[#0E0E0D] border-white/5 text-[#A3A39E] hover:border-[#F62477]/30'
            }`}
          >
            <span className="text-[10px] block">فوری</span>
            <span className="font-code-md text-sm font-bold text-[#F62477]">
              {toPersianDigits(urgentTasksCount)}
            </span>
          </div>

          <div
            onClick={() => setFilterType('completed')}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              filterType === 'completed'
                ? 'bg-[#5DF8D8]/20 border-[#5DF8D8] text-[#5DF8D8]'
                : 'bg-[#0E0E0D] border-white/5 text-[#A3A39E] hover:border-[#5DF8D8]/30'
            }`}
          >
            <span className="text-[10px] block">انجام‌شده</span>
            <span className="font-code-md text-sm font-bold text-[#8E8E8A]">
              {toPersianDigits(completedTasksCount)}
            </span>
          </div>
        </div>
      </section>

      {/* Filter Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
        {[
          { key: 'all', label: 'همه وظایف' },
          { key: 'global', label: `همگانی (${toPersianDigits(globalTasksCount)})` },
          { key: 'mine', label: `محوله به من (${toPersianDigits(myTasksCount)})` },
          { key: 'urgent', label: `فوری (${toPersianDigits(urgentTasksCount)})` },
          { key: 'completed', label: `انجام‌شده (${toPersianDigits(completedTasksCount)})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilterType(tab.key as any);
              sound.play('tap');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all border ${
              filterType === tab.key
                ? 'bg-[#5DF8D8] text-[#0A2821] border-[#5DF8D8] shadow-[0_0_10px_rgba(93,248,216,0.3)]'
                : 'bg-[#181816] text-[#A3A39E] border-[#2A2A28] hover:text-[#F5F5F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="flex flex-col gap-2.5">
        {visibleTasks.length === 0 ? (
          <div className="p-12 bg-[#141413] border border-[#252523] rounded-xl text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl text-[#5DF8D8]/30">task_alt</span>
            <span className="text-xs text-[#A3A39E]">
              {filterType === 'all'
                ? 'هیچ وظیفه‌ای در این دسته‌بندی ثبت نشده است.'
                : 'در این فیلتر موردی یافت نشد.'}
            </span>
          </div>
        ) : (
          visibleTasks.map((task) => {
            const isGlobal = Boolean(task.isGlobal || task.assignedToId === 'ALL');
            const isMine = task.assignedToId === currentUser.id;
            const canToggle = currentUser.isAdmin || (!isGlobal && isMine);

            return (
              <div
                key={task.id}
                className={`relative p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                  task.isCompleted
                    ? 'bg-[#10100F] border-[#222220] opacity-65'
                    : isGlobal
                    ? 'bg-[#151513] border-[#5DF8D8]/40 shadow-[0_0_12px_rgba(93,248,216,0.1)]'
                    : isMine
                    ? 'bg-[#171715] border-[#F62477]/40 shadow-[0_0_12px_rgba(246,36,119,0.12)]'
                    : 'bg-[#141413] border-[#282826]'
                }`}
              >
                {/* Header Row: Target badge, Priority, Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Target Assignee Badge */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                        isGlobal
                          ? 'bg-[#5DF8D8]/20 text-[#5DF8D8] border border-[#5DF8D8]/40'
                          : isMine
                          ? 'bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40'
                          : 'bg-[#252523] text-[#F5F5F5] border border-white/10'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isGlobal ? 'public' : 'person'}
                      </span>
                      <span>{isGlobal ? 'تسک همگانی (کلیه پرسنل)' : task.assignedToName}</span>
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        task.priority === 'فوری'
                          ? 'bg-[#F62477] text-white shadow-[0_0_6px_#F62477]'
                          : task.priority === 'مهم'
                          ? 'bg-[#5DF8D8]/20 text-[#5DF8D8]'
                          : 'bg-[#242422] text-[#9E9E9C]'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {/* Admin Delete Action */}
                  {currentUser.isAdmin && (
                    <button
                      onClick={() => setDeleteConfirmId(task.id)}
                      className="text-[#6E6E6A] hover:text-[#F62477] transition-colors p-1"
                      title="حذف تسک"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete_forever</span>
                    </button>
                  )}
                </div>

                {/* Main Task Row: Checkbox + Title */}
                <div className="flex items-start gap-3 pt-1">
                  {/* Interactive Checkbox */}
                  <button
                    type="button"
                    disabled={!canToggle}
                    onClick={() => handleToggleTask(task)}
                    title={
                      !canToggle
                        ? 'تسک همگانی فقط توسط مدیران سیستم تایید و تکمیل می‌شود'
                        : task.isCompleted
                        ? 'علامت‌گذاری به عنوان در حال انجام'
                        : 'تکمیل وظیفه'
                    }
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      task.isCompleted
                        ? 'bg-[#5DF8D8] border-[#5DF8D8] text-[#0A2821] shadow-[0_0_8px_#5DF8D8]'
                        : canToggle
                        ? 'border-[#5DF8D8]/50 hover:border-[#5DF8D8] bg-[#0E0E0D] cursor-pointer'
                        : 'border-[#333330] bg-[#1A1A18] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {task.isCompleted ? (
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    ) : !canToggle ? (
                      <span className="material-symbols-outlined text-[13px] text-[#6E6E6A]">lock</span>
                    ) : null}
                  </button>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      className={`text-sm font-bold leading-snug ${
                        task.isCompleted ? 'line-through text-[#7A7A75]' : 'text-[#F5F5F5]'
                      }`}
                    >
                      {task.title}
                    </span>

                    {task.description && (
                      <p className="text-xs text-[#9E9E9C] mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[10px] text-[#6E6E6A] pt-1 border-t border-[#222220]">
                  <span>
                    ثبت شده در: {new Date(task.createdAt).toLocaleDateString('fa-IR')}
                    {task.createdByName && ` توسط ${task.createdByName}`}
                  </span>

                  {task.isCompleted && (
                    <span className="text-[#5DF8D8] font-bold">
                      ✓ تکمیل شده {task.completedByName && `توسط ${task.completedByName}`}
                    </span>
                  )}
                  {!task.isCompleted && isGlobal && !currentUser.isAdmin && (
                    <span className="text-[#A3A39E]">تایید تسک فقط توسط مدیران</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL: CREATE TASK (Admin Only) */}
      {/* ================================================================= */}
      {isCreateModalOpen && currentUser.isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141413] border border-[#5DF8D8]/50 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-right [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
            <div className="flex items-center justify-between border-b border-[#252523] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">add_task</span>
                <h3 className="font-title-sm text-sm text-[#F5F5F5] font-bold">
                  تعریف و ارجاع وظیفه جدید
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9E9E9C] hover:text-[#F62477]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              {/* Target Assignee Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">ارجاع وظیفه به:</label>
                <select
                  value={targetAssigneeId}
                  onChange={(e) => setTargetAssigneeId(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                >
                  <option value="ALL">📢 تسک همگانی (ارسال به کلیه پرسنل)</option>
                  <optgroup label="پرسنل انفرادی:">
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        👤 {p.fullName} ({p.roleTitle})
                      </option>
                    ))}
                  </optgroup>
                </select>
                {targetAssigneeId === 'ALL' && (
                  <span className="text-[10px] text-[#5DF8D8]">
                    نکته: تسک همگانی برای کلیه پرسنل نمایش داده می‌شود و فقط توسط مدیران تیک می‌خورد.
                  </span>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">عنوان وظیفه:</label>
                <input
                  required
                  placeholder="مثال: بازبینی چیدمان ویترین فروشگاه"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">توضیحات تکمیلی (اختیاری):</label>
                <textarea
                  rows={2}
                  placeholder="جزئیات، ساعت تحویل یا مهلت انجام وظیفه..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8] leading-relaxed"
                />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">سطح اولویت:</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                >
                  <option value="عادی">عادی</option>
                  <option value="مهم">مهم</option>
                  <option value="فوری">فوری (هشدار با اولویت بالا)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs active:scale-95 transition-transform shadow-[0_0_12px_rgba(93,248,216,0.3)]"
                >
                  ثبت و انتشار وظیفه
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs hover:bg-[#32322F]"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141413] border border-[#F62477]/60 rounded-xl p-5 shadow-2xl flex flex-col gap-3 text-center">
            <span className="material-symbols-outlined text-4xl text-[#F62477] mx-auto animate-bounce">
              warning
            </span>
            <h4 className="text-sm font-bold text-[#F5F5F5]">آیا از حذف این وظیفه اطمینان دارید؟</h4>
            <p className="text-xs text-[#9E9E9C]">این اقدام برگشت‌پذیر نیست و وظیفه از تابلوی همه حذف خواهد شد.</p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleDeleteTask(deleteConfirmId)}
                className="flex-1 py-2 bg-[#F62477] text-white font-bold rounded-lg text-xs active:scale-95 transition-all shadow-[0_0_10px_rgba(246,36,119,0.3)]"
              >
                بله، حذف کن
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs hover:bg-[#32322F]"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
