import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserProfile,
  GameId,
  Announcement,
  Task,
  DatabaseStats,
  SyncQueueItem,
  NetworkSyncState,
} from '../types';

const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

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

const STORAGE_KEYS = {
  VERSION: '2077_store_version_v2',
  AUTH_SESSION: '2077_auth_session',
  PROFILES: '2077_profiles_data',
  GAME_SCORES: '2077_game_scores_data',
  ANNOUNCEMENTS: '2077_announcements_data',
  TASKS: '2077_tasks_data',
  SUPABASE_CONFIG: '2077_supabase_runtime_config',
  SYNC_QUEUE: '2077_sync_pending_queue',
  LAST_SYNC: '2077_last_cloud_sync_time',
  SAFE_BACKUP: '2077_safe_vault_backup',
};

// ONLY Admin user initially - all other staff added by Admin
const INITIAL_PROFILES: UserProfile[] = [
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

const INITIAL_GAME_SCORES: Record<string, { userId: string; userName: string; score: number }> = {};

const INITIAL_ANNOUNCEMENT: Announcement = {
  id: 'ann-01',
  title: 'تابلوی اعلانات فروشگاه مرکزی ۲۰۷۷',
  content: 'سیستم پرسنلی، لجستیک و چالش‌های آرکید فعال است. شیفت‌ها را بازبینی کنید.',
  priority: 'عادی',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-01',
    assignedToId: '00000000-0000-0000-0000-000000000001',
    assignedToName: 'مدیر ارشد سیستم ۲۰۷۷',
    title: 'بازبینی موجودی کنسول‌ها و گجت‌های ۲۰۷۷',
    description: 'بررسی سلامت بارکدها و استندهای ویترین فروشگاه برای شیفت روز',
    priority: 'مهم',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

class DatabaseService {
  private profiles: UserProfile[] = [];
  private gameScores: Record<string, { userId: string; userName: string; score: number }> = {};
  private announcement: Announcement = INITIAL_ANNOUNCEMENT;
  private tasks: Task[] = [];
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing: boolean = false;
  private lastSyncTime: string | null = null;
  private supabaseUrl: string = '';
  private supabaseKey: string = '';
  private syncListeners: Array<(state: NetworkSyncState) => void> = [];
  private realtimeChannel: any = null;

  constructor() {
    this.init();
    this.setupNetworkListeners();
  }

  private init() {
    // 1. Initialize Supabase client
    this.initSupabaseClient();

    // 2. Strict Data Persistence Guard: NEVER wipe user profiles, stats, or tasks on updates!
    if (!localStorage.getItem(STORAGE_KEYS.VERSION)) {
      localStorage.setItem(STORAGE_KEYS.VERSION, '2.0.0');
    }

    // 3. Load profiles (100% preservation guarantee + failsafe backup recovery)
    const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        this.profiles = parsed.length > 0 ? parsed : [...INITIAL_PROFILES];
      } catch {
        if (!this.tryRecoverFromSafeBackup()) {
          this.profiles = [...INITIAL_PROFILES];
        }
      }
    } else {
      if (!this.tryRecoverFromSafeBackup()) {
        this.profiles = [...INITIAL_PROFILES];
        this.saveProfilesLocally();
      }
    }

    // 4. Load game scores
    const savedScores = localStorage.getItem(STORAGE_KEYS.GAME_SCORES);
    if (savedScores) {
      try {
        this.gameScores = JSON.parse(savedScores);
      } catch {
        this.gameScores = { ...INITIAL_GAME_SCORES };
      }
    } else {
      this.gameScores = { ...INITIAL_GAME_SCORES };
      this.saveScoresLocally();
    }

    // 5. Load announcement
    const savedAnn = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (savedAnn) {
      try {
        this.announcement = JSON.parse(savedAnn);
      } catch {
        this.announcement = INITIAL_ANNOUNCEMENT;
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENT));
    }

    // 6. Load tasks
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (savedTasks) {
      try {
        this.tasks = JSON.parse(savedTasks);
      } catch {
        this.tasks = [...INITIAL_TASKS];
      }
    } else {
      this.tasks = [...INITIAL_TASKS];
      this.saveTasksLocally();
    }

    // 7. Load pending offline sync queue
    const savedQueue = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (savedQueue) {
      try {
        this.syncQueue = JSON.parse(savedQueue);
      } catch {
        this.syncQueue = [];
      }
    }

    this.lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);

    // Initial background cloud sync
    if (this.isOnline()) {
      setTimeout(() => {
        this.flushSyncQueue();
      }, 1000);
    }
  }

  private initSupabaseClient() {
    let url = DEFAULT_SUPABASE_URL;
    let key = DEFAULT_SUPABASE_KEY;

    try {
      const runtimeConfig = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      if (runtimeConfig) {
        const parsed = JSON.parse(runtimeConfig);
        if (parsed.url && parsed.key) {
          url = parsed.url;
          key = parsed.key;
        }
      }
    } catch {}

    this.supabaseUrl = url;
    this.supabaseKey = key;

    if (url && key && url.startsWith('http')) {
      try {
        supabase = createClient(url, key);
        this.setupRealtimeSubscription();
      } catch (e) {
        console.warn('Supabase initialization fallback to local storage:', e);
        supabase = null;
      }
    } else {
      supabase = null;
    }
  }

  private setupRealtimeSubscription() {
    if (!supabase) return;
    try {
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
      }
      this.realtimeChannel = supabase
        .channel('2077_store_realtime_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          this.syncFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not active:', e);
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.notifySyncListeners();
      // Auto-flush queue when connection is restored
      this.flushSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.notifySyncListeners();
    });

    // Background polling interval every 25 seconds when online
    setInterval(() => {
      if (this.isOnline() && supabase && !this.isSyncing) {
        if (this.syncQueue.length > 0) {
          this.flushSyncQueue();
        } else {
          this.syncFromCloud();
        }
      }
    }, 25000);
  }

  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  private tryRecoverFromSafeBackup(): boolean {
    try {
      const backupRaw = localStorage.getItem(STORAGE_KEYS.SAFE_BACKUP);
      if (backupRaw) {
        const backup = JSON.parse(backupRaw);
        if (Array.isArray(backup.profiles) && backup.profiles.length > 0) {
          this.profiles = backup.profiles;
          if (backup.scores) this.gameScores = backup.scores;
          if (backup.tasks) this.tasks = backup.tasks;
          this.saveProfilesLocally();
          return true;
        }
      }
    } catch (e) {
      console.warn('Backup recovery attempt error:', e);
    }
    return false;
  }

  public reloadProfilesFromStorage() {
    try {
      const savedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.profiles = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Storage reload warning:', e);
    }
    // Fallback to safe vault if primary key was empty/failed
    this.tryRecoverFromSafeBackup();
  }

  private saveProfilesLocally() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
    } catch (e) {
      console.warn('Primary profiles localStorage save warning:', e);
    }

    try {
      // Continuous Safe Vault Backup to guarantee zero data loss
      localStorage.setItem(
        STORAGE_KEYS.SAFE_BACKUP,
        JSON.stringify({
          profiles: this.profiles,
          scores: this.gameScores,
          tasks: this.tasks,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (backupErr) {
      console.warn('Safe backup secondary save warning (quota limit):', backupErr);
    }
  }

  private saveScoresLocally() {
    localStorage.setItem(STORAGE_KEYS.GAME_SCORES, JSON.stringify(this.gameScores));
  }

  private saveTasksLocally() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
  }

  private saveSyncQueueLocally() {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    this.notifySyncListeners();
  }

  private notifySyncListeners() {
    const state = this.getNetworkSyncState();
    this.syncListeners.forEach((fn) => fn(state));
  }

  subscribeSyncState(listener: (state: NetworkSyncState) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.getNetworkSyncState());
    return () => {
      this.syncListeners = this.syncListeners.filter((fn) => fn !== listener);
    };
  }

  getNetworkSyncState(): NetworkSyncState {
    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingCount: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      cloudConnected: !!supabase,
    };
  }

  // -----------------------------------------------------------------------
  // OFFLINE-FIRST SYNC QUEUE ENGINE
  // -----------------------------------------------------------------------
  private enqueueSync(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.syncQueue.push(queueItem);
    this.saveSyncQueueLocally();
  }

  async flushSyncQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    if (this.isSyncing) {
      return { syncedCount: 0, remainingCount: this.syncQueue.length };
    }

    if (!supabase || !this.isOnline()) {
      this.notifySyncListeners();
      return { syncedCount: 0, remainingCount: this.syncQueue.length };
    }

    this.isSyncing = true;
    this.notifySyncListeners();

    let syncedCount = 0;
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of this.syncQueue) {
      try {
        if (item.type === 'game_score') {
          const { userId, gameId, sessionScore, multiplier } = item.payload;
          const { error } = await supabase.rpc('submit_game_result', {
            p_user_id: userId,
            p_game_id: gameId,
            p_session_score: sessionScore,
            p_multiplier: multiplier,
          });
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'profile_update') {
          const { id, updates } = item.payload;
          const { error } = await supabase.from('profiles').update(updates).eq('id', id);
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'task_add') {
          const { error } = await supabase.from('tasks').insert(item.payload);
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'task_toggle') {
          const { id, isCompleted } = item.payload;
          const { error } = await supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', id);
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'announcement') {
          const { error } = await supabase.from('announcements').insert(item.payload);
          if (error) throw error;
          syncedCount++;
        }
      } catch (err) {
        console.warn('Sync queue item failed to replicate to cloud, will retry:', err);
        item.retryCount = (item.retryCount || 0) + 1;
        // Keep in queue for next sync window
        remainingQueue.push(item);
      }
    }

    this.syncQueue = remainingQueue;
    this.saveSyncQueueLocally();

    // Pull latest data from cloud to reflect other users' updates
    await this.syncFromCloud();

    this.isSyncing = false;
    this.lastSyncTime = new Date().toLocaleTimeString('fa-IR');
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
    } catch {}
    this.notifySyncListeners();

    return { syncedCount, remainingCount: this.syncQueue.length };
  }

  async syncFromCloud(): Promise<boolean> {
    if (!supabase || !this.isOnline()) return false;

    try {
      // 1. Fetch updated profiles
      const { data: cloudProfiles, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .order('total_cp', { ascending: false });

      if (!pErr && cloudProfiles && cloudProfiles.length > 0) {
        const cloudMap = new Map<string, UserProfile>();
        cloudProfiles.forEach((d: any) => {
          cloudMap.set(d.id, {
            id: d.id,
            username: d.username,
            passwordHash: d.password_hash,
            fullName: d.full_name,
            roleTitle: d.role_title,
            department: d.department,
            avatarUrl: d.avatar_url,
            birthDay: d.birth_day,
            birthMonth: d.birth_month,
            birthMonthNum: d.birth_month_num,
            birthYear: d.birth_year,
            phoneNumber: d.phone_number,
            internalExt: d.internal_ext,
            isAdmin: d.is_admin,
            isOnline: d.is_online,
            shiftName: d.shift_name,
            bankedXp: d.banked_xp,
            crownsCount: d.crowns_count,
            totalCp: d.total_cp,
            pushSubscription: d.push_subscription,
          });
        });

        // Non-destructive Merge: Preserve all local profiles, update with cloud data, and add new cloud profiles
        const merged: UserProfile[] = [];
        const seenIds = new Set<string>();

        for (const localP of this.profiles) {
          const fromCloud = cloudMap.get(localP.id);
          if (fromCloud) {
            merged.push({ ...localP, ...fromCloud });
          } else {
            // Keep local profiles that haven't reached cloud yet!
            merged.push(localP);
          }
          seenIds.add(localP.id);
        }

        for (const [id, cloudP] of cloudMap.entries()) {
          if (!seenIds.has(id)) {
            merged.push(cloudP);
          }
        }

        this.profiles = merged;
        this.saveProfilesLocally();
      }

      // 2. Fetch all game scores (Non-destructive: retain highest score between local and cloud)
      const { data: cloudScores, error: sErr } = await supabase
        .from('game_scores')
        .select('*, profiles(full_name)');

      if (!sErr && cloudScores) {
        for (const record of cloudScores) {
          const gId = record.game_id;
          const score = record.high_score;
          const userName = record.profiles?.full_name || 'اپراتور';
          const currentLocal = this.gameScores[gId];
          if (!currentLocal || score >= currentLocal.score) {
            this.gameScores[gId] = {
              userId: record.user_id,
              userName,
              score,
            };
          }
        }
        this.saveScoresLocally();
      }

      // 3. Fetch latest announcement
      const { data: cloudAnn } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (cloudAnn && cloudAnn.length > 0) {
        this.announcement = {
          id: cloudAnn[0].id,
          title: cloudAnn[0].title,
          content: cloudAnn[0].content,
          priority: cloudAnn[0].priority,
          isActive: cloudAnn[0].is_active,
          createdAt: cloudAnn[0].created_at,
        };
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcement));
      }

      // 4. Fetch tasks
      const { data: cloudTasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (cloudTasks && cloudTasks.length > 0) {
        this.tasks = cloudTasks.map((t: any) => ({
          id: t.id,
          assignedToId: t.assigned_to_id,
          assignedToName: t.assigned_to_name,
          title: t.title,
          description: t.description || '',
          priority: t.priority,
          isCompleted: t.is_completed,
          createdAt: t.created_at,
        }));
        this.saveTasksLocally();
      }

      // Recalculate crowns
      this.recalculateCrownsLocally();

      this.lastSyncTime = new Date().toLocaleTimeString('fa-IR');
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
      } catch {}
      this.notifySyncListeners();
      return true;
    } catch (e) {
      console.warn('Cloud sync failed, staying on local copy:', e);
      return false;
    }
  }

  private recalculateCrownsLocally() {
    const crownCounts: Record<string, number> = {};
    for (const record of Object.values(this.gameScores)) {
      if (record && record.userId) {
        crownCounts[record.userId] = (crownCounts[record.userId] || 0) + 1;
      }
    }

    for (let i = 0; i < this.profiles.length; i++) {
      const p = this.profiles[i];
      p.crownsCount = crownCounts[p.id] || 0;
      p.totalCp = p.bankedXp + p.crownsCount * 500;
    }

    this.saveProfilesLocally();

    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updated = this.profiles.find((p) => p.id === currentUser.id);
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(updated));
      }
    }
  }

  // -----------------------------------------------------------------------
  // AUTHENTICATION & SESSION
  // -----------------------------------------------------------------------
  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      this.reloadProfilesFromStorage();
      const active = this.profiles.find((p) => p.id === user.id);
      return active || user;
    } catch {
      return null;
    }
  }

  async login(username: string, password: string): Promise<{ user: UserProfile | null; error?: string }> {
    this.reloadProfilesFromStorage();

    const rawUsername = (username || '').trim();
    const rawPassword = (password || '').trim();

    if (!rawUsername || !rawPassword) {
      return { user: null, error: 'لطفاً نام کاربری و رمز عبور را وارد کنید!' };
    }

    const normUsername = normalizePersianText(rawUsername);
    const digitsUsername = normalizeDigits(rawUsername);
    const normPassword = normalizeDigits(rawPassword);
    const normTextPassword = normalizePersianText(rawPassword);

    // 1. Check local store with universal Persian/English & multi-identifier matching
    const localUser = this.profiles.find((p) => {
      // Password match check (handles Persian digits vs English digits & whitespaces)
      const passMatches =
        p.passwordHash === rawPassword ||
        normalizeDigits(p.passwordHash) === normPassword ||
        normalizePersianText(p.passwordHash) === normTextPassword;

      if (!passMatches) return false;

      // Identity match check: username, internal extension, phone, or full name
      const userMatches =
        p.username.toLowerCase() === rawUsername.toLowerCase() ||
        normalizePersianText(p.username) === normUsername ||
        (Boolean(p.internalExt) && normalizeDigits(p.internalExt) === digitsUsername) ||
        (Boolean(p.phoneNumber) && normalizeDigits(p.phoneNumber) === digitsUsername) ||
        normalizePersianText(p.fullName) === normUsername;

      return userMatches;
    });

    if (localUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(localUser));
      return { user: localUser };
    }

    // 2. Check Supabase if connected
    if (supabase && this.isOnline()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.eq.${rawUsername.toLowerCase()},phone_number.eq.${digitsUsername},internal_ext.eq.${digitsUsername}`);

        if (data && !error && data.length > 0) {
          const matched = data.find((row: any) => {
            const rowPass = row.password_hash || '';
            return (
              rowPass === rawPassword ||
              normalizeDigits(rowPass) === normPassword ||
              normalizePersianText(rowPass) === normTextPassword
            );
          });

          if (matched) {
            const user: UserProfile = {
              id: matched.id,
              username: matched.username,
              passwordHash: matched.password_hash,
              fullName: matched.full_name,
              roleTitle: matched.role_title,
              department: matched.department,
              avatarUrl: matched.avatar_url,
              birthDay: matched.birth_day,
              birthMonth: matched.birth_month,
              birthMonthNum: matched.birth_month_num,
              birthYear: matched.birth_year,
              phoneNumber: matched.phone_number,
              internalExt: matched.internal_ext,
              isAdmin: matched.is_admin,
              isOnline: matched.is_online,
              shiftName: matched.shift_name,
              bankedXp: matched.banked_xp,
              crownsCount: matched.crowns_count,
              totalCp: matched.total_cp,
              pushSubscription: matched.push_subscription,
            };

            const idx = this.profiles.findIndex((p) => p.id === user.id);
            if (idx >= 0) {
              this.profiles[idx] = user;
            } else {
              this.profiles.push(user);
            }
            this.saveProfilesLocally();
            localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
            return { user };
          }
        }
      } catch (e) {
        console.warn('Supabase login error:', e);
      }
    }

    return { user: null, error: 'شناسه کاربری یا رمز عبور نامعتبر است!' };
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }

  // -----------------------------------------------------------------------
  // PROFILES & STAFF HUB
  // -----------------------------------------------------------------------
  async getProfiles(): Promise<UserProfile[]> {
    this.reloadProfilesFromStorage();
    if (supabase && this.isOnline()) {
      this.syncFromCloud();
    }
    return [...this.profiles].sort((a, b) => b.totalCp - a.totalCp);
  }

  async addProfile(profileData: Omit<UserProfile, 'id' | 'bankedXp' | 'crownsCount' | 'totalCp'>): Promise<UserProfile> {
    this.reloadProfilesFromStorage();

    const cleanUsername = (profileData.username || '').trim().toLowerCase();
    const cleanPassword = (profileData.passwordHash || '').trim();
    const normUsername = normalizePersianText(cleanUsername);

    const existing = this.profiles.find(
      (p) => p.username.toLowerCase() === cleanUsername || normalizePersianText(p.username) === normUsername
    );
    if (existing) {
      throw new Error(`نام کاربری «${cleanUsername}» قبلاً برای پرسنل «${existing.fullName}» ثبت شده است!`);
    }

    const newId = '00000000-0000-0000-0000-' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const newProfile: UserProfile = {
      ...profileData,
      id: newId,
      username: cleanUsername,
      passwordHash: cleanPassword,
      bankedXp: 0,
      crownsCount: 0,
      totalCp: 0,
      isOnline: true,
      createdAt: new Date().toISOString(),
    };

    this.profiles.push(newProfile);
    this.saveProfilesLocally();

    const insertPayload = {
      id: newProfile.id,
      username: newProfile.username,
      password_hash: newProfile.passwordHash,
      full_name: newProfile.fullName,
      role_title: newProfile.roleTitle,
      department: newProfile.department,
      avatar_url: newProfile.avatarUrl,
      birth_day: newProfile.birthDay,
      birth_month: newProfile.birthMonth,
      birth_month_num: newProfile.birthMonthNum,
      birth_year: newProfile.birthYear,
      phone_number: newProfile.phoneNumber,
      internal_ext: newProfile.internalExt,
      is_admin: newProfile.isAdmin,
      is_online: newProfile.isOnline,
      shift_name: newProfile.shiftName,
      banked_xp: 0,
      crowns_count: 0,
      total_cp: 0,
    };

    if (supabase && this.isOnline()) {
      try {
        await supabase.from('profiles').insert(insertPayload);
      } catch (e) {
        console.warn('Supabase insert failed, queued for sync:', e);
        this.enqueueSync({ type: 'profile_update', payload: { id: newProfile.id, updates: insertPayload } });
      }
    } else {
      this.enqueueSync({ type: 'profile_update', payload: { id: newProfile.id, updates: insertPayload } });
    }

    return newProfile;
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    this.reloadProfilesFromStorage();

    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('کاربر یافت نشد!');

    const cleanUpdates: Partial<UserProfile> = { ...updates };
    if (cleanUpdates.username) {
      cleanUpdates.username = cleanUpdates.username.trim().toLowerCase();
    }
    if (cleanUpdates.passwordHash) {
      cleanUpdates.passwordHash = cleanUpdates.passwordHash.trim();
    }

    const updated = { ...this.profiles[idx], ...cleanUpdates };
    updated.totalCp = (updated.bankedXp || 0) + (updated.crownsCount || 0) * 500;
    this.profiles[idx] = updated;
    this.saveProfilesLocally();

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(updated));
    }

    const cloudPayload = {
      username: updated.username,
      password_hash: updated.passwordHash,
      full_name: updated.fullName,
      role_title: updated.roleTitle,
      department: updated.department,
      avatar_url: updated.avatarUrl,
      birth_day: updated.birthDay,
      birth_month: updated.birthMonth,
      birth_month_num: updated.birthMonthNum,
      birth_year: updated.birthYear,
      phone_number: updated.phoneNumber,
      internal_ext: updated.internalExt,
      is_admin: updated.isAdmin,
      shift_name: updated.shiftName,
      push_subscription: updated.pushSubscription,
    };

    if (supabase && this.isOnline()) {
      try {
        await supabase.from('profiles').update(cloudPayload).eq('id', id);
      } catch (e) {
        console.warn('Supabase update failed, queued for sync:', e);
        this.enqueueSync({ type: 'profile_update', payload: { id, updates: cloudPayload } });
      }
    } else {
      this.enqueueSync({ type: 'profile_update', payload: { id, updates: cloudPayload } });
    }

    return updated;
  }

  async deleteProfile(id: string): Promise<boolean> {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    this.saveProfilesLocally();

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      this.logout();
    }

    if (supabase && this.isOnline()) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete failed:', e);
      }
    }

    return true;
  }

  async savePushSubscription(userId: string, subscription: any) {
    await this.updateProfile(userId, { pushSubscription: subscription });
  }

  // -----------------------------------------------------------------------
  // TASKS & DISPATCH ENGINE
  // -----------------------------------------------------------------------
  getTasks(): Task[] {
    return [...this.tasks];
  }

  addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>): Task {
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    this.saveTasksLocally();

    const payload = {
      assigned_to_id: newTask.assignedToId,
      assigned_to_name: newTask.assignedToName,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      is_completed: false,
    };

    if (supabase && this.isOnline()) {
      try {
        supabase.from('tasks').insert(payload);
      } catch {
        this.enqueueSync({ type: 'task_add', payload });
      }
    } else {
      this.enqueueSync({ type: 'task_add', payload });
    }

    return newTask;
  }

  toggleTask(id: string): Task | null {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx].isCompleted = !this.tasks[idx].isCompleted;
    this.saveTasksLocally();

    const payload = { id, isCompleted: this.tasks[idx].isCompleted };
    if (supabase && this.isOnline()) {
      try {
        supabase.from('tasks').update({ is_completed: payload.isCompleted }).eq('id', id);
      } catch {
        this.enqueueSync({ type: 'task_toggle', payload });
      }
    } else {
      this.enqueueSync({ type: 'task_toggle', payload });
    }

    return this.tasks[idx];
  }

  deleteTask(id: string): boolean {
    const prevLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveTasksLocally();

    if (supabase && this.isOnline()) {
      try {
        supabase.from('tasks').delete().eq('id', id);
      } catch {}
    }

    return this.tasks.length < prevLen;
  }

  // -----------------------------------------------------------------------
  // GAME SCORE SUBMISSION & OFFLINE-FIRST LEADERBOARD ENGINE
  // -----------------------------------------------------------------------
  getGameScores(): Record<string, { userId: string; userName: string; score: number }> {
    return { ...this.gameScores };
  }

  async submitGameResult(
    userId: string,
    gameId: GameId,
    sessionScore: number,
    multiplier: number
  ): Promise<{ earnedXp: number; newHighScore: boolean; newCrown: boolean; totalCp: number; queuedOffline: boolean }> {
    const userIndex = this.profiles.findIndex((p) => p.id === userId);
    if (userIndex === -1) {
      return { earnedXp: 0, newHighScore: false, newCrown: false, totalCp: 0, queuedOffline: false };
    }

    // 1. Calculate banked XP and update locally immediately (zero lag)
    const earnedXp = Math.round(sessionScore * multiplier);
    this.profiles[userIndex].bankedXp += earnedXp;

    let newCrown = false;
    const currentCrownHolder = this.gameScores[gameId];
    const prevBestScore = currentCrownHolder?.score || 0;

    if (sessionScore > prevBestScore) {
      this.gameScores[gameId] = {
        userId,
        userName: this.profiles[userIndex].fullName,
        score: sessionScore,
      };
      this.saveScoresLocally();
      newCrown = true;
    }

    // Recalculate crowns count for all players locally
    this.recalculateCrownsLocally();

    const updatedUser = this.profiles[userIndex];
    let queuedOffline = false;

    // 2. Sync to cloud server if online, or queue for offline background sync
    if (supabase && this.isOnline()) {
      try {
        const { error } = await supabase.rpc('submit_game_result', {
          p_user_id: userId,
          p_game_id: gameId,
          p_session_score: sessionScore,
          p_multiplier: multiplier,
        });

        if (error) {
          throw error;
        }

        // Pull fresh cloud updates in background
        this.syncFromCloud();
      } catch (e) {
        console.warn('Direct upload to Supabase failed, queued in offline buffer:', e);
        this.enqueueSync({
          type: 'game_score',
          payload: { userId, gameId, sessionScore, multiplier },
        });
        queuedOffline = true;
      }
    } else {
      // User is playing offline! Queue score to be pushed on reconnect
      this.enqueueSync({
        type: 'game_score',
        payload: { userId, gameId, sessionScore, multiplier },
      });
      queuedOffline = true;
    }

    return {
      earnedXp,
      newHighScore: sessionScore > prevBestScore,
      newCrown,
      totalCp: updatedUser.totalCp,
      queuedOffline,
    };
  }

  // -----------------------------------------------------------------------
  // ANNOUNCEMENTS
  // -----------------------------------------------------------------------
  getAnnouncement(): Announcement {
    return this.announcement;
  }

  updateAnnouncement(title: string, content: string, priority: string = 'عادی'): Announcement {
    this.announcement = {
      ...this.announcement,
      title,
      content,
      priority,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcement));

    const payload = {
      title,
      content,
      priority,
      is_active: true,
    };

    if (supabase && this.isOnline()) {
      try {
        supabase.from('announcements').insert(payload);
      } catch {
        this.enqueueSync({ type: 'announcement', payload });
      }
    } else {
      this.enqueueSync({ type: 'announcement', payload });
    }

    return this.announcement;
  }

  // -----------------------------------------------------------------------
  // DATABASE BACKUP, RESTORE & INSPECTION
  // -----------------------------------------------------------------------
  exportDatabaseJson(): string {
    const payload = {
      exportMetadata: {
        app: 'SYS.2077 Portal & Arcade',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        profilesCount: this.profiles.length,
        gameScoresCount: Object.keys(this.gameScores).length,
        tasksCount: this.tasks.length,
        pendingSyncCount: this.syncQueue.length,
      },
      profiles: this.profiles,
      gameScores: this.gameScores,
      tasks: this.tasks,
      announcement: this.announcement,
      syncQueue: this.syncQueue,
    };
    return JSON.stringify(payload, null, 2);
  }

  importDatabaseJson(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profiles || !Array.isArray(parsed.profiles)) {
        return { success: false, message: 'ساختار فایل پشتیبان نامعتبر است (آرایه profiles یافت نشد)' };
      }

      this.profiles = parsed.profiles;
      this.saveProfilesLocally();

      if (parsed.gameScores && typeof parsed.gameScores === 'object') {
        this.gameScores = parsed.gameScores;
        this.saveScoresLocally();
      }

      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        this.tasks = parsed.tasks;
        this.saveTasksLocally();
      }

      if (parsed.announcement && parsed.announcement.content) {
        this.announcement = parsed.announcement;
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcement));
      }

      if (parsed.syncQueue && Array.isArray(parsed.syncQueue)) {
        this.syncQueue = parsed.syncQueue;
        this.saveSyncQueueLocally();
      }

      return {
        success: true,
        message: `پشتیبان با موفقیت بازیابی شد (${this.profiles.length} پروفایل و ${this.tasks.length} تسک)`,
        count: this.profiles.length,
      };
    } catch (e: any) {
      return { success: false, message: `خطا در پردازش فایل پشتیبان: ${e.message}` };
    }
  }

  resetDatabase() {
    this.profiles = [...INITIAL_PROFILES];
    this.gameScores = { ...INITIAL_GAME_SCORES };
    this.announcement = { ...INITIAL_ANNOUNCEMENT };
    this.tasks = [...INITIAL_TASKS];
    this.syncQueue = [];
    this.saveProfilesLocally();
    this.saveScoresLocally();
    this.saveTasksLocally();
    this.saveSyncQueueLocally();
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(this.announcement));
  }

  // -----------------------------------------------------------------------
  // RUNTIME SUPABASE CONFIGURATION & STATS
  // -----------------------------------------------------------------------
  getSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean } {
    return {
      url: this.supabaseUrl,
      anonKey: this.supabaseKey,
      isCustom: !!localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG),
    };
  }

  async configureSupabase(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl && !trimmedKey) {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG);
      this.initSupabaseClient();
      return { success: true, message: 'تنظیمات سرور ابری ریست شد؛ سیستم در حالت پایگاه داده محلی قرار گرفت.' };
    }

    if (!trimmedUrl.startsWith('https://')) {
      return { success: false, message: 'آدرس پروژه Supabase باید با https:// شروع شود.' };
    }

    try {
      const testClient = createClient(trimmedUrl, trimmedKey);
      const { error } = await testClient.from('profiles').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase test returned code:', error);
      }

      localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({ url: trimmedUrl, key: trimmedKey }));
      this.supabaseUrl = trimmedUrl;
      this.supabaseKey = trimmedKey;
      supabase = testClient;

      this.setupRealtimeSubscription();

      // Flush queue and pull latest
      setTimeout(() => {
        this.flushSyncQueue();
      }, 500);

      return { success: true, message: 'ارتباط با سرور Supabase PostgreSQL با موفقیت برقرار و همگام‌سازی آغاز شد!' };
    } catch (err: any) {
      return { success: false, message: `خطا در اتصال به Supabase: ${err.message}` };
    }
  }

  getDatabaseStats(): DatabaseStats {
    let sizeBytes = 0;
    try {
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.PROFILES) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.GAME_SCORES) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.TASKS) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '').length * 2;
    } catch {}

    return {
      mode: supabase ? 'supabase' : 'local',
      supabaseConnected: !!supabase,
      supabaseUrl: this.supabaseUrl || undefined,
      profilesCount: this.profiles.length,
      gameScoresCount: Object.keys(this.gameScores).length,
      tasksCount: this.tasks.length,
      announcementsCount: 1,
      storageSizeKb: Math.max(1, Math.round(sizeBytes / 1024)),
      pendingSyncCount: this.syncQueue.length,
    };
  }
}

export const db = new DatabaseService();