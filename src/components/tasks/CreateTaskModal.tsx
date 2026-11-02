import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { sound } from '../../utils/audio';

interface CreateTaskModalProps {
  isOpen: boolean;
  profiles: UserProfile[];
  onClose: () => void;
  onSubmit: (task: {
    assignedToId: string;
    assignedToName: string;
    title: string;
    description: string;
    priority: 'عادی' | 'مهم' | 'فوری';
    isGlobal: boolean;
  }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  profiles,
  onClose,
  onSubmit,
}) => {
  const [targetId, setTargetId] = useState<'ALL' | string>('ALL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'عادی' | 'مهم' | 'فوری'>('مهم');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const isGlobal = targetId === 'ALL';
    const assignedPerson = profiles.find((p) => p.id === targetId);
    const assignedToName = isGlobal ? 'همگانی // کلیه پرسنل' : assignedPerson?.fullName || 'پرسنل';

    onSubmit({
      assignedToId: targetId,
      assignedToName,
      title: title.trim(),
      description: description.trim(),
      priority,
      isGlobal,
    });

    setTitle('');
    setDescription('');
    setTargetId('ALL');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141413] border border-[#5DF8D8]/50 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-right">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">add_task</span>
            تعریف وظیفه جدید
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-[#A3A39E] block mb-1">ارجاع به:</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
            >
              <option value="ALL">🌐 تسک همگانی (همه پرسنل فروشگاه)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  👤 {p.fullName} ({p.roleTitle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#A3A39E] block mb-1">عنوان وظیفه:</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تحویل فاکتورها و بررسی موجودی انبار"
              className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-[#A3A39E] block mb-1">توضیحات تکمیلی (اختیاری):</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="دستورالعمل و جزئیات انجام کار..."
              className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs text-[#A3A39E] block mb-1">اولویت وظیفه:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-[#0E0E0D] border border-white/10 rounded-lg p-2 text-xs text-white focus:border-[#5DF8D8] outline-none"
            >
              <option value="عادی">عادی</option>
              <option value="مهم">مهم</option>
              <option value="فوری">فوری</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              onClick={() => sound.play('tap')}
              className="flex-1 py-2 px-4 bg-[#5DF8D8] text-[#0A2821] font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(93,248,216,0.3)]"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>ثبت و ابلاغ وظیفه</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 bg-[#232321] text-white rounded-lg text-xs"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
