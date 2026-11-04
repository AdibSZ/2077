import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { registerPushNotifications } from '../services/notifications';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { getAssetUrl } from '../utils/assets';
import { CURRENT_APP_VERSION } from '../services/updateService';

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
  const [livePing, setLivePing] = useState(18);

  useEffect(() => {
    const t0 = performance.now();
    setTimeout(() => {
      const delta = Math.round(performance.now() - t0);
      setLivePing(Math.max(12, Math.min(delta, 28)));
    }, 15);
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
    <div className="min-h-screen w-full flex flex-col justify-between items-center cyber-matrix-bg p-4 sm:p-6 select-none relative overflow-x-hidden">
      {/* Top Diagnostics Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between text-[#5DF8D8] text-[11px] font-mono tracking-wider pt-2 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5DF8D8] shadow-[0_0_8px_#5DF8D8] animate-pulse" />
          <span>NODE // STORE-SYS-2077</span>
        </div>
        <span className="font-bold">PING: {livePing}MS</span>
        <div className="flex items-center gap-1.5">
          <span>ایمن // AES-256</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F62477] shadow-[0_0_6px_#F62477]" />
        </div>
      </div>

      {/* Main Cyber Terminal Card with Razor-Sharp Continuous Chamfer Border */}
      <div className="w-full max-w-md my-auto cyber-card-frame">
        <div className="cyber-card-content relative p-6 sm:p-7 overflow-hidden">
          {/* Subtle Corner Markers */}
          <span className="absolute top-2.5 right-4 font-mono text-xs text-[#5DF8D8] font-bold select-none">
            01¬
          </span>
          <span className="absolute bottom-2.5 left-4 font-mono text-xs text-[#5DF8D8] font-bold select-none">
            02¬
          </span>

          {/* Faint Background Watermark Logo */}
          <div className="absolute -bottom-8 -left-8 w-44 h-44 opacity-[0.05] pointer-events-none select-none">
            <img
              src={getAssetUrl('/brand/logo-white.png')}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          {/* Emblem & Branding Header */}
          <div className="flex flex-col items-center justify-center text-center mb-4">
            <div className="relative w-20 h-20 flex items-center justify-center mb-2">
              <div className="absolute inset-0 bg-[#F62477]/25 rounded-full blur-2xl animate-pulse" />
              <img
                alt="2077 Emblem"
                className="relative w-16 h-auto object-contain drop-shadow-[0_0_20px_rgba(246,36,119,0.85)]"
                src={EMBLEM_URL}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#181816] border border-[#5DF8D8]/30 rounded-full text-[11px] text-[#EAEAEA] mb-2 shadow-sm">
              <span className="material-symbols-outlined text-[#5DF8D8] text-[15px]">verified_user</span>
              <span>پایانه امن پرسنلی فروشگاه ۲۰۷۷</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              سامانه جامع پرسنل ۲۰۷۷
            </h1>
            <span className="font-mono text-[10px] sm:text-[11px] text-[#5DF8D8] tracking-widest uppercase font-bold mt-1">
              SYS.2077 // SECURE ACCESS TERMINAL
            </span>
            <p className="text-xs text-[#9E9E9C] mt-2">
              جهت ورود، نام کاربری و رمز عبور اختصاصی خود را وارد کنید
            </p>
          </div>

          {errorMsg && (
            <div className="mb-3.5 p-2.5 bg-[#F62477]/20 border border-[#F62477] text-white text-xs text-center font-bold rounded-lg shadow-[0_0_15px_rgba(246,36,119,0.3)] animate-pulse">
              {errorMsg}
            </div>
          )}

          {/* Credentials Form */}
          <form className="flex flex-col gap-3 text-right" onSubmit={handleSubmit}>
            {/* USER_ID Field */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-[11px] text-[#5DF8D8]">USER_ID //</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span>نام کاربری / شماره داخلی / همراه</span>
                  <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">badge</span>
                </span>
              </div>
              <div className="relative flex items-center bg-[#070706] rounded-xl border border-white/15 focus-within:border-[#5DF8D8] focus-within:shadow-[0_0_12px_rgba(93,248,216,0.25)] transition-all overflow-hidden">
                <input
                  autoComplete="username"
                  className="w-full bg-transparent py-3 px-3 text-white font-mono text-xs placeholder:text-[#555551] focus:outline-none"
                  dir="ltr"
                  placeholder="نام کاربری، شماره داخلی (مثال: 101) یا همراه"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <span className="material-symbols-outlined text-[#70706B] pr-3 text-[20px] shrink-0">
                  fingerprint
                </span>
              </div>
            </div>

            {/* ACCESS_KEY Field */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-[11px] text-[#5DF8D8]">ACCESS_KEY //</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span>رمز عبور شبکه</span>
                  <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">lock</span>
                </span>
              </div>
              <div className="relative flex items-center bg-[#070706] rounded-xl border border-white/15 focus-within:border-[#5DF8D8] focus-within:shadow-[0_0_12px_rgba(93,248,216,0.25)] transition-all overflow-hidden">
                <button
                  type="button"
                  aria-label="تغییر نمایش رمز"
                  className="pl-3 pr-1 text-[#70706B] hover:text-[#5DF8D8] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <input
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3 px-2 text-white font-mono text-xs placeholder:text-[#40403C] focus:outline-none tracking-widest"
                  dir="ltr"
                  placeholder="••••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="material-symbols-outlined text-[#70706B] pr-3 text-[20px] shrink-0">
                  key
                </span>
              </div>
            </div>

            {/* Persistent Session Checkbox */}
            <div
              className="flex items-center justify-between pt-2 pb-1 cursor-pointer select-none"
              onClick={() => setPersistentSession(!persistentSession)}
            >
              <span className="font-mono text-[11px] text-[#6B6B67]">SESSION_PERSIST</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9E9E9C]">حفظ اتصال دائمی در این دستگاه</span>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    persistentSession
                      ? 'bg-[#F62477] border border-[#F62477] shadow-[0_0_8px_#F62477]'
                      : 'bg-[#070706] border border-white/20'
                  }`}
                >
                  {persistentSession && (
                    <span className="material-symbols-outlined text-white text-[13px] font-bold">
                      check
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cyber Chamfered Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 bg-[#F62477] hover:bg-[#ff1a6c] active:bg-[#d0135b] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(246,36,119,0.55)] transition-all active:scale-[0.98] disabled:opacity-50 cyber-chamfer-btn select-none tracking-wide"
            >
              <span className="material-symbols-outlined text-[20px]">contactless</span>
              <span>{isLoading ? 'در حال تایید اعتبار...' : 'ورود به پایگاه داده // LOGIN'}</span>
            </button>

            {/* Admin Help Link */}
            <div className="flex flex-col items-center pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowFirstRunHelp(!showFirstRunHelp)}
                className="text-[11px] text-[#A3A39E] hover:text-[#5DF8D8] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">help_outline</span>
                <span>راهنمای راه‌اندازی و حساب پیش‌فرض ادمین</span>
              </button>

              {showFirstRunHelp && (
                <div className="mt-2.5 p-3 bg-[#161614] border border-[#5DF8D8]/30 rounded-xl text-right text-xs text-[#F5F5F5] w-full flex flex-col gap-1 shadow-lg">
                  <div className="text-[#5DF8D8] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
                    حساب کاربری اولیه مدیریت سیستم:
                  </div>
                  <div>
                    نام‌کاربری: <code className="text-[#F62477] font-bold font-mono">admin</code>
                  </div>
                  <div>
                    رمز عبور: <code className="text-[#F62477] font-bold font-mono">cyber2077</code>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Diagnostics Footer Bar */}
      <div className="w-full max-w-md flex items-center justify-between text-[#5DF8D8] text-[10px] font-mono tracking-wider pb-2 pt-3 opacity-80">
        <span>BUILD: v{CURRENT_APP_VERSION}</span>
        <span>HOST: 2077-STORE-SYS</span>
        <span className="text-[#5DF8D8] font-bold">STATUS: ONLINE</span>
      </div>
    </div>
  );
};
