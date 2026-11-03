import { UserProfile, Announcement, Task } from '../../types';

export const STORAGE_KEYS = {
  VERSION: '2077_store_version_v2',
  AUTH_SESSION: '2077_auth_session',
  PROFILES: '2077_profiles_data',
  GAME_SCORES: '2077_game_scores_data',
  ANNOUNCEMENTS: '2077_announcements_data',
  TASKS: '2077_tasks_data',
  SAFE_BACKUP: '2077_safe_vault_backup',
};

/**
 * Universal Digits Normalizer: Maps Persian and Arabic digits to standard ASCII digits.
 */
export function normalizeDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return String(val)
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');
}

/**
 * Universal Text Normalizer: Normalizes digits, trims, unifies Arabic/Persian Yeh/Kaf,
 * and strips invisible zero-width characters for flawless credential comparisons.
 */
export function normalizePersianText(val: string | undefined | null): string {
  if (!val) return '';
  return normalizeDigits(val)
    .trim()
    .toLowerCase()
    .replace(/[\u200C\u200B\u200E\u200F\uFEFF]/g, '')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/\s+/g, ' ');
}

// Fallback seed profile ONLY created if storage is completely empty
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'admin',
    passwordHash: 'cyber2077',
    fullName: 'مدیر ارشد سیستم ۲۰۷۷',
    roleTitle: 'فرمانده عملیات // SYSTEM ADMIN',
    department: 'CORE-SYS',
    avatarUrl: '/avatars/admin.svg',
    birthDay: 1,
    birthMonth: 'فروردین',
    birthMonthNum: 1,
    birthYear: 1370,
    phoneNumber: '09120002077',
    internalExt: '101',
    isAdmin: true,
    isOnline: true,
    shiftName: 'شیفت روز',
    bankedXp: 0,
    crownsCount: 0,
    totalCp: 0,
  },
];

export const INITIAL_ANNOUNCEMENT: Announcement = {
  id: 'ann-01',
  title: 'تابلوی اعلانات فروشگاه ۲۰۷۷',
  content: 'به سامانه ۲۰۷۷ خوش آمدید. وظایف و شیفت‌ها فعال است.',
  priority: 'عادی',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-init-01',
    title: 'بررسی وضعیت موجودی و آماده‌سازی سیستم‌ها',
    description: 'چک‌لیست اولیه ورود به شیفت فروشگاه ۲۰۷۷',
    assignedToId: 'ALL',
    assignedToName: 'همه پرسنل',
    createdById: '00000000-0000-0000-0000-000000000001',
    createdByName: 'مدیر ارشد سیستم ۲۰۷۷',
    isGlobal: true,
    isCompleted: false,
    priority: 'مهم',
    createdAt: new Date().toISOString(),
  },
];
