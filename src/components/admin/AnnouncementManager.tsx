import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';

interface AnnouncementManagerProps {
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({ onRefresh, showToast }) => {
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('عادی');

  useEffect(() => {
    const currentAnn = db.getAnnouncement();
    setAnnTitle(currentAnn.title);
    setAnnContent(currentAnn.content);
    setAnnPriority(currentAnn.priority || 'عادی');
  }, []);

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

  const handleClearAnnouncement = () => {
    db.clearAnnouncement();
    setAnnContent('');
    setAnnTitle('تابلوی اعلانات فروشگاه مرکزی ۲۰۷۷');
    sound.play('gameover');
    triggerHaptic('heavy');
    showToast('دیوار اعلانات فروشگاه با موفقیت پاکسازی و از دید همه حذف شد.');
    onRefresh();
  };

  return (
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
        این پیام در بالای صفحه اصلی کلیه پرسنل نمایش داده می‌شود. می‌توانید پیام‌های فوری، تغییر ساعت کاری یا رویدادها را اینجا درج کنید.
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 bg-[#F62477] hover:bg-[#5DF8D8] text-white hover:text-[#0A2821] font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(246,36,119,0.4)] transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">publish</span>
            <span>انتشار و بروزرسانی تابلوی اعلانات</span>
          </button>

          <button
            type="button"
            onClick={handleClearAnnouncement}
            className="py-2.5 px-4 bg-[#232321] hover:bg-[#F62477]/20 text-[#F62477] border border-[#F62477]/40 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
            title="پاکسازی متن اعلان از تابلوی همه پرسنل"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>پاکسازی اعلان</span>
          </button>
        </div>
      </form>
    </section>
  );
};
