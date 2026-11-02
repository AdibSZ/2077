import React, { useState, useEffect } from 'react';
import { UserProfile, Announcement, Task } from '../types';
import { calculateAge, formatBirthdate, toPersianDigits } from '../utils/jalali';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { db } from '../services/db';
import { getAssetUrl } from '../utils/assets';

interface StaffOpsHubProps {
  profiles: UserProfile[];
  announcement: Announcement;
  onRefresh: () => void;
  onNavigateToAdmin?: () => void;
}

export const StaffOpsHub: React.FC<StaffOpsHubProps> = ({
  profiles,
  announcement,
  onRefresh,
  onNavigateToAdmin,
}) => {
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Modals & Action Sheets
  const [selectedStaffForTask, setSelectedStaffForTask] = useState<UserProfile | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'عادی' | 'مهم' | 'فوری'>('مهم');

  const [selectedStaffForCall, setSelectedStaffForCall] = useState<UserProfile | null>(null);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<UserProfile | null>(null);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  useEffect(() => {
    setTasks(db.getTasks());
  }, []);

  const refreshTasks = () => {
    setTasks(db.getTasks());
  };

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice(null);
    }, 3500);
  };

  const onlineCount = profiles.filter((p) => p.isOnline).length;
  const filteredProfiles = profiles.filter((p) => {
    if (filterDepartment === 'all') return true;
    if (filterDepartment === 'online') return p.isOnline;
    return p.department === filterDepartment;
  });

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completionRate = tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 100;

  // Task creation handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForTask || !taskTitle.trim()) return;

    db.addTask({
      assignedToId: selectedStaffForTask.id,
      assignedToName: selectedStaffForTask.fullName,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
    });

    sound.play('score');
    triggerHaptic('success');
    showToast(`تسک «${taskTitle}» به ${selectedStaffForTask.fullName} محول شد.`);
    setTaskTitle('');
    setTaskDescription('');
    setSelectedStaffForTask(null);
    refreshTasks();
  };

  const handleToggleTask = (taskId: string) => {
    db.toggleTask(taskId);
    sound.play('tap');
    triggerHaptic('light');
    refreshTasks();
  };

  const handleDeleteTask = (taskId: string) => {
    db.deleteTask(taskId);
    sound.play('gameover');
    refreshTasks();
  };

  // Broadcast Alert handler
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    db.updateAnnouncement('هشدار عملیاتی فوری', broadcastMessage.trim(), 'فوری');
    sound.play('hit');
    triggerHaptic('heavy');
    showToast('سیگنال هشدار فوری در تابلوی اعلانات کلیه پرسنل منتشر شد.');
    setBroadcastMessage('');
    setIsBroadcastModalOpen(false);
    onRefresh();
  };

  return (
    <div className="flex flex-col w-full gap-space-lg select-none pb-12">
      {/* Pinned Neon Store Announcement Banner */}
      <section className="relative overflow-hidden rounded-xl bg-[#141413] border border-[#F62477]/40 shadow-[0_0_20px_rgba(246,36,119,0.22)] p-space-md">
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#F62477]/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 opacity-[0.08] pointer-events-none">
          <img src={getAssetUrl('/brand/logo-magenta.png')} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-start gap-space-md relative z-10">
          <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#F62477]/20 border border-[#F62477]/40 flex items-center justify-center shadow-[0_0_12px_rgba(246,36,119,0.35)] p-1.5">
            <img src={getAssetUrl('/brand/logo-magenta.png')} alt="2077 Icon" className="w-full h-full object-contain drop-shadow-[0_0_6px_#F62477]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-space-xs">
              <span className="font-title-sm text-title-sm text-[#F62477] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#F62477] rounded-full animate-ping"></span>
                {announcement.title}
              </span>
              <span className={`font-tech-micro text-tech-micro px-2 py-0.5 rounded border ${
                announcement.priority === 'فوری'
                  ? 'bg-[#F62477]/20 text-[#F62477] border-[#F62477]/40 animate-pulse'
                  : 'bg-[#242422] text-[#9E9E9C] border-[#F62477]/20'
              }`}>
                // {announcement.priority || 'عادی'}
              </span>
            </div>
            <p className="font-body-md text-body-md text-[#F5F5F5] leading-snug">
              {announcement.content}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar - Dynamic Real Telemetry */}
      <section className="grid grid-cols-3 gap-space-sm">
        <div className="flex flex-col p-space-sm bg-[#141413] border border-[#5DF8D8]/20 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">STAFF.ONLINE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5DF8D8] shadow-[0_0_6px_rgba(93,248,216,0.9)] animate-pulse"></span>
          </div>
          <span className="font-title-sm text-title-sm text-[#5DF8D8] font-bold">
            {toPersianDigits(onlineCount)}/{toPersianDigits(profiles.length)}
          </span>
          <span className="font-body-sm text-body-sm text-[#9E9E9C] truncate">پرسنل آنلاین</span>
        </div>

        <div className="flex flex-col p-space-sm bg-[#141413] border border-[#F62477]/25 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">TASKS.LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F62477] shadow-[0_0_6px_rgba(246,36,119,0.9)]"></span>
          </div>
          <span className="font-title-sm text-title-sm text-[#F62477] font-bold">
            {toPersianDigits(pendingTasks.length)} وظیفه
          </span>
          <span className="font-body-sm text-body-sm text-[#9E9E9C] truncate">وظایف در انتظار</span>
        </div>

        <div className="flex flex-col p-space-sm bg-[#141413] border border-[#5DF8D8]/20 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1">
            <span className="font-tech-micro text-tech-micro text-[#9E9E9C]">COMP.RATE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5DF8D8] shadow-[0_0_6px_rgba(93,248,216,0.9)]"></span>
          </div>
          <span className="font-title-sm text-title-sm text-[#F5F5F5] font-bold">
            {toPersianDigits(completionRate)}٪
          </span>
          <span className="font-body-sm text-body-sm text-[#9E9E9C] truncate">پیشرفت عملیات</span>
        </div>
      </section>

      {/* Floating Action Toast Notice */}
      {toastNotice && (
        <div className="p-3 rounded-lg bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 text-[#5DF8D8] text-xs font-semibold text-center animate-pulse shadow-lg">
          {toastNotice}
        </div>
      )}

      {/* Active Operational Tasks Strip */}
      {tasks.length > 0 && (
        <section className="bg-[#141413] border border-[#5DF8D8]/25 rounded-xl p-space-md flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#252523]">
            <span className="font-title-sm text-xs text-[#5DF8D8] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">checklist</span>
              تابلوی وظایف فروشگاه ({toPersianDigits(pendingTasks.length)} اقدام باز)
            </span>
            <span className="text-[10px] text-[#A3A39E] font-code-md">// DISPATCH_BOARD</span>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {tasks.map((t) => (
              <div
                key={t.id}
                className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                  t.isCompleted
                    ? 'bg-[#10100F] border-[#252523] opacity-60'
                    : 'bg-[#191917] border-[#5DF8D8]/30'
                }`}
              >
                <div
                  onClick={() => handleToggleTask(t.id)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      t.isCompleted ? 'bg-[#5DF8D8] border-[#5DF8D8]' : 'border-[#444440]'
                    }`}
                  >
                    {t.isCompleted && <span className="material-symbols-outlined text-[14px] text-[#0A2821] font-bold">check</span>}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className={`text-xs font-medium truncate ${t.isCompleted ? 'line-through text-[#888884]' : 'text-[#F5F5F5]'}`}>
                      {t.title}
                    </span>
                    <span className="text-[10px] text-[#A3A39E]">
                      مسئول: {t.assignedToName} {t.description && `• ${t.description}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    t.priority === 'فوری'
                      ? 'bg-[#F62477]/20 text-[#F62477]'
                      : t.priority === 'مهم'
                      ? 'bg-[#5DF8D8]/20 text-[#5DF8D8]'
                      : 'bg-[#292926] text-[#A3A39E]'
                  }`}>
                    {t.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="text-[#6B6B67] hover:text-[#F62477] transition-colors p-1"
                    title="حذف تسک"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter & Tactical Search Strip */}
      <div className="flex items-center justify-between px-space-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5DF8D8] text-[18px]">terminal</span>
          <span className="font-title-sm text-title-sm text-[#F5F5F5]">پرسنل و همکاران فروشگاه</span>
          <span className="font-code-md text-code-md text-[#9E9E9C] bg-[#1E1E1C] px-2 py-0.5 rounded text-xs border border-[#5DF8D8]/20">
            {toPersianDigits(filteredProfiles.length)} نفر
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="bg-[#141413] border border-[#5DF8D8]/30 text-[#5DF8D8] font-body-sm text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5DF8D8]"
          >
            <option value="all">همه واحدها</option>
            <option value="online">فقط آنلاین‌ها</option>
            <option value="FRONT-DESK">فروش و ارتباطات</option>
            <option value="CORE-SYS">مدیریت سیستم</option>
            <option value="VAULT">انبار و لجستیک</option>
            <option value="AI-SHOWCASE">هوش مصنوعی</option>
            <option value="ESPORTS">تیم آرکید</option>
          </select>
        </div>
      </div>

      {/* Empty State if only admin */}
      {profiles.length <= 1 && (
        <div className="bg-[#141413] border border-[#5DF8D8]/30 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#5DF8D8]/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="w-16 h-16 rounded-xl bg-[#5DF8D8]/10 border border-[#5DF8D8]/40 flex items-center justify-center p-2.5 shadow-[0_0_15px_rgba(93,248,216,0.3)]">
            <img src={getAssetUrl('/brand/logo-mint.png')} alt="2077 Insignia" className="w-full h-full object-contain drop-shadow-[0_0_8px_#5DF8D8]" />
          </div>
          <h3 className="font-title-sm text-base text-[#F5F5F5] font-bold">
            پرسنل فروشگاه هنوز ثبت نشده‌اند
          </h3>
          <p className="font-body-sm text-xs text-[#9E9E9C] max-w-sm">
            شما با حساب ادمین وارد شده‌اید. برای ثبت نام پرسنل، تعیین شیفت، نام کاربری و تاریخ تولد، وارد تب مدیریت شوید.
          </p>
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="mt-2 py-2 px-4 bg-[#F62477] hover:bg-[#5DF8D8] text-white hover:text-[#0A2821] font-title-sm text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(246,36,119,0.4)] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              <span>ورود به پنل مدیریت پرسنل</span>
            </button>
          )}
        </div>
      )}

      {/* Personnel Cards Grid */}
      <div className="flex flex-col gap-space-md">
        {filteredProfiles.map((person, index) => {
          const calculatedAge = calculateAge(person.birthYear);
          const birthText = formatBirthdate(person.birthDay, person.birthMonth);
          const userTasksCount = tasks.filter((t) => t.assignedToId === person.id && !t.isCompleted).length;

          return (
            <article
              key={person.id}
              className={`relative flex flex-col bg-[#141413] border border-[#5DF8D8]/20 rounded-xl p-space-md shadow-[0_4px_24px_rgba(0,0,0,0.55)] overflow-hidden transition-all ${
                !person.isOnline ? 'opacity-85' : ''
              }`}
            >
              {/* Top Cyber Meta Bar */}
              <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-[#242422]">
                <span className="font-code-md text-code-md text-[#5DF8D8] tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">memory</span>
                  ID: #{toPersianDigits(index + 1).padStart(2, '۰')} // {person.username}
                </span>
                <div className="flex items-center gap-1.5">
                  {userTasksCount > 0 && (
                    <span className="text-[10px] bg-[#F62477]/20 text-[#F62477] px-2 py-0.5 rounded border border-[#F62477]/40 font-bold">
                      {toPersianDigits(userTasksCount)} تسک باز
                    </span>
                  )}
                  <span className="font-tech-micro text-tech-micro text-[#9E9E9C] bg-[#1E1E1C] px-2 py-0.5 rounded border border-[#5DF8D8]/15">
                    {person.department}
                  </span>
                </div>
              </div>

              {/* Main Profile Core */}
              <div
                className="flex items-start gap-space-md cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setSelectedStaffDetail(person)}
              >
                {/* Chamfered Avatar with HUD styling */}
                <div className="relative flex-shrink-0 w-20 h-20 bg-[#1E1E1C] rounded-xl overflow-hidden border border-[#5DF8D8]/30 shadow-[0_0_12px_rgba(93,248,216,0.2)]">
                  <img
                    className="w-full h-full object-cover"
                    src={getAssetUrl(person.avatarUrl)}
                    alt={person.fullName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAssetUrl('/avatars/avatar1.svg');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0C] via-transparent to-transparent opacity-60"></div>
                  <div className="absolute top-1 right-1 font-tech-micro text-tech-micro bg-[#0D0D0C]/80 text-[#5DF8D8] px-1 rounded">
                    {person.isOnline ? 'SYS' : 'OFFLINE'}
                  </div>
                </div>

                {/* Info & Badges */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-md text-headline-md text-[#F5F5F5] font-bold truncate">
                      {person.fullName}
                    </h3>
                    <span className="font-code-md text-code-md px-2 py-0.5 rounded bg-[#F62477]/20 border border-[#F62477]/40 text-[#F62477] font-bold shadow-[0_0_8px_rgba(246,36,119,0.3)]">
                      {toPersianDigits(calculatedAge)} ساله
                    </span>
                  </div>

                  {/* Role Badge */}
                  <div className="flex items-center">
                    <span className="font-code-md text-code-md bg-[#F62477] text-white font-bold px-2 py-0.5 rounded shadow-[0_0_10px_rgba(246,36,119,0.4)] truncate">
                      {person.roleTitle}
                    </span>
                  </div>

                  {/* Metadata & Status */}
                  <div className="flex items-center justify-between pt-1 font-body-sm text-body-sm text-[#9E9E9C]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-[#9E9E9C]">cake</span>
                      تولد: {birthText}
                    </span>

                    {person.isOnline ? (
                      <span className="flex items-center gap-1.5 text-[#5DF8D8] font-semibold bg-[#5DF8D8]/10 px-2 py-0.5 rounded border border-[#5DF8D8]/20">
                        <span className="w-2 h-2 rounded-full bg-[#5DF8D8] shadow-[0_0_6px_#5DF8D8] animate-pulse"></span>
                        حاضر در فروشگاه
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[#9E9E9C] bg-[#1E1E1C] px-2 py-0.5 rounded">
                        <span className="w-2 h-2 rounded-full bg-[#9E9E9C]/50"></span>
                        آفلاین ({person.shiftName})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-space-xs mt-space-md pt-space-sm border-t border-[#242422]">
                <button
                  onClick={() => {
                    sound.play('tap');
                    setSelectedStaffForCall(person);
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#1E1E1C] border border-transparent hover:border-[#5DF8D8]/40 text-[#F5F5F5] font-body-sm text-xs hover:bg-[#5DF8D8]/15 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#5DF8D8]">call</span>
                  <span>تماس سریع</span>
                </button>

                <button
                  onClick={() => {
                    sound.play('tap');
                    setSelectedStaffForTask(person);
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#1E1E1C] border border-transparent hover:border-[#F62477]/40 text-[#F5F5F5] font-body-sm text-xs hover:bg-[#F62477]/15 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#F62477]">
                    assignment_add
                  </span>
                  <span>تخصیص تسک</span>
                </button>

                <div className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#1E1E1C] border border-transparent text-[#F5F5F5] font-body-sm text-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#5DF8D8]">military_tech</span>
                  <span>{toPersianDigits(person.totalCp)} CP</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Operational Broadcast Alert Trigger Button */}
      <div className="mt-space-sm mb-space-md flex flex-col gap-2">
        <button
          onClick={() => {
            sound.play('hit');
            triggerHaptic('heavy');
            setIsBroadcastModalOpen(true);
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-[#F62477] text-white font-headline-md text-headline-md font-extrabold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(246,36,119,0.5)] active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-[24px]">sensors</span>
          <span>ارسال هشدار فوری به کلیه پرسنل</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: TASK ASSIGNMENT MODAL */}
      {/* ============================================================= */}
      {selectedStaffForTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141413] border border-[#5DF8D8]/50 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-right [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
            <div className="flex items-center justify-between border-b border-[#252523] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">assignment</span>
                <h3 className="font-title-sm text-sm text-[#F5F5F5] font-bold">
                  تخصیص تسک به {selectedStaffForTask.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStaffForTask(null)}
                className="text-[#9E9E9C] hover:text-[#F62477]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">عنوان وظیفه:</label>
                <input
                  required
                  placeholder="مثال: تست مانیتور گیمینگ استند ۳"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">توضیحات (اختیاری):</label>
                <textarea
                  rows={2}
                  placeholder="جزئیات تسک یا مهلت انجام..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#A3A39E]">سطح اولویت:</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                >
                  <option value="عادی">عادی</option>
                  <option value="مهم">مهم</option>
                  <option value="فوری">فوری</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs active:scale-95 transition-transform"
                >
                  ثبت و ارجاع تسک
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStaffForTask(null)}
                  className="px-4 py-2.5 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: DIRECT CONTACT ACTION SHEET */}
      {/* ============================================================= */}
      {selectedStaffForCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141413] border border-[#5DF8D8]/50 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-center [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
            <div className="w-14 h-14 rounded-full bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 flex items-center justify-center mx-auto text-[#5DF8D8]">
              <span className="material-symbols-outlined text-[30px]">contact_phone</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#F5F5F5]">{selectedStaffForCall.fullName}</h3>
              <p className="text-xs text-[#5DF8D8] mt-1">{selectedStaffForCall.roleTitle}</p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {selectedStaffForCall.phoneNumber ? (
                <>
                  <a
                    href={`tel:${selectedStaffForCall.phoneNumber}`}
                    className="py-2.5 px-4 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(93,248,216,0.3)] active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    <span>تماس مستقیم تلفنی ({selectedStaffForCall.phoneNumber})</span>
                  </a>

                  <a
                    href={`sms:${selectedStaffForCall.phoneNumber}`}
                    className="py-2.5 px-4 bg-[#232321] text-[#F5F5F5] border border-white/10 rounded-lg text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">sms</span>
                    <span>ارسال پیامک SMS</span>
                  </a>
                </>
              ) : (
                <div className="p-3 bg-[#232321] border border-white/10 rounded-lg text-xs text-[#A3A39E] leading-relaxed">
                  شماره همراه برای این همکار ثبت نشده است. می‌توانید شماره داخلی را بررسی کنید یا از طریق ادمین آن را اضافه نمایید.
                </div>
              )}

              {selectedStaffForCall.internalExt && (
                <div className="py-2 px-3 bg-[#0E0E0D] border border-[#5DF8D8]/20 rounded-lg text-xs text-[#5DF8D8] font-code-md">
                  شماره داخلی فروشگاه: <strong>{selectedStaffForCall.internalExt}</strong>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedStaffForCall(null)}
              className="mt-1 py-2 bg-[#1C1C1B] text-[#9E9E9C] hover:text-white rounded-lg text-xs"
            >
              بستن پنجره
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: EMERGENCY BROADCAST ALERT MODAL */}
      {/* ============================================================= */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141413] border border-[#F62477]/60 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-right [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
            <div className="flex items-center justify-between border-b border-[#252523] pb-2">
              <div className="flex items-center gap-2 text-[#F62477]">
                <span className="material-symbols-outlined text-[24px] animate-pulse">crisis_alert</span>
                <h3 className="font-title-sm text-sm font-bold">
                  ارسال پیام هشدار فوری به کلیه پرسنل
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-[#9E9E9C] hover:text-[#F62477]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-[#A3A39E] leading-relaxed">
              این هشدار فوراً در بنر سرخابی بالای اپلیکیشن برای کلیه پرسنل قرار گرفته و با صدای آلارم پخش خواهد شد.
            </p>

            <form onSubmit={handleSendBroadcast} className="flex flex-col gap-3">
              <textarea
                required
                rows={3}
                placeholder="متن هشدار یا دستور فوری عملیات..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-[#0E0E0D] border border-[#F62477]/40 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#F62477]"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F62477] text-white font-bold rounded-lg text-xs shadow-[0_0_15px_rgba(246,36,119,0.5)] active:scale-95 transition-transform"
                >
                  ارسال و پخش سراسری هشدار
                </button>
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2.5 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: STAFF DETAIL PERSONNEL FILE */}
      {/* ============================================================= */}
      {selectedStaffDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141413] border border-[#5DF8D8]/50 rounded-xl p-5 shadow-2xl flex flex-col gap-3.5 text-right [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
            <div className="flex items-center justify-between border-b border-[#252523] pb-2">
              <span className="text-xs font-code-md text-[#5DF8D8]">// PERSONNEL_DOSSIER</span>
              <button
                onClick={() => setSelectedStaffDetail(null)}
                className="text-[#9E9E9C] hover:text-[#F62477]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#5DF8D8]/40 shrink-0">
                <img
                  src={getAssetUrl(selectedStaffDetail.avatarUrl)}
                  alt={selectedStaffDetail.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getAssetUrl('/avatars/avatar1.svg');
                  }}
                />
              </div>
              <div className="flex flex-col truncate">
                <h3 className="text-base font-bold text-[#F5F5F5] truncate">
                  {selectedStaffDetail.fullName}
                </h3>
                <span className="text-xs text-[#F62477] font-semibold truncate">
                  {selectedStaffDetail.roleTitle}
                </span>
                <span className="text-[10px] text-[#A3A39E] font-code-md">
                  @{selectedStaffDetail.username}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-2 border-y border-[#252523] text-xs">
              <div className="flex justify-between items-center text-[#A3A39E]">
                <span>واحد سازمانی:</span>
                <span className="text-[#F5F5F5] font-semibold">{selectedStaffDetail.department}</span>
              </div>
              <div className="flex justify-between items-center text-[#A3A39E]">
                <span>شیفت کاری:</span>
                <span className="text-[#5DF8D8] font-semibold">{selectedStaffDetail.shiftName}</span>
              </div>
              <div className="flex justify-between items-center text-[#A3A39E]">
                <span>سن و تاریخ تولد:</span>
                <span className="text-[#F5F5F5]">
                  {toPersianDigits(calculateAge(selectedStaffDetail.birthYear))} ساله ({formatBirthdate(selectedStaffDetail.birthDay, selectedStaffDetail.birthMonth)})
                </span>
              </div>
              <div className="flex justify-between items-center text-[#A3A39E]">
                <span>امتیاز آرکید و افتخارات:</span>
                <span className="text-[#5DF8D8] font-code-md font-bold">
                  {toPersianDigits(selectedStaffDetail.totalCp)} CP | 👑 {toPersianDigits(selectedStaffDetail.crownsCount)}
                </span>
              </div>
              {selectedStaffDetail.phoneNumber && (
                <div className="flex justify-between items-center text-[#A3A39E]">
                  <span>شماره تماس:</span>
                  <span className="text-[#F5F5F5] font-code-md">{selectedStaffDetail.phoneNumber}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedStaffDetail(null)}
              className="py-2 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs active:scale-95 transition-all text-center"
            >
              بستن پرونده
            </button>
          </div>
        </div>
      )}
    </div>
  );
};