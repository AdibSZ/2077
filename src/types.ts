export type PresenceStatus = 'ON_DUTY' | 'IN_OPERATION' | 'BIO_BREAK' | 'OFF_LINE';

export interface UserProfile {
  presenceStatus?: PresenceStatus;
  presenceUpdatedAt?: string;
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  roleTitle: string;
  department: string;
  avatarUrl: string;
  birthDay: number;
  birthMonth: string;
  birthMonthNum: number;
  birthYear: number;
  isAdmin: boolean;
  isOnline: boolean;
  shiftName: string;
  phoneNumber?: string;
  internalExt?: string;
  bankedXp: number;
  crownsCount: number;
  totalCp: number;
  pushSubscription?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  assignedToId: string; // 'ALL' for global task, or specific user id
  assignedToName: string; // 'عمومی // کلیه پرسنل' or staff full name
  createdById?: string;
  createdByName?: string;
  title: string;
  description: string;
  priority: 'عادی' | 'مهم' | 'فوری';
  isCompleted: boolean;
  isGlobal?: boolean;
  completedAt?: string;
  completedByName?: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'game_score' | 'profile_update' | 'task_add' | 'task_toggle' | 'announcement';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export interface NetworkSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  cloudConnected: boolean;
}

export interface DatabaseStats {
  mode: 'local' | 'supabase';
  supabaseConnected: boolean;
  supabaseUrl?: string;
  profilesCount: number;
  gameScoresCount: number;
  tasksCount: number;
  announcementsCount: number;
  storageSizeKb: number;
  lastBackupDate?: string;
  pendingSyncCount?: number;
}

export type GameId =
  | 'cyber_stack'
  | 'breach_lock'
  | 'glitch_flap'
  | 'gravity_runner'
  | 'cyber_whack'
  | 'zero_ms'
  | 'orbit_jump'
  | 'chroma_switch'
  | 'core_injector'
  | 'neural_sequence';

export interface GameMetadata {
  id: GameId;
  nameFa: string;
  nameEn: string;
  multiplier: number;
  description: string;
  iconName: string;
  highScore?: number;
  crownHolderName?: string;
}

export interface GameScoreRecord {
  userId: string;
  userName: string;
  userAvatar?: string;
  gameId: GameId;
  highScore: number;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isActive: boolean;
  createdAt: string;
}

export type ActiveTab = 'staff' | 'tasks' | 'arcade' | 'admin';
