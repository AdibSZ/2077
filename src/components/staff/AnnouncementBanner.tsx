import React, { useState } from 'react';
import { Announcement, UserProfile } from '../../types';
import { db } from '../../services/db';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface AnnouncementBannerProps {
  announcement: Announcement;
  currentUser: UserProfile;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
  currentUser,
  onRefresh,
  showToast,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'عادی' | 'مهم' | 'فوری'>('عادی');

  const hasContent = Boolean(announcement && announcement.content && announcement.content.trim() && announcement.isActive !== false);

  const handleOpenEdit = () => {
    setTitleInput(announcement.title || 'تابلوی اعلانات فروشگاه ۲۰۷۷');
    setContentInput(announcement.content || '');
    setPriorityInput((announcement.priority as any) || 'عادی');
    setIsEditModalOpen(true);
    sound.play('tap');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isAdmin) {
      showToast('فقط مدیران امکان ویرایش اعلانات را دارند.');
      return;
    }
    db.updateAnnouncement(titleInput.trim(), contentInput.trim(), priorityInput);
    sound.play('score');
    triggerHaptic('success');
    showToast('تابلوی اعلانات با موفقیت بروزرسانی شد.');
    setIsEditModalOpen(false);
    onRefresh();
  };

  const handleClear = () => {
    if (!currentUser.isAdmin) {
      showToast('فقط مدیران امکان پاکسازی اعلانات را دارند.');
      return;
    }
    db.clearAnnouncement();
    sound.play('gameover');
    triggerHaptic('heavy');
    showToast('اعلان با موفقیت پاکسازی شد.');
    setIsEditModalOpen(false);
    onRefresh();
  };

  if (!hasContent && !currentUser.isAdmin) {
    return null;
  }

  const isUrgent = announcement?.priority === 'فوری';

  return (
    <>
      <div
        className={`relative p-3.5 rounded-xl border backdrop-blur-md transition-all ${
          isUrgent
            ? 'bg-[#F62477]/15 border-[#F62477]/60 shadow-[0_0_20px_rgba(246,36,119,0.3)] animate-pulse'
            : 'bg-[#141413] border-[#5DF8D8]/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                isUrgent ? 'text-[#F62477]' : 'text-[#5DF8D8]'
              }`}
            >
              {isUrgent ? 'warning' : 'campaign'}
            </span>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-white">
                  {announcement.title || 'تابلوی اعلانات فروشگاه'}
                </span>
                {isUrgent && (
                  <span className="text-[9px] bg-[#F62477] text-white px-1.5 py-0.5 rounded font-black animate-bounce">
                    فوری
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A3A39E] leading-relaxed">
                {hasContent ? announcement.content : 'هنوز اعلانی برای نمایش ثبت نشده است.'}
              </p>
            </div>
          </div>

          {currentUser.isAdmin && (
            <button
              type="button"
              onClick={handleOpenEdit}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-[#5DF8D8] border border-white/10 rounded-lg text-xs shrink-0 transition-colors"
              title="ویرایش اعلان (مخصوص مدیر)"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141413] border border-[#5DF8D8]/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">edit</span>
                ویرایش تابلوی اعلانات
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#A3A39E] block mb-1">عنوان اعلان:</label>
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A3A39E] block mb-1">متن اعلان:</label>
                <textarea
                  rows={3}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A3A39E] block mb-1">سطح اولویت:</label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value as any)}
                  className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
                >
                  <option value="عادی">عادی</option>
                  <option value="مهم">مهم</option>
                  <option value="فوری">فوری (پاپ‌آپ و هشدار)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>انتشار اعلان</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2 px-3 bg-[#F62477]/20 border border-[#F62477]/40 text-[#F62477] font-bold rounded-lg text-xs"
                >
                  پاکسازی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
