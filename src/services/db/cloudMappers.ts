import { UserProfile, Task, Announcement } from '../../types';

export function toCloudProfile(p: UserProfile): Record<string, any> {
  return {
    id: p.id,
    username: p.username,
    password_hash: p.passwordHash,
    full_name: p.fullName,
    role_title: p.roleTitle,
    department: p.department,
    avatar_url: p.avatarUrl,
    birth_day: p.birthDay,
    birth_month: p.birthMonth,
    birth_month_num: p.birthMonthNum,
    birth_year: p.birthYear,
    phone_number: p.phoneNumber || null,
    internal_ext: p.internalExt || null,
    is_admin: p.isAdmin,
    is_online: p.isOnline,
    shift_name: p.shiftName,
    banked_xp: p.bankedXp || 0,
    crowns_count: p.crownsCount || 0,
    total_cp: p.totalCp || 0,
  };
}

export function fromCloudProfile(row: any): UserProfile {
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
    phoneNumber: row.phone_number || undefined,
    internalExt: row.internal_ext || undefined,
    isAdmin: Boolean(row.is_admin),
    isOnline: Boolean(row.is_online),
    shiftName: row.shift_name,
    bankedXp: row.banked_xp || 0,
    crownsCount: row.crowns_count || 0,
    totalCp: row.total_cp || 0,
  };
}

export function toCloudTask(t: Task): Record<string, any> {
  return {
    id: t.id,
    assigned_to_id: t.isGlobal || t.assignedToId === 'ALL' ? null : t.assignedToId,
    assigned_to_name: t.assignedToName,
    title: t.title,
    description: t.description || '',
    priority: t.priority,
    is_completed: t.isCompleted,
    created_at: t.createdAt,
  };
}

export function fromCloudTask(row: any): Task {
  const isGlobal = !row.assigned_to_id || row.assigned_to_name.includes('همگانی');
  return {
    id: row.id,
    assignedToId: row.assigned_to_id || 'ALL',
    assignedToName: row.assigned_to_name,
    title: row.title,
    description: row.description || '',
    priority: row.priority || 'عادی',
    isCompleted: Boolean(row.is_completed),
    isGlobal,
    createdAt: row.created_at,
  };
}

export function toCloudAnnouncement(a: Announcement): Record<string, any> {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    is_active: a.isActive !== false,
  };
}

export function fromCloudAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    priority: row.priority || 'عادی',
    isActive: row.is_active !== false,
    createdAt: row.created_at,
  };
}
