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
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [rawTableViewer, setRawTableViewer] = useState<'none' | 'profiles' | 'tasks'>('none');

  const refreshDbStats = () => {
    const stats = db.getDatabaseStats();
    setDbStats(stats);
    const cfg = db.getSupabaseConfig();
    setSupabaseUrlInput(cfg.url);
    setSupabaseKeyInput(cfg.anonKey);
  };

  useEffect(() => {
    refreshDbStats();
  }, []);

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
            {dbStats?.mode === 'supabase' ? 'متصل به سرور ابری Supabase' : 'پایگاه داده محلی (Safe Vault)'}
          </span>
        </div>

        <p className="text-xs text-[#9E9E9C] leading-relaxed">
          سیستم به صورت پیش‌فرض و ۱۰۰٪ مستقل روی حافظه ایمن محلی دستگاه شما ذخیره می‌شود. جهت همگام‌سازی لحظه‌ای میان تمام دستگاه‌ها، می‌توانید آدرس Supabase را در فرم زیر وارد کنید.
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

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-2.5 px-3 bg-[#5DF8D8]/15 hover:bg-[#5DF8D8] text-[#5DF8D8] hover:text-[#0A2821] border border-[#5DF8D8]/40 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(93,248,216,0.2)]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>دانلود نسخه پشتیبان (JSON)</span>
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

      {/* Supabase Cloud Connect Form */}
      <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
        <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">cloud_sync</span>
          اتصال به سرور ابری Supabase PostgreSQL
        </h4>

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
              <span>{isTestingSupabase ? 'در حال تست...' : 'ذخیره و تست اتصال'}</span>
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
              حالت محلی
            </button>
          </div>
        </form>
      </section>

      {/* Raw Database Table Inspector */}
      <section className="bg-[#141413] border border-[#5DF8D8]/30 p-space-md rounded-xl flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="font-title-sm text-sm text-[#F5F5F5] font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#5DF8D8]">table_view</span>
            کاوشگر زنده جداول (Data Inspector)
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRawTableViewer(rawTableViewer === 'profiles' ? 'none' : 'profiles')}
              className={`px-2 py-1 text-xs rounded border transition-all ${
                rawTableViewer === 'profiles' ? 'bg-[#5DF8D8] text-[#0A2821] font-bold' : 'bg-[#0E0E0D] text-[#A3A39E] border-[#252523]'
              }`}
            >
              پرسنل
            </button>
            <button
              onClick={() => setRawTableViewer(rawTableViewer === 'tasks' ? 'none' : 'tasks')}
              className={`px-2 py-1 text-xs rounded border transition-all ${
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
