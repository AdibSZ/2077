// Pure TypeScript Jalali / Solar calendar utility for SYS.2077

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
] as const;

export function getMonthNumber(monthName: string): number {
  const index = PERSIAN_MONTHS.indexOf(monthName as any);
  return index !== -1 ? index + 1 : 1;
}

export function getMonthName(monthNum: number): string {
  if (monthNum >= 1 && monthNum <= 12) {
    return PERSIAN_MONTHS[monthNum - 1];
  }
  return PERSIAN_MONTHS[0];
}

/**
 * Converts Gregorian date to Jalali (Solar) date
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { jy, jm, jd };
}

export function getTodayJalali(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Calculate age based on Jalali birth year
 */
export function calculateAge(birthYear: number): number {
  const today = getTodayJalali();
  const age = today.jy - birthYear;
  return age > 0 ? age : 1;
}

/**
 * Formats birth date into Persian string (e.g. "۱۹ خرداد")
 */
export function formatBirthdate(day: number, month: string): string {
  return `${toPersianDigits(day)} ${month}`;
}

/**
 * Convert Latin digits to Persian digits
 */
export function toPersianDigits(input: string | number): string {
  const str = String(input);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

export interface BirthdayLevelInfo {
  level: number;
  nextLevel: number;
  progressPercent: number;
  daysRemaining: number;
  isToday: boolean;
  isUpcoming3Days: boolean;
}

export function getDayOfJalaliYear(monthNum: number, day: number): number {
  const m = Math.max(1, Math.min(12, monthNum));
  const d = Math.max(1, Math.min(31, day));
  return m <= 6 ? (m - 1) * 31 + d : 186 + (m - 7) * 30 + d;
}

/**
 * Calculates current level (age), progress to next level, and birthday proximity.
 */
export function getStaffLevelAndBirthdayInfo(
  birthYear: number,
  birthMonth: string | number,
  birthDay: number
): BirthdayLevelInfo {
  const today = getTodayJalali();
  const mNum = typeof birthMonth === 'number' ? birthMonth : getMonthNumber(birthMonth);
  const safeBirthYear = Number(birthYear) || 1375;
  const safeDay = Number(birthDay) || 1;

  const todayDoy = getDayOfJalaliYear(today.jm, today.jd);
  const birthDoy = getDayOfJalaliYear(mNum, safeDay);

  let daysRemaining: number;
  let elapsedSinceLastBday: number;
  let level: number;

  if (todayDoy === birthDoy) {
    daysRemaining = 0;
    elapsedSinceLastBday = 365;
    level = Math.max(1, today.jy - safeBirthYear);
  } else if (todayDoy < birthDoy) {
    daysRemaining = birthDoy - todayDoy;
    elapsedSinceLastBday = 365 - daysRemaining;
    level = Math.max(1, today.jy - safeBirthYear - 1);
  } else {
    daysRemaining = (365 - todayDoy) + birthDoy;
    elapsedSinceLastBday = todayDoy - birthDoy;
    level = Math.max(1, today.jy - safeBirthYear);
  }

  const progressPercent =
    daysRemaining === 0
      ? 100
      : Math.min(100, Math.max(0, Math.round((elapsedSinceLastBday / 365) * 100)));

  return {
    level,
    nextLevel: level + 1,
    progressPercent,
    daysRemaining,
    isToday: daysRemaining === 0,
    isUpcoming3Days: daysRemaining > 0 && daysRemaining <= 3,
  };
}
