import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { db } from '../../services/db';
import { toPersianDigits } from '../../utils/jalali';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { CyberAvatar } from '../CyberAvatar';
import { StaffFormModal } from './StaffFormModal';

interface StaffManagerProps {
  profiles: UserProfile[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({ profiles, onRefresh, showToast }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<UserProfile | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | null>(null);

  const handleEdit = (person: UserProfile) => {
    setEditingPerson(person);
    setIsFormOpen(true);
    sound.play('tap');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    sound.play('gameover');
    triggerHaptic('heavy');
    await db.deleteProfile(deleteConfirmTarget.id);
    showToast(`حساب «${deleteConfirmTarget.name}» حذف شد.`);
    setDeleteConfirmTarget(null);
    onRefresh();
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (formData.id) {
        await db.updateProfile(formData.id, formData);
        showToast(`مشخصات «${formData.fullName}» ذخیره شد.`);
      } else {
        await db.addProfile(formData);
        showToast(`پرسنل «${formData.fullName}» با موفقیت ثبت شد.`);
      }

      sound.play('score');
      triggerHaptic('success');
      setIsFormOpen(false);
      setEditingPerson(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت اطلاعات!');
    }
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Toggle Add Staff Button */}
      <button
        type="button"
        onClick={() => {
          setIsFormOpen(!isFormOpen);
          if (editingPerson) setEditingPerson(null);
        }}
        className="w-full py-3 px-4 bg-[#5DF8D8]/15 border border-[#5DF8D8]/50 rounded-xl text-[#5DF8D8] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#5DF8D8]/25 transition-all shadow-[0_0_15px_rgba(93,248,216,0.15)]"
      >
        <span className="material-symbols-outlined text-[20px]">
          {isFormOpen ? 'close' : 'person_add'}
        </span>
        <span>{isFormOpen ? 'بستن فرم' : 'افزودن پرسنل جدید'}</span>
      </button>

      {/* Staff Add / Edit Form Modal */}
      <StaffFormModal
        isOpen={isFormOpen}
        editingPerson={editingPerson}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPerson(null);
        }}
        onSubmit={handleFormSubmit}
        showToast={showToast}
      />

      {/* Staff Roster List */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-[#A3A39E] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-[#5DF8D8]">badge</span>
          فهرست پرسنل فعال سیستم ({toPersianDigits(profiles.length)} نفر)
        </h3>

        {profiles.map((person) => (
          <div key={person.id} className="bg-[#141413] border border-white/10 p-3 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <CyberAvatar
                src={person.avatarUrl}
                alt={person.fullName}
                size="sm"
                isOnline={person.isOnline}
                neonBorder={person.isAdmin ? 'magenta' : 'mint'}
              />
              <div className="flex flex-col text-right truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">{person.fullName}</span>
                  {person.isAdmin && (
                    <span className="text-[9px] bg-[#F62477]/20 text-[#F62477] px-1 rounded font-bold">ADMIN</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#A3A39E]">
                  <span>@{person.username}</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    رمز: {revealedPasswords[person.id] ? person.passwordHash : '••••'}
                    <button
                      type="button"
                      onClick={() => setRevealedPasswords((prev) => ({ ...prev, [person.id]: !prev[person.id] }))}
                      className="text-[#5DF8D8] text-[11px]"
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {revealedPasswords[person.id] ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleEdit(person)}
                className="p-1.5 bg-[#5DF8D8]/10 text-[#5DF8D8] rounded-lg text-xs hover:bg-[#5DF8D8]/20"
                title="ویرایش"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              {person.id !== '00000000-0000-0000-0000-000000000001' && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget({ id: person.id, name: person.fullName })}
                  className="p-1.5 bg-[#F62477]/10 text-[#F62477] rounded-lg text-xs hover:bg-[#F62477]/20"
                  title="حذف"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#141413] border border-[#F62477]/50 rounded-xl p-5 shadow-2xl flex flex-col gap-4 text-center">
            <h3 className="text-base font-bold text-[#F5F5F5]">حذف پرسنل</h3>
            <p className="text-xs text-[#A3A39E]">
              آیا از حذف <strong className="text-[#F62477]">«{deleteConfirmTarget.name}»</strong> مطمئن هستید؟
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-2 bg-[#F62477] text-white font-bold rounded-lg text-xs"
              >
                تایید و حذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-[#232321] text-[#F5F5F5] rounded-lg text-xs"
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
