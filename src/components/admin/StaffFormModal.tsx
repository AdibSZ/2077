import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { getMonthNumber } from '../../utils/jalali';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { processCyberpunkPhoto } from '../../utils/cyberFilter';

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

interface StaffFormModalProps {
  isOpen: boolean;
  editingPerson: UserProfile | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  showToast: (msg: string) => void;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  editingPerson,
  onClose,
  onSubmit,
  showToast,
}) => {
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
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);

  useEffect(() => {
    if (editingPerson) {
      setFullName(editingPerson.fullName);
      setRoleTitle(editingPerson.roleTitle);
      setDepartment(editingPerson.department);
      setUsername(editingPerson.username);
      setPassword(editingPerson.passwordHash);
      setAvatarUrl(editingPerson.avatarUrl);
      setBirthDay(editingPerson.birthDay);
      setBirthMonth(editingPerson.birthMonth);
      setBirthYear(editingPerson.birthYear);
      setShiftName(editingPerson.shiftName);
      setPhoneNumber(editingPerson.phoneNumber || '');
      setInternalExt(editingPerson.internalExt || '');
      setIsAdminUser(editingPerson.isAdmin);
    } else {
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
    }
  }, [editingPerson, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingFilter(true);
      showToast('در حال پردازش و استایل سایبرپانک روی عکس...');
      const processed = await processCyberpunkPhoto(file);
      setAvatarUrl(processed);
      sound.play('hit');
      triggerHaptic('medium');
      showToast('عکس با موفقیت پردازش شد.');
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingFilter(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanFullName || !cleanUsername || !cleanPassword) {
      showToast('لطفاً نام، نام کاربری و رمز را وارد کنید.');
      return;
    }

    await onSubmit({
      id: editingPerson?.id,
      fullName: cleanFullName,
      roleTitle: roleTitle.trim(),
      department,
      username: cleanUsername,
      passwordHash: cleanPassword,
      avatarUrl,
      birthDay: Number(birthDay),
      birthMonth,
      birthMonthNum: getMonthNumber(birthMonth),
      birthYear: Number(birthYear),
      shiftName,
      phoneNumber: phoneNumber.trim() || undefined,
      internalExt: internalExt.trim() || undefined,
      isAdmin: isAdminUser,
      isOnline: true,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="bg-[#141413] border border-[#5DF8D8]/40 p-4 rounded-xl flex flex-col gap-3 shadow-2xl">
      <h3 className="text-sm font-bold text-[#F5F5F5] border-b border-white/10 pb-2">
        {editingPerson ? 'ویرایش مشخصات پرسنل' : 'ثبت نام پرسنل جدید'}
      </h3>

      {/* Avatar Picker & Cyberpunk Photo Upload */}
      <div className="flex items-center gap-3 bg-[#0E0E0D] p-2.5 rounded-xl border border-white/5">
        <img
          src={avatarUrl}
          alt="Avatar Preview"
          className="w-12 h-12 rounded-xl object-cover border border-[#5DF8D8]/50 shadow-[0_0_10px_rgba(93,248,216,0.3)] shrink-0"
        />
        <div className="flex-1 text-right">
          <label className="text-[11px] text-[#A3A39E] block mb-1">تصویر پرسنلی / فیلتر سایبرپانک:</label>
          <label className="inline-flex items-center gap-1.5 py-1 px-3 bg-[#5DF8D8]/10 hover:bg-[#5DF8D8]/20 border border-[#5DF8D8]/40 text-[#5DF8D8] rounded-lg text-xs font-bold cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
            <span>{isProcessingFilter ? 'در حال اعمال فیلتر...' : 'آپلود و فیلتر سایبرپانک'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessingFilter}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-right">
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">نام و نام خانوادگی:</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
            placeholder="مثال: آرتین عباسی"
            required
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">عنوان نقش:</label>
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
            placeholder="مثال: سرپرست شیفت"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-right">
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">نام کاربری (لاگین):</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white font-mono focus:border-[#5DF8D8] outline-none"
            placeholder="artin"
            required
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">رمز عبور ورود:</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white font-mono focus:border-[#5DF8D8] outline-none"
            placeholder="1234"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-right">
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">شماره داخلی:</label>
          <input
            value={internalExt}
            onChange={(e) => setInternalExt(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white font-mono focus:border-[#5DF8D8] outline-none"
            placeholder="102"
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">شماره همراه:</label>
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white font-mono focus:border-[#5DF8D8] outline-none"
            placeholder="0912..."
          />
        </div>
        <div>
          <label className="text-[11px] text-[#A3A39E] block mb-1">شیفت کاری:</label>
          <select
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
          >
            <option value="شیفت روز">شیفت روز</option>
            <option value="شیفت شب">شیفت شب</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="adminCheckbox"
          checked={isAdminUser}
          onChange={(e) => setIsAdminUser(e.target.checked)}
          className="w-4 h-4 accent-[#F62477] rounded"
        />
        <label htmlFor="adminCheckbox" className="text-xs text-[#F5F5F5] font-semibold cursor-pointer">
          دسترسی مدیریت ارشد (Admin / دسترسی به همه بخش‌ها)
        </label>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-2 px-4 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>{editingPerson ? 'بروزرسانی پرسنل' : 'ثبت در سیستم'}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-2 px-4 bg-[#232321] text-white rounded-lg text-xs"
        >
          انصراف
        </button>
      </div>
    </form>
  );
};
