import React, { useState, useEffect } from 'react';
import { DatabaseStats } from '../../types';
import { db } from '../../services/db';
import { sound } from '../../utils/audio';
import { triggerHaptic } from '../../utils/haptics';
import { toPersianDigits } from '../../utils/jalali';

interface DatabaseManagerProps {
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ onRefresh, showToast }) => {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [rawTableViewer, setRawTableViewer] = useState<'none' | 'profiles' | 'tasks'>('none');
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshDbStats = () => {
    const stats = db.getDatabaseStats();
    setDbStats(stats);
  };

  useEffect(() => {
    refreshDbStats();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    sound.play('tap');
    try {
      await db.flushSyncQueue();
      sound.play('score');
      triggerHaptic('success');
      showToast('اطلاعات با سرور ابری Supabase همگام‌سازی شد.');
      refreshDbStats();
      onRefresh();
    } catch {
      showToast('خطا در برقراری ارتباط با سرور ابری');
    } finally {
      setIsSyncing(false);
    }
  };

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

  return (
    <div className="flex flex-col gap-space-md">
      {/* Status Overview Card */}
      <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#252523] pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5DF8D8] text-[22px]">cloud_done</span>
            <h3 className="font-title-sm text-base text-[#F5F5F5] font-bold">
              وضعیت موتور ابری دیتابیس (Cloud Engine)
            </h3>
          </div>
          <span className="text-xs px-2.5 py-1 rounded font-bold bg-[#5DF8D8]/20 text-[#5DF8D8] border border-[#5DF8D8]/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5DF8D8] animate-pulse" />
            <span>متصل به سرور ابری Supabase</span>
          </span>
        </div>

        <p className="text-xs text-[#9E9E9C] leading-relaxed">
          سامانه مستقیماً به سرور ابری Supabase متصل است. تمامی کاربران، رکوردهای بازی، تسک‌ها و اعلانات به طور بلادرنگ میان کلیه دستگاه‌ها (گوشی، تبلت و کامپیوتر) همگام‌سازی می‌شوند.
        </p>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2 bg-[#0E0E0D] border border-[#5DF8D8]/20 rounded-lg">
            <span className="text-[10px] text-[#A3A39E] block">پرسنل ثبت‌شده</span>
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
            <span className="text-[10px] text-[#A3A39E] block">وظایف فعال</span>
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

        {/* Manual Cloud Sync Button */}
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full mt-1 py-2.5 px-3 bg-[#5DF8D8]/15 hover:bg-[#5DF8D8] text-[#5DF8D8] hover:text-[#0A2821] border border-[#5DF8D8]/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(93,248,216,0.2)] disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>{isSyncing ? 'در حال همگام‌سازی با سرور ابری...' : 'همگام‌سازی فوری با سرور ابری (Cloud Sync)'}</span>
        </button>
      </section>

      {/* Backup & Restore Controls */}
      <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
        <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">backup</span>
          پشتیبان‌گیری و انتقال داده‌ها (Export / Import JSON)
        </h4>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-2.5 px-3 bg-[#5DF8D8]/15 hover:bg-[#5DF8D8] text-[#5DF8D8] hover:text-[#0A2821] border border-[#5DF8D8]/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(93,248,216,0.2)]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>دانلود فایل پشتیبان (JSON)</span>
          </button>

          <label className="py-2.5 px-3 bg-[#232321] hover:bg-[#32322F] text-[#F5F5F5] border border-white/10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>بازیابی از فایل (Restore)</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportBackup}
            />
          </label>
        </div>
      </section>

      {/* Raw Database Table Inspector */}
      <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">table_view</span>
            کاوشگر زنده داده‌ها (Data Inspector)
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRawTableViewer(rawTableViewer === 'profiles' ? 'none' : 'profiles')}
              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                rawTableViewer === 'profiles' ? 'bg-[#5DF8D8] text-[#0A2821] font-bold' : 'bg-[#0E0E0D] text-[#A3A39E] border-[#252523]'
              }`}
            >
              پرسنل
            </button>
            <button
              onClick={() => setRawTableViewer(rawTableViewer === 'tasks' ? 'none' : 'tasks')}
              className={`px-2.5 py-1 text-xs rounded border transition-all ${
                rawTableViewer === 'tasks' ? 'bg-[#5DF8D8] text-[#0A2821] font-bold' : 'bg-[#0E0E0D] text-[#A3A39E] border-[#252523]'
              }`}
            >
              وظایف
            </button>
          </div>
        </div>

        {rawTableViewer !== 'none' && (
          <div className="mt-2 bg-[#0A0A09] border border-[#5DF8D8]/20 p-3 rounded-lg overflow-x-auto max-h-60 text-left font-code-md text-xs text-[#5DF8D8]" dir="ltr">
            <pre>
              {rawTableViewer === 'profiles'
                ? JSON.stringify(db.getProfiles(), null, 2)
                : JSON.stringify(db.getTasks(), null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
};
