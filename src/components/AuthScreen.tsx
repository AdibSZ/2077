import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { registerPushNotifications } from '../services/notifications';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { getAssetUrl } from '../utils/assets';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const EMBLEM_URL = getAssetUrl('/brand/logo-magenta.png');

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('2077_remembered_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [persistentSession, setPersistentSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFirstRunHelp, setShowFirstRunHelp] = useState(false);
  const [livePing, setLivePing] = useState(8);

  useEffect(() => {
    const t0 = performance.now();
    setTimeout(() => {
      const delta = Math.round(performance.now() - t0);
      setLivePing(Math.max(2, Math.min(delta, 18)));
    }, 10);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    sound.play('tap');

    try {
      const res = await db.login(username, password);
      if (res.user) {
        sound.play('score');
        triggerHaptic('success');
        if (persistentSession) {
          localStorage.setItem('2077_remembered_username', username.trim());
        }
        registerPushNotifications(res.user.id);
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'نام کاربری یا رمز عبور نامعتبر است');
        sound.play('gameover');
        triggerHaptic('error');
      }
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با پایگاه داده پایانه!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full min-h-screen px-gutter py-space-lg relative z-10 select-none">
      <div className="w-full max-w-md flex flex-col">
        {/* Dynamic Diagnostics */}
        <div className="flex items-center justify-between w-full mb-space-lg text-[#5DF8D8] opacity-90">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#5DF8D8] animate-ping" />
            <span className="font-tech-micro text-tech-micro tracking-widest uppercase">NODE // STORE-SYS-2077</span>
          </div>
          <div className="font-tech-micro text-tech-micro tracking-wider uppercase flex items-center gap-1.5">
            <span>PING: {livePing}ms</span>
            <span className="text-[#F62477]">●</span>
            <span>ایمن // AES-256</span>
          </div>
        </div>

        {/* Central Terminal Box */}
        <div className="relative w-full bg-[#141413]/95 border border-[#5DF8D8]/20 backdrop-blur-md p-space-lg shadow-2xl overflow-hidden [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)]">
          <div className="absolute -bottom-10 -left-10 w-48 h-48 opacity-[0.06] pointer-events-none select-none">
            <img src={getAssetUrl('/brand/logo-white.png')} alt="" className="w-full h-full object-contain" />
          </div>

          {/* Emblem & Title */}
          <div className="flex flex-col items-center justify-center pt-space-xs pb-space-md text-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-2">
              <div className="absolute inset-0 bg-[#F62477]/15 rounded-xl blur-xl animate-pulse" />
              <img
                alt="2077 Family Logo"
                className="relative w-18 h-auto object-contain drop-shadow-[0_0_16px_rgba(246,36,119,0.7)]"
                src={EMBLEM_URL}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#282826] rounded text-[11px] text-[#F5F5F5] mb-1">
              <span className="material-symbols-outlined text-[#5DF8D8] text-[15px]">verified_user</span>
              <span>سامانه هوشمند پرسنل ۲۰۷۷</span>
            </div>

            <h1 className="font-display-sm text-2xl text-[#F5F5F5] font-extrabold tracking-tight mt-1">2077 Family</h1>
            <p className="font-body-sm text-xs text-[#9E9E9C] mt-1">
              جهت ورود، نام کاربری و رمز عبور اختصاصی خود را وارد کنید
            </p>
          </div>

          {errorMsg && (
            <div className="mb-3 p-2.5 bg-[#F62477]/15 border border-[#F62477]/40 rounded text-[#F62477] text-xs text-center font-medium shadow-[0_0_10px_rgba(246,36,119,0.2)]">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-space-md mt-space-sm" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 text-right">
              <label className="text-body-sm text-[#F5F5F5] flex items-center gap-1 font-semibold text-xs">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">badge</span>
                نام کاربری / شماره داخلی / همراه
              </label>
              <div className="relative flex items-center bg-[#0D0D0C] rounded-lg border border-white/10 shadow-inner">
                <span className="material-symbols-outlined text-[#6B6B67] pr-3 pl-1 text-[18px]">fingerprint</span>
                <input
                  autoComplete="username"
                  className="w-full bg-transparent py-2.5 pl-3 text-[#5DF8D8] font-mono text-xs placeholder:text-[#555551] focus:outline-none"
                  dir="ltr"
                  placeholder="admin یا نام کاربری یا داخلی"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-right">
              <label className="text-body-sm text-[#F5F5F5] flex items-center gap-1 font-semibold text-xs">
                <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">lock</span>
                رمز عبور ورود
              </label>
              <div className="relative flex items-center bg-[#0D0D0C] rounded-lg border border-white/10 shadow-inner">
                <span className="material-symbols-outlined text-[#6B6B67] pr-3 pl-1 text-[18px]">vpn_key</span>
                <input
                  autoComplete="current-password"
                  className="w-full bg-transparent py-2.5 pl-3 text-[#5DF8D8] font-mono text-xs placeholder:text-[#3A3A38] focus:outline-none tracking-wider"
                  dir="ltr"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label="تغییر نمایش رمز"
                  className="px-3 text-[#6B6B67] hover:text-[#5DF8D8]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div
              className="flex items-center justify-between pt-1 cursor-pointer"
              onClick={() => setPersistentSession(!persistentSession)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 flex items-center justify-center border rounded ${persistentSession ? 'bg-[#F62477] border-[#F62477]' : 'bg-[#0D0D0C] border-[#3A3A38]'}`}>
                  {persistentSession && <span className="material-symbols-outlined text-white text-[13px] font-bold">check</span>}
                </div>
                <span className="text-xs text-[#9E9E9C]">حفظ اتصال دائمی</span>
              </div>
              <span className="font-tech-micro text-[10px] text-[#6B6B67]">SESSION_PERSIST</span>
            </div>

            <button
              className="w-full mt-2 py-3 px-4 bg-[#F62477] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(246,36,119,0.4)] active:bg-[#5DF8D8] active:text-[#0A2821] disabled:opacity-50 transition-all active:scale-[0.98]"
              disabled={isLoading}
              type="submit"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{isLoading ? 'در حال تایید...' : 'ورود به سامانه // LOGIN'}</span>
            </button>

            <div className="flex flex-col items-center pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowFirstRunHelp(!showFirstRunHelp)}
                className="text-[11px] text-[#A3A39E] hover:text-[#5DF8D8] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">help_outline</span>
                <span>راهنمای حساب اولیه مدیر سیستم</span>
              </button>

              {showFirstRunHelp && (
                <div className="mt-2 p-2.5 bg-[#1C1C1B] border border-[#5DF8D8]/30 rounded text-right text-xs text-[#F5F5F5] w-full flex flex-col gap-1 shadow-lg">
                  <div className="text-[#5DF8D8] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                    حساب اولیه مدیریت:
                  </div>
                  <div>یوزرنیم پیش‌فرض: <code className="text-[#F62477] font-bold">admin</code></div>
                  <div>رمز اولیه: <code className="text-[#F62477] font-bold">cyber2077</code></div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Diagnostics Footer */}
        <div className="mt-space-lg w-full flex flex-col items-center justify-center gap-1.5 opacity-80 text-[10px] text-[#5DF8D8]">
          <div className="flex items-center gap-3">
            <span>STATUS: <strong>ACTIVE</strong></span>
            <span>|</span>
            <span>CORE: <strong>2077 FAMILY</strong></span>
            <span>|</span>
            <span>BUILD: <strong className="text-[#F62477]">v2.5.0</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
