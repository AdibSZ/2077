import React, { useState } from 'react';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { getAssetUrl } from '../utils/assets';
import { StaffManager } from './admin/StaffManager';
import { AnnouncementManager } from './admin/AnnouncementManager';
import { DatabaseManager } from './admin/DatabaseManager';

interface AdminPanelProps {
  profiles: UserProfile[];
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ profiles, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'staff' | 'announcement' | 'database'>('staff');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => {
      setStatusNotice(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg select-none pb-12">
      {/* Top Command & Credentials Strip */}
      <div className="relative bg-[#141413] border border-[#5DF8D8]/30 backdrop-blur-xl p-space-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between gap-space-sm relative z-10">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded bg-[#5DF8D8]/15 border border-[#5DF8D8]/30 flex items-center justify-center p-1.5 shadow-[0_0_12px_rgba(93,248,216,0.25)] shrink-0">
              <img
                src={getAssetUrl('/brand/logo-mint.png')}
                alt="2077 Admin"
                className="w-full h-full object-contain drop-shadow-[0_0_6px_#5DF8D8]"
              />
            </div>
            <div className="flex flex-col truncate text-right">
              <span className="font-tech-micro text-tech-micro text-[#A3A39E]">// ADMIN.TERMINAL</span>
              <span className="font-title-sm text-title-sm text-[#F5F5F5] truncate">
                مرکز مدیریت و فرماندهی عملیات ۲۰۷۷
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-space-sm py-1 bg-[#0E0E0D] border border-[#F62477]/40 rounded shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#F62477] animate-pulse shadow-[0_0_8px_#F62477]" />
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

      {/* Render Active Sub Tab */}
      {activeSubTab === 'staff' && (
        <StaffManager profiles={profiles} onRefresh={onRefresh} showToast={showToast} />
      )}

      {activeSubTab === 'announcement' && (
        <AnnouncementManager onRefresh={onRefresh} showToast={showToast} />
      )}

      {activeSubTab === 'database' && (
        <DatabaseManager onRefresh={onRefresh} showToast={showToast} />
      )}
    </div>
  );
};
