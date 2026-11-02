import React, { useState, useEffect } from 'react';
import { UserProfile, DatabaseStats } from '../types';
import { db } from '../services/db';
import { PERSIAN_MONTHS, getMonthNumber, toPersianDigits } from '../utils/jalali';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';

interface AdminPanelProps {
  profiles: UserProfile[];
  onRefresh: () => void;
}

const AVATAR_PRESETS = [
  '/brand/logo-magenta.png',
  '/brand/logo-mint.png',
  '/brand/logo-white.png',
  '/avatars/admin.svg',
  '/avatars/avatar1.svg',
  '/avatars/avatar2.svg',
  '/avatars/avatar3.svg',
  '/avatars/avatar4.svg',
  '/avatars/avatar5.svg',
  '/avatars/avatar6.svg',
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ profiles, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'announcement' | 'database'>('staff');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Staff Form states
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('متخصص فروش // FIXER');
  const [department, setDepartment] = useState('FRONT-DESK');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [birthDay, setBirthDay] = useState(19);
  const [birthMonth, setBirthMonth] = useState('خرداد');
  const [birthYear, setBirthYear] = useState(1383);
  const [shiftName, setShiftName] = useState('شیفت روز');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [internalExt, setInternalExt] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Announcement states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('عادی');

  // Database states
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [rawTableViewer, setRawTableViewer] = useState<'none' | 'profiles' | 'scores' | 'tasks'>('none');

  // Custom modal dialog states (replaces browser confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    // Load announcements
    const currentAnn = db.getAnnouncement();
    setAnnTitle(currentAnn.title);
    setAnnContent(currentAnn.content);
    setAnnPriority(currentAnn.priority || 'عادی');

    // Load database stats
    refreshDbStats();
  }, []);

  const refreshDbStats = () => {
    const stats = db.getDatabaseStats();
    setDbStats(stats);
    const cfg = db.getSupabaseConfig();
    setSupabaseUrlInput(cfg.url);
    setSupabaseKeyInput(cfg.anonKey);
  };

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice(null);
    }, 4000);
  };

  const resetStaffForm = () => {
    setEditingId(null);
    setFullName('');
    setRoleTitle('متخصص فروش // FIXER');
    setDepartment('FRONT-DESK');
    setUsername('');
    setPassword('');
    setAvatarUrl(AVATAR_PRESETS[0]);
    setBirthDay(19);
    setBirthMonth('خرداد');
    setBirthYear(1383);
    setShiftName('شیفت روز');
    setPhoneNumber('');
    setInternalExt('');
    setIsAdminUser(false);
    setIsFormOpen(false);
  };

  const handleEdit = (person: UserProfile) => {
    setEditingId(person.id);
    setFullName(person.fullName);
    setRoleTitle(person.roleTitle);
    setDepartment(person.department);
    setUsername(person.username);
    setPassword(person.passwordHash);
    setAvatarUrl(person.avatarUrl);
    setBirthDay(person.birthDay);
    setBirthMonth(person.birthMonth);
    setBirthYear(person.birthYear);
    setShiftName(person.shiftName);
    setPhoneNumber(person.phoneNumber || '');
    setInternalExt(person.internalExt || '');
    setIsAdminUser(person.isAdmin);
    setIsFormOpen(true);
    sound.play('tap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestDelete = (id: string, name: string) => {
    if (id === '00000000-0000-0000-0000-000000000001') {
      showToast('خطا: حساب کاربری مدیر ارشد سیستم قابل حذف نیست!');
      sound.play('gameover');
      return;
    }
    setDeleteConfirmTarget({ id, name });
    sound.play('tap');
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    sound.play('gameover');
    triggerHaptic('heavy');
    await db.deleteProfile(deleteConfirmTarget.id);
    showToast(`حساب کاربری «${deleteConfirmTarget.name}» از پایگاه داده حذف شد.`);
    setDeleteConfirmTarget(null);
    refreshDbStats();
    onRefresh();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('حداکثر حجم مجاز تصویر ۵ مگابایت است.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        sound.play('hit');
        triggerHaptic('light');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      showToast('لطفاً کلیه فیلدهای نام، نام کاربری و رمز را تکمیل کنید.');
      return;
    }

    const birthMonthNum = getMonthNumber(birthMonth);

    try {
      if (editingId) {
        await db.updateProfile(editingId, {
          fullName,
          roleTitle,
          department,
          avatarUrl,
          birthDay: Number(birthDay),
          birthMonth,
          birthMonthNum,
          birthYear: Number(birthYear),
          shiftName,
          phoneNumber: phoneNumber.trim() || undefined,
          internalExt: internalExt.trim() || undefined,
          isAdmin: isAdminUser,
        });
        showToast(`مشخصات «${fullName}» با موفقیت ویرایش شد.`);
      } else {
        await db.addProfile({
          fullName,
          roleTitle,
          department,
          username: username.trim().toLowerCase(),
          passwordHash: password.trim(),
          avatarUrl,
          birthDay: Number(birthDay),
          birthMonth,
          birthMonthNum,
          birthYear: Number(birthYear),
          shiftName,
          phoneNumber: phoneNumber.trim() || undefined,
          internalExt: internalExt.trim() || undefined,
          isAdmin: isAdminUser,
          isOnline: true,
        });
        showToast(`پرسنل جدید «${fullName}» در پایگاه داده ثبت شد.`);
      }

      sound.play('score');
      triggerHaptic('success');
      resetStaffForm();
      refreshDbStats();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت اطلاعات در دیتابیس!');
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('لطفاً عنوان و متن اعلان را وارد کنید.');
      return;
    }

    db.updateAnnouncement(annTitle.trim(), annContent.trim(), annPriority);
    sound.play('score');
    triggerHaptic('success');
    showToast('تابلوی اعلانات فروشگاه با موفقیت بروزرسانی شد.');
    onRefresh();
  };

  // Database Management Handlers
  const handleExportBackup = () => {
    const jsonStr = db.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2077_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sound.play('hit');
    showToast('فایل پشتیبان کامل پایگاه داده دانلود شد.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = db.importDatabaseJson(reader.result);
        if (res.success) {
          sound.play('score');
          triggerHaptic('success');
          showToast(res.message);
          refreshDbStats();
          onRefresh();
        } else {
          sound.play('gameover');
          showToast(res.message);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    setDbStatusMsg(null);

    const res = await db.configureSupabase(supabaseUrlInput, supabaseKeyInput);
    setIsTestingSupabase(false);

    if (res.success) {
      sound.play('score');
      triggerHaptic('success');
      setDbStatusMsg({ text: res.message, isError: false });
      refreshDbStats();
      onRefresh();
    } else {
      sound.play('gameover');
      triggerHaptic('error');
      setDbStatusMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg select-none pb-12">
      {/* Top Command & Credentials Strip */}
      <div className="relative bg-[#141413] border border-[#5DF8D8]/30 backdrop-blur-xl p-space-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#5DF8D8]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between gap-space-sm relative z-10">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded bg-[#5DF8D8]/15 border border-[#5DF8D8]/30 flex items-center justify-center p-1.5 shadow-[0_0_12px_rgba(93,248,216,0.25)] shrink-0">
              <img src="/brand/logo-mint.png" alt="2077 Admin" className="w-full h-full object-contain drop-shadow-[0_0_6px_#5DF8D8]" />
            </div>
            <div className="flex flex-col truncate text-right">
              <span className="font-tech-micro text-tech-micro text-[#A3A39E]">// ADMIN.TERMINAL</span>
              <span className="font-title-sm text-title-sm text-[#F5F5F5] truncate">
                مرکز مدیریت و فرماندهی عملیات ۲۰۷۷
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-space-sm py-1 bg-[#0E0E0D] border border-[#F62477]/40 rounded shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#F62477] animate-pulse shadow-[0_0_8px_#F62477]"></span>
            <span className="font-code-md text-code-md text-[#F62477]">SYS::ADMIN</span>
          </div>
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {statusNotice && (
        <div className="p-3 bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 rounded-lg text-[#5DF8D8] text-xs font-semibold text-center animate-pulse shadow-lg">
          {statusNotice}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-[#141413] border border-[#5DF8D8]/20 rounded-xl">
        <button
          onClick={() => {
            sound.play('tap');
            setActiveSubTab('staff');
          }}
          className={`py-2 px-1 text-center font-title-sm text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'staff'
              ? 'bg-[#5DF8D8] text-[#0A2821] font-bold shadow-[0_0_12px_rgba(93,248,216,0.4)]'
              : 'text-[#A3A39E] hover:text-[#F5F5F5]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>مدیریت پرسنل</span>
        </button>

        <button
          onClick={() => {
            sound.play('tap');
            setActiveSubTab('announcement');
          }}
          className={`py-2 px-1 text-center font-title-sm text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'announcement'
              ? 'bg-[#5DF8D8] text-[#0A2821] font-bold shadow-[0_0_12px_rgba(93,248,216,0.4)]'
              : 'text-[#A3A39E] hover:text-[#F5F5F5]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">campaign</span>
          <span>تابلوی اعلانات</span>
        </button>

        <button
          onClick={() => {
            sound.play('tap');
            setActiveSubTab('database');
            refreshDbStats();
          }}
          className={`py-2 px-1 text-center font-title-sm text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'database'
              ? 'bg-[#5DF8D8] text-[#0A2821] font-bold shadow-[0_0_12px_rgba(93,248,216,0.4)]'
              : 'text-[#A3A39E] hover:text-[#F5F5F5]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">database</span>
          <span>مدیریت دیتابیس</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: STAFF MANAGEMENT */}
      {/* ================================================================= */}
      {activeSubTab === 'staff' && (
        <div className="flex flex-col gap-space-md">
          {/* Action Trigger Button */}
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (editingId) resetStaffForm();
            }}
            className="w-full relative group py-3 px-space-lg bg-[#F62477] text-white font-headline-md text-headline-md rounded-xl flex items-center justify-center gap-space-sm transition-all duration-200 active:scale-[0.98] shadow-[0_0_20px_rgba(246,36,119,0.45)] hover:shadow-[0_0_28px_rgba(246,36,119,0.7)]"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isFormOpen ? 'close' : 'person_add'}
            </span>
            <span>
              {isFormOpen ? 'بستن فرم ثبت پرسنل' : '+ افزودن پرسنل جدید به فروشگاه'}
            </span>
            <span className="font-code-md text-code-md opacity-80 mr-auto">// ADD_STAFF</span>
          </button>

          {/* Staff Form Section */}
          {isFormOpen && (
            <section className="relative bg-[#141413] border border-[#5DF8D8]/30 backdrop-blur-xl p-space-md rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.6)] flex flex-col gap-space-md">
              <div className="flex items-center justify-between border-b border-[#252523] pb-2">
                <div className="flex items-center gap-space-xs text-right">
                  <span className="w-2 h-2 bg-[#5DF8D8] rounded-full shadow-[0_0_6px_#5DF8D8]"></span>
                  <h2 className="font-title-sm text-title-sm text-[#F5F5F5]">
                    {editingId ? 'ویرایش مشخصات پرسنل' : 'ثبت نام پرسنل جدید'}
                  </h2>
                </div>
                <span className="font-code-md text-code-md text-[#5DF8D8]">
                  {editingId ? 'EDIT::STAFF' : 'NEW::STAFF'}
                </span>
              </div>

              <form className="flex flex-col gap-space-md" onSubmit={handleSubmitStaff}>
                {/* Full Name */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="font-body-sm text-body-sm text-[#A3A39E] flex items-center justify-between">
                    <span>نام و نام خانوادگی</span>
                    <span className="font-tech-micro text-tech-micro text-[#5DF8D8]">ضروری</span>
                  </label>
                  <input
                    className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-space-md py-2.5 rounded-lg font-body-md text-body-md focus:outline-none focus:border-[#5DF8D8] focus:bg-[#1C1C1B] transition-colors"
                    placeholder="مثال: آرش کریمی"
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Role and Department */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="font-body-sm text-body-sm text-[#A3A39E]">سمت در فروشگاه</label>
                  <select
                    value={roleTitle}
                    onChange={(e) => {
                      setRoleTitle(e.target.value);
                      if (e.target.value.includes('FIXER')) setDepartment('FRONT-DESK');
                      else if (e.target.value.includes('NETRUNNER')) setDepartment('CORE-SYS');
                      else if (e.target.value.includes('VAULT')) setDepartment('VAULT');
                      else if (e.target.value.includes('TECH')) setDepartment('AI-SHOWCASE');
                      else if (e.target.value.includes('ESPORTS')) setDepartment('ESPORTS');
                    }}
                    className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-space-md py-2.5 rounded-lg font-body-md text-body-md focus:outline-none focus:border-[#5DF8D8]"
                  >
                    <option value="متخصص فروش // FIXER">متخصص فروش (Cyber Sales // FIXER)</option>
                    <option value="مدیر فنی سیستم // NETRUNNER">مدیر فنی سیستم (Netrunner Ops)</option>
                    <option value="انباردار و لجستیک // VAULT">انباردار و لجستیک (Vault Logistics)</option>
                    <option value="مسئول هوش مصنوعی // TECH">مسئول هوش مصنوعی (Tech Specialist)</option>
                    <option value="لیدر مسابقات // APEX RUNNER">لیدر مسابقات (Apex Runner)</option>
                    <option value="کارشناس تضمین کیفیت // QA">کارشناس تضمین کیفیت (QA Tech)</option>
                  </select>
                </div>

                {/* Phone & Internal Extension */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1 text-right">
                    <label className="font-body-sm text-body-sm text-[#A3A39E] truncate">
                      شماره تماس همراه
                    </label>
                    <input
                      className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-space-sm py-2 rounded-lg font-code-md text-code-md focus:outline-none focus:border-[#5DF8D8] text-left"
                      dir="ltr"
                      placeholder="0912xxxxxxx"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <label className="font-body-sm text-body-sm text-[#A3A39E] truncate">
                      شماره داخلی فروشگاه
                    </label>
                    <input
                      className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-space-sm py-2 rounded-lg font-code-md text-code-md focus:outline-none focus:border-[#5DF8D8] text-left"
                      dir="ltr"
                      placeholder="مثال: 104"
                      type="text"
                      value={internalExt}
                      onChange={(e) => setInternalExt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1 text-right">
                    <label className="font-body-sm text-body-sm text-[#A3A39E] truncate">
                      نام کاربری (Username)
                    </label>
                    <input
                      className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-space-sm py-2 rounded-lg font-code-md text-code-md focus:outline-none focus:border-[#5DF8D8] text-left"
                      dir="ltr"
                      placeholder="arash.2077"
                      required
                      disabled={!!editingId}
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-right">
                    <label className="font-body-sm text-body-sm text-[#A3A39E] truncate">
                      رمز عبور اختصاصی
                    </label>
                    <input
                      className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-space-sm py-2 rounded-lg font-code-md text-code-md focus:outline-none focus:border-[#5DF8D8] text-left tracking-wider"
                      dir="ltr"
                      placeholder="رمز ورود"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Photo Upload and Presets */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="font-body-sm text-body-sm text-[#A3A39E]">
                    تصویر پرسنلی (آپلود عکس از گالری یا انتخاب از آواتارها)
                  </label>
                  <div className="relative w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 rounded-lg p-space-md flex flex-col gap-3 shadow-inner">
                    <div className="flex items-center gap-space-md">
                      <div className="relative w-16 h-16 bg-[#1C1C1B] border border-[#5DF8D8]/40 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                        <img
                          className="w-full h-full object-cover"
                          src={avatarUrl}
                          alt="Avatar Preview"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/avatars/avatar1.svg';
                          }}
                        />
                      </div>

                      <div className="flex flex-col text-right flex-1">
                        <span className="font-body-sm text-xs text-[#F5F5F5] font-semibold">
                          آپلود عکس واقعی پرسنل
                        </span>
                        <span className="text-[11px] text-[#A3A39E]">
                          تصویر مستقیماً در دیتابیس دستگاه ذخیره می‌شود.
                        </span>
                        <label className="mt-1.5 cursor-pointer inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#5DF8D8] text-[#0A2821] font-bold rounded text-xs active:scale-95 transition-transform w-fit">
                          <span className="material-symbols-outlined text-[16px]">file_upload</span>
                          <span>انتخاب عکس از گالری/دوربین</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#232321]">
                      <span className="text-[11px] text-[#A3A39E]">یا انتخاب آواتار پیش‌فرض:</span>
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAvatarUrl(preset)}
                            className={`w-9 h-9 rounded-full overflow-hidden border shrink-0 transition-all ${
                              avatarUrl === preset ? 'border-[#F62477] scale-110 shadow-[0_0_8px_#F62477]' : 'border-[#2F2F2D]'
                            }`}
                          >
                            <img src={preset} className="w-full h-full object-cover" alt="preset" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solar Birthdate Inputs */}
                <div className="flex flex-col gap-1 text-right">
                  <label className="font-body-sm text-body-sm text-[#A3A39E] flex items-center justify-between">
                    <span>تاریخ تولد شمسی (جهت نوتیفیکیشن خودکار)</span>
                    <span className="font-tech-micro text-tech-micro text-[#5DF8D8]">تقویم جلالی</span>
                  </label>
                  <div className="grid grid-cols-3 gap-space-xs text-center">
                    <div className="flex flex-col">
                      <input
                        className="bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] py-2 rounded-lg text-center font-code-md text-code-md focus:outline-none focus:border-[#5DF8D8]"
                        placeholder="روز [۱۹]"
                        type="number"
                        min="1"
                        max="31"
                        value={birthDay}
                        onChange={(e) => setBirthDay(Number(e.target.value))}
                      />
                      <span className="font-tech-micro text-tech-micro text-[#A3A39E] mt-1">روز</span>
                    </div>

                    <div className="flex flex-col">
                      <select
                        className="bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] py-2 rounded-lg text-center font-body-sm text-body-sm focus:outline-none focus:border-[#5DF8D8]"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                      >
                        {PERSIAN_MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <span className="font-tech-micro text-tech-micro text-[#A3A39E] mt-1">ماه</span>
                    </div>

                    <div className="flex flex-col">
                      <input
                        className="bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] py-2 rounded-lg text-center font-code-md text-code-md focus:outline-none focus:border-[#5DF8D8]"
                        placeholder="سال [۱۳۸۰]"
                        type="number"
                        min="1340"
                        max="1405"
                        value={birthYear}
                        onChange={(e) => setBirthYear(Number(e.target.value))}
                      />
                      <span className="font-tech-micro text-tech-micro text-[#A3A39E] mt-1">سال</span>
                    </div>
                  </div>
                </div>

                {/* Shift & Admin Toggle */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-xs text-[#A3A39E]">شیفت کاری:</label>
                    <select
                      value={shiftName}
                      onChange={(e) => setShiftName(e.target.value)}
                      className="bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] py-2 px-2 rounded-lg text-xs focus:outline-none focus:border-[#5DF8D8]"
                    >
                      <option value="شیفت روز">شیفت روز (۰۹:۰۰ الی ۱۷:۰۰)</option>
                      <option value="شیفت عصر">شیفت عصر (۱۶:۰۰ الی ۲۳:۰۰)</option>
                      <option value="شیفت شب">شیفت شب (۲۳:۰۰ الی ۰۸:۰۰)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4 cursor-pointer" onClick={() => setIsAdminUser(!isAdminUser)}>
                    <div
                      className={`w-4 h-4 flex items-center justify-center border rounded ${
                        isAdminUser ? 'bg-[#F62477] border-[#F62477]' : 'bg-[#0E0E0D] border-[#3A3A38]'
                      }`}
                    >
                      {isAdminUser && <span className="material-symbols-outlined text-xs text-white font-bold">check</span>}
                    </div>
                    <span className="text-xs text-[#F5F5F5]">دسترسی ادمین (Admin)</span>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center gap-space-sm pt-space-xs">
                  <button
                    className="flex-1 py-2.5 bg-[#5DF8D8] text-[#062E25] font-bold rounded-lg font-title-sm text-title-sm shadow-[0_0_16px_rgba(93,248,216,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-space-xs"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>{editingId ? 'ثبت تغییرات پرسنل' : 'ثبت قطعی در پایگاه داده'}</span>
                  </button>

                  <button
                    onClick={resetStaffForm}
                    className="px-space-md py-2.5 bg-[#232321] text-[#F5F5F5] border border-white/10 rounded-lg font-body-sm text-body-sm active:scale-95 transition-transform"
                    type="button"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Personnel List */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-space-xs text-right">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">groups</span>
                <h3 className="font-title-sm text-title-sm text-[#F5F5F5]">فهرست پرسنل فعال سیستم</h3>
              </div>
              <span className="font-tech-micro text-tech-micro text-[#5DF8D8] px-2 py-0.5 bg-[#141413] border border-[#5DF8D8]/30 rounded">
                [{toPersianDigits(profiles.length)} حساب متصل]
              </span>
            </div>

            {profiles.map((person, idx) => (
              <div
                key={person.id}
                className="relative bg-[#141413] border border-[#5DF8D8]/30 backdrop-blur-md p-space-md rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.45)] flex flex-col gap-space-sm"
              >
                <div className="flex items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="relative w-12 h-12 rounded-lg bg-[#1C1C1B] shrink-0 overflow-hidden shadow-inner border border-[#5DF8D8]/20">
                      <img
                        className="w-full h-full object-cover"
                        src={person.avatarUrl}
                        alt={person.fullName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/avatar1.svg';
                        }}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${
                          person.isOnline ? 'bg-[#5DF8D8] shadow-[0_0_6px_#5DF8D8]' : 'bg-[#3A3A36]'
                        }`}
                      ></span>
                    </div>
                    <div className="flex flex-col text-right truncate">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-title-sm text-title-sm text-[#F5F5F5] truncate">
                          {person.fullName}
                        </span>
                        <span className="font-code-md text-code-md text-[#5DF8D8]">
                          #{toPersianDigits(idx + 1).padStart(2, '۰')}
                        </span>
                        {person.isAdmin && (
                          <span className="font-tech-micro text-[9px] px-1 bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40 rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-body-sm text-[#A3A39E] truncate">
                        {person.roleTitle} {person.internalExt && `(داخلی ${person.internalExt})`}
                      </span>
                    </div>
                  </div>

                  <span className="font-tech-micro text-tech-micro px-2 py-1 bg-[#232321] text-[#F5F5F5] border border-white/10 rounded shrink-0">
                    {person.shiftName}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-[#232321]">
                  <button
                    onClick={() => handleEdit(person)}
                    className="flex-1 py-1.5 px-space-sm bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 text-[#5DF8D8] rounded font-body-sm text-body-sm flex items-center justify-center gap-1 active:bg-[#5DF8D8] active:text-[#062E25] transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>ویرایش</span>
                  </button>

                  {person.id !== '00000000-0000-0000-0000-000000000001' && (
                    <button
                      onClick={() => handleRequestDelete(person.id, person.fullName)}
                      className="py-1.5 px-space-md bg-[#F62477]/20 border border-[#F62477]/40 text-[#F62477] rounded font-body-sm text-body-sm flex items-center justify-center gap-1 active:bg-[#F62477] active:text-white transition-all shadow-[0_0_8px_rgba(246,36,119,0.25)]"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: STORE ANNOUNCEMENT EDITOR */}
      {/* ================================================================= */}
      {activeSubTab === 'announcement' && (
        <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-space-md shadow-xl">
          <div className="flex items-center justify-between border-b border-[#252523] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F62477] text-[22px]">campaign</span>
              <h3 className="font-title-sm text-base text-[#F5F5F5] font-bold">
                ویرایش تابلوی اعلانات فروشگاه
              </h3>
            </div>
            <span className="text-xs text-[#5DF8D8] font-code-md">BROADCAST::MSG</span>
          </div>

          <p className="text-xs text-[#9E9E9C] leading-relaxed">
            این پیام در بالای صفحه اصلی کلیه پرسنل نمایش داده می‌شود. می‌توانید پیام‌های فوری، تغییر ساعت کاری، تخفیف‌ها یا رویدادها را اینجا درج کنید.
          </p>

          <form className="flex flex-col gap-space-md" onSubmit={handleSaveAnnouncement}>
            <div className="flex flex-col gap-1 text-right">
              <label className="text-xs text-[#A3A39E]">عنوان اعلان:</label>
              <input
                className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#5DF8D8]"
                placeholder="مثال: ساعت کاری فروشگاه در تعطیلات آخر هفته"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1 text-right">
              <label className="text-xs text-[#A3A39E]">متن کامل پیام:</label>
              <textarea
                rows={3}
                className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#5DF8D8] leading-relaxed"
                placeholder="متن پیام را برای پرسنل بنویسید..."
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1 text-right">
              <label className="text-xs text-[#A3A39E]">سطح اولویت اعلان:</label>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value)}
                className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#5DF8D8]"
              >
                <option value="عادی">عادی (اطلاع‌رسانی عمومی)</option>
                <option value="مهم">مهم (توجه پرسنل)</option>
                <option value="فوری">فوری (هشدار سیستمی)</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 py-2.5 px-4 bg-[#F62477] hover:bg-[#5DF8D8] text-white hover:text-[#0A2821] font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(246,36,119,0.4)] transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              <span>انتشار و بروزرسانی تابلوی اعلانات</span>
            </button>
          </form>
        </section>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: DATABASE ENGINE & BACKUP CENTER */}
      {/* ================================================================= */}
      {activeSubTab === 'database' && (
        <div className="flex flex-col gap-space-md">
          {/* Status Overview Card */}
          <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#252523] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[22px]">database</span>
                <h3 className="font-title-sm text-base text-[#F5F5F5] font-bold">
                  وضعیت موتور دیتابیس (Database Engine)
                </h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                dbStats?.mode === 'supabase'
                  ? 'bg-[#5DF8D8]/20 text-[#5DF8D8] border border-[#5DF8D8]/40'
                  : 'bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40'
              }`}>
                {dbStats?.mode === 'supabase' ? 'متصل به سرور Supabase PostgreSQL' : 'پایگاه داده محلی (Local Storage)'}
              </span>
            </div>

            <p className="text-xs text-[#9E9E9C] leading-relaxed">
              سیستم به صورت پیش‌فرض و ۱۰۰٪ مستقل روی حافظه امن دستگاه شما ذخیره می‌شود. جهت همگام‌سازی لحظه‌ای میان تمام گوشی‌های پرسنل، می‌توانید آدرس پروژه Supabase خود را در فرم زیر وارد کنید.
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 bg-[#0E0E0D] border border-[#5DF8D8]/20 rounded-lg">
                <span className="text-[10px] text-[#A3A39E] block">پرسنل</span>
                <span className="font-code-md text-sm text-[#5DF8D8] font-bold">
                  {toPersianDigits(dbStats?.profilesCount || 0)}
                </span>
              </div>
              <div className="p-2 bg-[#0E0E0D] border border-[#5DF8D8]/20 rounded-lg">
                <span className="text-[10px] text-[#A3A39E] block">رکوردهای بازی</span>
                <span className="font-code-md text-sm text-[#F62477] font-bold">
                  {toPersianDigits(dbStats?.gameScoresCount || 0)}
                </span>
              </div>
              <div className="p-2 bg-[#0E0E0D] border border-[#5DF8D8]/20 rounded-lg">
                <span className="text-[10px] text-[#A3A39E] block">وظایف جاری</span>
                <span className="font-code-md text-sm text-[#F5F5F5] font-bold">
                  {toPersianDigits(dbStats?.tasksCount || 0)}
                </span>
              </div>
              <div className="p-2 bg-[#0E0E0D] border border-[#5DF8D8]/20 rounded-lg">
                <span className="text-[10px] text-[#A3A39E] block">حجم ذخیره</span>
                <span className="font-code-md text-sm text-[#5DF8D8] font-bold">
                  {toPersianDigits(dbStats?.storageSizeKb || 1)} KB
                </span>
              </div>
            </div>
          </section>

          {/* Backup & Restore Controls */}
          <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
            <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">backup</span>
              پشتیبان‌گیری و انتقال داده‌ها (Export / Import JSON)
            </h4>
            <p className="text-xs text-[#9E9E9C]">
              می‌توانید در هر لحظه یک خروجی فایل JSON از کل پرسنل، امتیازات و وظایف دریافت کنید و آن را روی دستگاه دیگری بازیابی نمایید.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-[#5DF8D8]/15 hover:bg-[#5DF8D8] text-[#5DF8D8] hover:text-[#0A2821] border border-[#5DF8D8]/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(93,248,216,0.2)]"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>دانلود نسخه پشتیبان کامل (JSON)</span>
              </button>

              <label className="py-2.5 px-3 bg-[#232321] hover:bg-[#32322F] text-[#F5F5F5] border border-white/10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>بازیابی از فایل پشتیبان (Restore)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
              </label>
            </div>
          </section>

          {/* Supabase PostgreSQL Cloud Connect Form */}
          <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
            <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">cloud_sync</span>
              اتصال زنده به سرور ابری Supabase PostgreSQL
            </h4>
            <p className="text-xs text-[#9E9E9C] leading-relaxed">
              جهت همگام‌سازی ابری، پروژه رایگان خود را در <strong className="text-[#5DF8D8]">supabase.com</strong> بسازید، محتوای فایل <code className="text-[#F62477] font-bold">schema.sql</code> را در SQL Editor آن اجرا کنید و سپس مقادیر را اینجا قرار دهید:
            </p>

            {dbStatusMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold text-center ${
                dbStatusMsg.isError
                  ? 'bg-[#F62477]/15 border border-[#F62477]/40 text-[#F62477]'
                  : 'bg-[#5DF8D8]/15 border border-[#5DF8D8]/40 text-[#5DF8D8]'
              }`}>
                {dbStatusMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveSupabaseConfig} className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-1 text-right">
                <label className="text-xs text-[#A3A39E]">Supabase Project URL:</label>
                <input
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs font-code-md text-left focus:outline-none focus:border-[#5DF8D8]"
                  dir="ltr"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1 text-right">
                <label className="text-xs text-[#A3A39E]">Supabase Anon API Key:</label>
                <input
                  className="w-full bg-[#0E0E0D] border border-[#5DF8D8]/30 text-[#F5F5F5] px-3 py-2 rounded-lg text-xs font-code-md text-left focus:outline-none focus:border-[#5DF8D8]"
                  dir="ltr"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isTestingSupabase}
                  className="flex-1 py-2 px-3 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>{isTestingSupabase ? 'در حال تست اتصال...' : 'ذخیره و تست اتصال به دیتابیس ابری'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSupabaseUrlInput('');
                    setSupabaseKeyInput('');
                    db.configureSupabase('', '');
                    sound.play('hit');
                    refreshDbStats();
                    showToast('دیتابیس در حالت ذخیره‌سازی محلی قرار گرفت.');
                  }}
                  className="py-2 px-3 bg-[#232321] text-[#F5F5F5] border border-white/10 rounded-lg text-xs hover:bg-[#32322F] transition-colors"
                >
                  سوئیچ به حالت محلی
                </button>
              </div>
            </form>
          </section>

          {/* Raw Database Table Inspector */}
          <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">table_view</span>
                کاوشگر زنده جداول و داده‌ها (Data Inspector)
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRawTableViewer(rawTableViewer === 'profiles' ? 'none' : 'profiles')}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    rawTableViewer === 'profiles' ? 'bg-[#5DF8D8] text-[#0A2821] font-bold' : 'bg-[#0E0E0D] text-[#A3A39E] border-[#252523]'
                  }`}
                >
                  جدول پرسنل
                </button>
                <button
                  onClick={() => setRawTableViewer(rawTableViewer === 'tasks' ? 'none' : 'tasks')}
                  className={`px-2 py-1 text-xs rounded border transition-all ${
                    rawTableViewer === 'tasks' ? 'bg-[#5DF8D8] text-[#0A2821] font-bold' : 'bg-[#0E0E0D] text-[#A3A39E] border-[#252523]'
                  }`}
                >
                  جدول وظایف
                </button>
              </div>
            </div>

            {rawTableViewer !== 'none' && (
              <div className="mt-2 bg-[#0A0A09] border border-[#5DF8D8]/20 p-3 rounded-lg overflow-x-auto max-h-60 text-left font-code-md text-xs text-[#5DF8D8]" dir="ltr">
                <pre>
                  {rawTableViewer === 'profiles'
                    ? JSON.stringify(profiles, null, 2)
                    : JSON.stringify(db.getTasks(), null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Custom Modern Cyberpunk Confirmation Modal for Delete */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141413] border border-[#F62477]/50 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-center [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]">
            <div className="w-12 h-12 rounded-full bg-[#F62477]/20 border border-[#F62477]/40 flex items-center justify-center mx-auto text-[#F62477]">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F5F5F5]">حذف حساب پرسنلی</h3>
              <p className="text-xs text-[#A3A39E] mt-1.5 leading-relaxed">
                آیا از حذف حساب پرسنلی <strong className="text-[#F62477]">«{deleteConfirmTarget.name}»</strong> و کلیه سوابق امتیازی او از پایگاه داده اطمینان دارید؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-[#F62477] text-white font-bold rounded-lg text-xs shadow-[0_0_12px_rgba(246,36,119,0.4)] active:scale-95 transition-all"
              >
                تایید و حذف دائمی
              </button>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs active:scale-95 transition-all"
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