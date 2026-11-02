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
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('2077_remembered_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [persistentSession, setPersistentSession] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFirstRunHelp, setShowFirstRunHelp] = useState(false);
  const [livePing, setLivePing] = useState(8);

  useEffect(() => {
    // Measure actual local execution latency
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

        // Register push notifications
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
        {/* Dynamic Diagnostics & Top Micro Bar */}
        <div className="flex items-center justify-between w-full mb-space-lg text-[#5DF8D8] opacity-90">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#5DF8D8] animate-ping"></span>
            <span className="font-tech-micro text-tech-micro tracking-widest uppercase">
              NODE // STORE-SYS-2077
            </span>
          </div>
          <div className="font-tech-micro text-tech-micro tracking-wider uppercase flex items-center gap-1.5">
            <span>PING: {livePing}ms</span>
            <span className="text-[#F62477]">●</span>
            <span>ایمن // AES-256</span>
          </div>
        </div>

        {/* Central Authentication Terminal Box */}
        <div className="relative w-full bg-[#141413]/95 border border-[#5DF8D8]/20 backdrop-blur-md p-space-lg shadow-2xl overflow-hidden [clip-path:polygon(18px_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%,0_18px)]">
          {/* Subtle 2077 Brand Watermark in Terminal Background */}
          <div className="absolute -bottom-10 -left-10 w-48 h-48 opacity-[0.06] pointer-events-none select-none">
            <img src={getAssetUrl('/brand/logo-white.png')} alt="" className="w-full h-full object-contain" />
          </div>

          {/* Decorative Tech Reticles */}
          <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none flex items-start justify-end p-1">
            <span className="font-tech-micro text-tech-micro text-[#5DF8D8] font-bold">⌁01</span>
          </div>
          <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none flex items-end justify-start p-1">
            <span className="font-tech-micro text-tech-micro text-[#5DF8D8] font-bold">⌁02</span>
          </div>

          {/* Emblem Container */}
          <div className="flex flex-col items-center justify-center pt-space-xs pb-space-md">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#F62477]/15 rounded-xl blur-xl animate-pulse"></div>
              <img
                alt="SYS.2077 Official Insignia"
                className="relative w-20 h-auto object-contain drop-shadow-[0_0_16px_rgba(246,36,119,0.7)] hover:scale-105 transition-transform"
                src={EMBLEM_URL}
              />
            </div>

            {/* Security Level Badge */}
            <div className="mt-space-xs inline-flex items-center gap-1.5 px-space-sm py-0.5 bg-[#282826] rounded-none [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]">
              <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">
                verified_user
              </span>
              <span className="font-tech-micro text-[11px] text-[#F5F5F5]">
                پایانه امن پرسنلی فروشگاه ۲۰۷۷
              </span>
            </div>

            {/* Main Titles */}
            <h1 className="font-display-sm text-2xl text-[#F5F5F5] text-center mt-space-sm font-extrabold tracking-tight">
              سامانه جامع پرسنل ۲۰۷۷
            </h1>
            <p className="font-tech-micro text-[11px] text-[#5DF8D8] tracking-wider uppercase mt-1">
              SYS.2077 // SECURE ACCESS TERMINAL
            </p>
            <p className="font-body-sm text-body-sm text-[#9E9E9C] text-center mt-1">
              جهت ورود، نام کاربری و رمز عبور اختصاصی خود را وارد کنید
            </p>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="mb-3 p-2.5 bg-[#F62477]/15 border border-[#F62477]/40 rounded text-[#F62477] text-xs text-center font-medium shadow-[0_0_10px_rgba(246,36,119,0.2)]">
              {errorMsg}
            </div>
          )}

          {/* Form Section */}
          <form className="flex flex-col gap-space-md mt-space-sm" onSubmit={handleSubmit}>
            {/* Input 1: Username / Staff ID */}
            <div className="flex flex-col gap-1.5 text-right">
              <div className="flex justify-between items-center px-1">
                <label className="font-title-sm text-body-sm text-[#F5F5F5] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">badge</span>
                  نام کاربری / شماره داخلی / همراه
                </label>
                <span className="font-tech-micro text-tech-micro text-[#9E9E9C] uppercase">
                  // USER_ID
                </span>
              </div>
              <div className="relative flex items-center bg-[#0D0D0C] [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)] shadow-inner">
                <span className="material-symbols-outlined text-[#6B6B67] pr-space-md pl-space-xs text-title-sm pointer-events-none">
                  fingerprint
                </span>
                <input
                  autoComplete="username"
                  className="w-full bg-transparent py-space-md pl-space-md text-[#5DF8D8] font-code-md text-code-md placeholder:text-[#555551] focus:outline-none transition-all placeholder:text-right"
                  dir="ltr"
                  placeholder="نام کاربری، شماره داخلی (مثال: 101) یا همراه"
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#5DF8D8]/40"></div>
              </div>
            </div>

            {/* Input 2: Cyber Passcode */}
            <div className="flex flex-col gap-1.5 text-right">
              <div className="flex justify-between items-center px-1">
                <label className="font-title-sm text-body-sm text-[#F5F5F5] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">lock</span>
                  رمز عبور شبکه
                </label>
                <span className="font-tech-micro text-tech-micro text-[#9E9E9C] uppercase">
                  // ACCESS_KEY
                </span>
              </div>
              <div className="relative flex items-center bg-[#0D0D0C] [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)] shadow-inner">
                <span className="material-symbols-outlined text-[#6B6B67] pr-space-md pl-space-xs text-title-sm pointer-events-none">
                  vpn_key
                </span>
                <input
                  autoComplete="current-password"
                  className="w-full bg-transparent py-space-md pl-space-md text-[#5DF8D8] font-code-md text-code-md placeholder:text-[#3A3A38] focus:outline-none transition-all tracking-wider"
                  dir="ltr"
                  placeholder="••••••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  aria-label="تغییر نمایش رمز"
                  className="flex items-center justify-center px-space-md text-[#6B6B67] hover:text-[#5DF8D8] focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-title-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#5DF8D8]/40"></div>
              </div>
            </div>

            {/* Keep Session Active Checkbox */}
            <div
              className="flex items-center justify-between pt-1 select-none cursor-pointer"
              onClick={() => setPersistentSession(!persistentSession)}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 flex items-center justify-center transition-all duration-200 border ${
                    persistentSession
                      ? 'bg-[#F62477] border-[#F62477]'
                      : 'bg-[#0D0D0C] border-[#3A3A38]'
                  }`}
                >
                  {persistentSession && (
                    <span className="material-symbols-outlined text-white text-[16px] font-bold">
                      check
                    </span>
                  )}
                </div>
                <span className="font-body-sm text-body-sm text-[#9E9E9C]">
                  حفظ اتصال دائمی در این دستگاه
                </span>
              </div>
              <span className="font-tech-micro text-tech-micro text-[#6B6B67] uppercase">
                SESSION_PERSIST
              </span>
            </div>

            {/* Primary Action CTA Button */}
            <button
              className="w-full mt-space-sm py-space-md px-space-xl bg-[#F62477] text-white font-title-sm text-title-sm font-extrabold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)] shadow-[0_0_15px_rgba(246,36,119,0.4)] active:bg-[#5DF8D8] active:text-[#0A2821] disabled:opacity-50"
              disabled={isLoading}
              type="submit"
            >
              <span className="material-symbols-outlined text-title-sm">terminal</span>
              <span>{isLoading ? 'در حال تایید هویت...' : 'ورود به پایگاه داده // LOGIN'}</span>
            </button>

            {/* Professional Help Toggle */}
            <div className="flex flex-col items-center justify-center pt-space-xs text-center">
              <button
                type="button"
                onClick={() => setShowFirstRunHelp(!showFirstRunHelp)}
                className="font-tech-micro text-[11px] text-[#A3A39E] hover:text-[#5DF8D8] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">help_outline</span>
                <span>راهنمای راه‌اندازی و حساب پیش‌فرض ادمین</span>
              </button>

              {showFirstRunHelp && (
                <div className="mt-2 p-2.5 bg-[#1C1C1B] border border-[#5DF8D8]/30 rounded text-right text-xs text-[#F5F5F5] w-full flex flex-col gap-1.5 shadow-lg">
                  <div className="text-[#5DF8D8] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                    حساب اولیه مدیریت سیستم:
                  </div>
                  <div>
                    نام کاربری پیش‌فرض: <code className="text-[#F62477] font-bold">admin</code>
                  </div>
                  <div>
                    رمز اولیه کارخانه: <code className="text-[#F62477] font-bold">cyber2077</code> (در صورت عدم تغییر)
                  </div>
                  <div className="text-[10px] text-[#A3A39E] mt-1 pt-1 border-t border-[#2F2F2D]">
                    نکته: شما می‌توانید با هر یک از مشخصات (نام کاربری، شماره داخلی فروشگاه یا شماره موبایل) و اعداد فارسی یا انگلیسی وارد سیستم شوید.
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Bottom Diagnostic Telemetry */}
        <div className="mt-space-lg w-full flex flex-col items-center justify-center gap-1.5 opacity-80">
          <div className="flex items-center justify-center gap-3 text-[#5DF8D8] font-code-md text-tech-micro tracking-wider">
            <span>
              STATUS: <strong className="text-[#5DF8D8] font-bold">ACTIVE</strong>
            </span>
            <span>|</span>
            <span>
              HOST: <strong className="text-[#F5F5F5]">2077-STORE-CORE</strong>
            </span>
            <span>|</span>
            <span>
              BUILD: <strong className="text-[#F62477]">v2.0.0-PROD</strong>
            </span>
          </div>
          <div className="w-24 h-0.5 bg-[#2F2F2D]/50 flex items-center justify-center">
            <div className="w-6 h-full bg-[#5DF8D8] animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};