import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { CyberAvatar } from '../CyberAvatar';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { db } from '../../services/db';
import { formatBirthdate, toPersianDigits, getStaffLevelAndBirthdayInfo } from '../../utils/jalali';
import { getPresenceConfig } from '../../utils/presenceConstants';

interface StaffCallModalProps {
  person: UserProfile | null;
  onClose: () => void;
}

export const StaffCallModal: React.FC<StaffCallModalProps> = ({ person, onClose }) => {
  if (!person) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141413] border border-[#5DF8D8]/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-center">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">call</span>
            ارتباط با پرسنل
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center gap-3 justify-center text-right my-1">
          <CyberAvatar src={person.avatarUrl} alt={person.fullName} size="md" neonBorder="mint" />
          <div>
            <h4 className="text-sm font-bold text-white">{person.fullName}</h4>
            <p className="text-xs text-[#5DF8D8]">{person.roleTitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {person.internalExt && (
            <div className="p-3 bg-[#0E0E0D] border border-white/10 rounded-xl flex items-center justify-between">
              <span className="text-xs text-[#A3A39E]">شماره داخلی فروشگاه:</span>
              <span className="text-base font-bold text-[#5DF8D8] font-mono">
                {person.internalExt}
              </span>
            </div>
          )}

          {person.phoneNumber ? (
            <a
              href={`tel:${person.phoneNumber}`}
              onClick={() => sound.play('tap')}
              className="p-3 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(93,248,216,0.3)]"
            >
              <span className="material-symbols-outlined text-[18px]">phone</span>
              <span>تماس مستقیم: {person.phoneNumber}</span>
            </a>
          ) : (
            <div className="p-3 bg-white/5 rounded-xl text-xs text-[#A3A39E]">
              شماره تلفن مستقیم ثبت نشده است.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StaffDossierModalProps {
  person: UserProfile | null;
  onClose: () => void;
}

export const StaffDossierModal: React.FC<StaffDossierModalProps> = ({ person, onClose }) => {
  if (!person) return null;

  const presenceCfg = getPresenceConfig(
    person.presenceStatus || (person.isOnline ? 'ON_DUTY' : 'OFF_LINE')
  );

  const levelInfo = getStaffLevelAndBirthdayInfo(
    person.birthYear,
    person.birthMonthNum || person.birthMonth,
    person.birthDay
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141413] border border-[#5DF8D8]/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-right">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">badge</span>
            شناسنامه پرسنلی
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex items-center gap-3 justify-center mb-1">
          <CyberAvatar src={person.avatarUrl} alt={person.fullName} size="lg" neonBorder={person.isAdmin ? 'magenta' : 'mint'} />
        </div>

        <div className="text-center">
          <h4 className="text-base font-bold text-white">{person.fullName}</h4>
          <p className="text-xs text-[#5DF8D8] mt-0.5">{person.roleTitle}</p>
        </div>

        <div className="flex flex-col gap-2 bg-[#0E0E0D] p-3 rounded-xl border border-white/10 text-xs">
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-[#A3A39E]">وضعیت حضور زنده:</span>
            <span
              className="font-bold flex items-center gap-1"
              style={{ color: presenceCfg.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: presenceCfg.color }}
              />
              {presenceCfg.faLabel} ({presenceCfg.enLabel})
            </span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-[#A3A39E]">شیفت کاری:</span>
            <span className="text-white font-medium">{person.shiftName}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-[#A3A39E]">تاریخ تولد و سن:</span>
            <span className="text-white font-medium">
              {formatBirthdate(person.birthDay, person.birthMonth)} {toPersianDigits(person.birthYear)} ({toPersianDigits(levelInfo.level)} ساله)
            </span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5 items-center">
            <span className="text-[#A3A39E]">سطح سایبری (Level):</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-[#5DF8D8] bg-[#5DF8D8]/10 px-1.5 py-0.5 rounded border border-[#5DF8D8]/30">
                LVL.{toPersianDigits(levelInfo.level)}
              </span>
              <div className="w-14 h-1.5 bg-[#0D0D0C] border border-[#5DF8D8]/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5DF8D8] to-[#F62477] rounded-full"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A3A39E] font-mono">%{toPersianDigits(levelInfo.progressPercent)}</span>
            </div>
          </div>
          <div className="hidden">
            <span className="text-white font-medium">
              {formatBirthdate(person.birthDay, person.birthMonth)} {toPersianDigits(person.birthYear)}
            </span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-1.5">
            <span className="text-[#A3A39E]">مجموع امتیاز آرکید (CP):</span>
            <span className="text-[#5DF8D8] font-bold font-mono">
              {toPersianDigits(person.totalCp || 0)} CP
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A3A39E]">جام‌های قهرمانی:</span>
            <span className="text-[#F62477] font-bold font-mono">
              {toPersianDigits(person.crownsCount || 0)} جام
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StaffTaskModalProps {
  person: UserProfile | null;
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const StaffTaskModal: React.FC<StaffTaskModalProps> = ({
  person,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'عادی' | 'مهم' | 'فوری'>('مهم');

  if (!person) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isAdmin) {
      alert('فقط مدیران امکان تعریف تسک دارند.');
      return;
    }

    db.addTask(
      {
        assignedToId: person.id,
        assignedToName: person.fullName,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        isGlobal: false,
      },
      currentUser
    );

    sound.play('score');
    triggerHaptic('success');
    onSuccess(`تسک با موفقیت به ${person.fullName} محول شد.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#141413] border border-[#F62477]/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-right">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#F62477] text-[20px]">add_task</span>
            تعریف وظیفه برای {person.fullName}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#A3A39E]">عنوان وظیفه:</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="مثلاً: بررسی موجودی بخش لوازم جانبی"
              className="p-2.5 bg-[#0E0E0D] border border-white/15 rounded-xl text-xs text-white focus:border-[#F62477] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#A3A39E]">توضیحات تکمیلی (اختیاری):</label>
            <textarea
              rows={2}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="جزئیات و دستورالعمل مأموریت..."
              className="p-2.5 bg-[#0E0E0D] border border-white/15 rounded-xl text-xs text-white focus:border-[#F62477] outline-none resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#A3A39E]">سطح فوریت مأموریت:</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['عادی', 'مهم', 'فوری'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`py-1.5 rounded-lg border font-bold transition-all ${
                    taskPriority === p
                      ? p === 'فوری'
                        ? 'bg-[#F62477] text-white border-[#F62477]'
                        : p === 'مهم'
                        ? 'bg-[#5DF8D8] text-[#0A2821] border-[#5DF8D8]'
                        : 'bg-white/20 text-white border-white/30'
                      : 'bg-white/5 border-white/10 text-[#A3A39E]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-[#F62477] hover:bg-[#d01c62] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(246,36,119,0.3)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>ابلاغ رسمی این مأموریت</span>
          </button>
        </form>
      </div>
    </div>
  );
};
