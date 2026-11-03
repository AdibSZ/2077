import { UserProfile, Task, Announcement } from '../../types';
import { isUUID, generateUUID } from './supabaseClient';

export function toCloudProfile(p: UserProfile): Record<string, any> {
  const safeId = isUUID(p.id) ? p.id : generateUUID();
  return {
    id: safeId,
    username: p.username,
    password_hash: p.passwordHash,
    full_name: p.fullName,
    role_title: p.roleTitle || 'پرسنل',
    department: p.department || 'FRONT-DESK',
    avatar_url: p.avatarUrl || '/avatars/avatar1.svg',
    birth_day: Number(p.birthDay) || 1,
    birth_month: p.birthMonth || 'فروردین',
    birth_month_num: Number(p.birthMonthNum) || 1,
    birth_year: Number(p.birthYear) || 1375,
    is_admin: Boolean(p.isAdmin),
    is_online: Boolean(p.isOnline),
    shift_name: p.shiftName || 'شیفت روز',
    phone_number: p.phoneNumber || null,
    internal_ext: p.internalExt || null,
    banked_xp: Number(p.bankedXp) || 0,
    crowns_count: Number(p.crownsCount) || 0,
    total_cp: Number(p.totalCp) || 0,
    push_subscription: p.pushSubscription ? JSON.stringify(p.pushSubscription) : null,
  };
}

export function fromCloudProfile(row: Record<string, any>): UserProfile {
  let pushSub = undefined;
  if (row.push_subscription) {
    try {
      pushSub = typeof row.push_subscription === 'string' ? JSON.parse(row.push_subscription) : row.push_subscription;
    } catch {}
  }

  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    roleTitle: row.role_title,
    department: row.department,
    avatarUrl: row.avatar_url,
    birthDay: row.birth_day,
    birthMonth: row.birth_month,
    birthMonthNum: row.birth_month_num,
    birthYear: row.birth_year,
    isAdmin: Boolean(row.is_admin),
    isOnline: Boolean(row.is_online),
    shiftName: row.shift_name,
    phoneNumber: row.phone_number || undefined,
    internalExt: row.internal_ext || undefined,
    bankedXp: row.banked_xp || 0,
    crownsCount: row.crowns_count || 0,
    totalCp: row.total_cp || 0,
    pushSubscription: pushSub,
  };
}

export function toCloudTask(t: Task): Record<string, any> {
  const safeId = isUUID(t.id) ? t.id : generateUUID();
  const assignedId = t.assignedToId && isUUID(t.assignedToId) ? t.assignedToId : null;
  return {
    id: safeId,
    title: t.title,
    description: t.description || '',
    assigned_to_id: assignedId,
    assigned_to_name: t.assignedToName || 'همه پرسنل',
    is_completed: Boolean(t.isCompleted),
    priority: t.priority || 'عادی',
  };
}

export function fromCloudTask(row: Record<string, any>): Task {
  const isGlobal = !row.assigned_to_id || row.assigned_to_id === '00000000-0000-0000-0000-000000000000';
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    assignedToId: isGlobal ? 'ALL' : row.assigned_to_id,
    assignedToName: row.assigned_to_name || (isGlobal ? 'همه پرسنل' : ''),
    isGlobal,
    isCompleted: Boolean(row.is_completed),
    priority: (row.priority || 'عادی') as 'عادی' | 'مهم' | 'فوری',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function toCloudAnnouncement(a: Announcement): Record<string, any> {
  const safeId = isUUID(a.id) ? a.id : generateUUID();
  return {
    id: safeId,
    title: a.title,
    content: a.content || '',
    priority: a.priority || 'عادی',
    is_active: a.isActive !== false,
  };
}

export function fromCloudAnnouncement(row: Record<string, any>): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    priority: (row.priority || 'عادی') as 'عادی' | 'مهم' | 'فوری',
    isActive: row.is_active !== false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function toCloudGameScore(gameId: string, userId: string, score: number): Record<string, any> {
  return {
    game_id: gameId,
    user_id: userId,
    high_score: score,
  };
}
