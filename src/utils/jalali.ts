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
