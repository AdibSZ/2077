import { UserProfile, GameId, Announcement, Task, DatabaseStats } from '../../types';
import { STORAGE_KEYS, normalizeDigits, normalizePersianText } from './storageKeys';
import { StorageVault } from './vault';
import { ProfileService } from './profileService';
import { TaskService } from './taskService';
import { AnnouncementService } from './announcementService';
import { GameScoreService, GameScoreRecord } from './gameScoreService';
import { CloudSyncService } from './cloudSync';
import { SUPABASE_URL } from './supabaseClient';

export { normalizeDigits, normalizePersianText, STORAGE_KEYS, StorageVault };

class DatabaseService {
  private profilesService: ProfileService;
  private tasksService: TaskService;
  private announcementsService: AnnouncementService;
  private gameScoresService: GameScoreService;
  private cloudSyncService: CloudSyncService;

  constructor() {
    this.cloudSyncService = new CloudSyncService();

    this.profilesService = new ProfileService(
      (p) => this.cloudSyncService.saveProfile(p),
      (id) => this.cloudSyncService.deleteProfile(id)
    );

    this.tasksService = new TaskService(
      (t) => this.cloudSyncService.saveTask(t),
      (id) => this.cloudSyncService.deleteTask(id)
    );

    this.announcementsService = new AnnouncementService((a) =>
      this.cloudSyncService.saveAnnouncement(a)
    );

    this.gameScoresService = new GameScoreService((gameId, userId, score) =>
      this.cloudSyncService.saveGameScore(gameId, userId, score)
    );
  }

  // --- Profile & Authentication Methods ---
  getProfiles(): UserProfile[] {
    return this.profilesService.getProfiles();
  }

  getProfileById(id: string): UserProfile | undefined {
    return this.profilesService.getProfileById(id);
  }

  getCurrentUser(): UserProfile | null {
    return this.profilesService.getCurrentUser();
  }

  async login(username: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
    let user = this.profilesService.verifyLogin(username, pass);
    if (!user) {
      try {
        await this.cloudSyncService.pullAllFromCloud();
        user = this.profilesService.verifyLogin(username, pass);
      } catch {}
    }
    if (!user) {
      return { user: null, error: 'نام کاربری یا رمز عبور اشتباه است.' };
    }
    return { user };
  }

  logout() {
    this.profilesService.logout();
  }

  async addProfile(
    profile: Omit<UserProfile, 'id' | 'bankedXp' | 'crownsCount' | 'totalCp'> & {
      id?: string;
      bankedXp?: number;
      crownsCount?: number;
      totalCp?: number;
    }
  ): Promise<UserProfile> {
    return this.profilesService.addProfile(profile);
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await this.profilesService.updateProfile(id, updates);
    if (!res) throw new Error('کاربر یافت نشد!');
    return res;
  }

  async savePushSubscription(userId: string, subscription: any) {
    return this.updateProfile(userId, { pushSubscription: subscription });
  }

  async deleteProfile(id: string): Promise<boolean> {
    return this.profilesService.deleteProfile(id);
  }

  // --- Task Operations ---
  getTasks(): Task[] {
    return this.tasksService.getTasks();
  }

  getUserTasks(userId: string, isAdmin: boolean): Task[] {
    return this.tasksService.getUserTasks(userId, isAdmin);
  }

  async addTask(
    taskData: Omit<Task, 'id' | 'createdAt' | 'isCompleted'> & { isCompleted?: boolean },
    user?: UserProfile
  ): Promise<Task> {
    return this.tasksService.addTask({
      ...taskData,
      createdById: user?.id,
      createdByName: user?.fullName,
    });
  }

  async toggleTask(id: string, user?: UserProfile): Promise<Task | null> {
    if (!user) {
      const current = this.getCurrentUser();
      if (!current) throw new Error('برای تغییر وضعیت تسک باید وارد سیستم شوید.');
      user = current;
    }
    return this.tasksService.toggleTaskCompleted(id, user);
  }

  async deleteTask(id: string, user?: UserProfile): Promise<boolean> {
    if (user && !user.isAdmin) {
      throw new Error('فقط مدیران سیستم مجاز به حذف وظایف هستند.');
    }
    return this.tasksService.deleteTask(id);
  }

  // --- Announcement Operations ---
  getAnnouncement(): Announcement {
    return this.announcementsService.getAnnouncement();
  }

  updateAnnouncement(title: string, content: string, priority: string = 'عادی'): Announcement {
    const p = (priority === 'فوری' || priority === 'مهم' ? priority : 'عادی') as 'عادی' | 'مهم' | 'فوری';
    this.announcementsService.updateAnnouncement(title, content, p);
    return this.announcementsService.getAnnouncement();
  }

  publishUrgentAlert(title: string, content: string): Announcement {
    this.announcementsService.publishUrgentAlert(title, content);
    return this.announcementsService.getAnnouncement();
  }

  clearUrgentAlert(): Announcement {
    this.announcementsService.clearUrgentAlert();
    return this.announcementsService.getAnnouncement();
  }

  clearAnnouncement(): Announcement {
    this.announcementsService.clearAnnouncement();
    return this.announcementsService.getAnnouncement();
  }

  // --- Game Scores & CP Engine ---
  getGameScores(): Record<string, GameScoreRecord> {
    return this.gameScoresService.getGameScores();
  }

  async submitGameResult(
    userId: string,
    gameId: GameId,
    sessionScore: number,
    multiplier: number
  ) {
    const profiles = this.profilesService.getProfiles();
    return this.gameScoresService.submitGameResult(userId, gameId, sessionScore, multiplier, profiles);
  }

  calculateCp(gameId: GameId, score: number): number {
    return this.gameScoresService.calculateCp(gameId, score);
  }

  // --- Cloud Sync & DB Diagnostics ---
  getDatabaseStats(): DatabaseStats {
    const profiles = this.profilesService.getProfiles();
    const scores = this.gameScoresService.getGameScores();
    const tasks = this.tasksService.getTasks();
    let sizeBytes = 0;
    try {
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.PROFILES) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.GAME_SCORES) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.TASKS) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '').length * 2;
    } catch {}

    return {
      mode: 'supabase',
      supabaseConnected: true,
      supabaseUrl: SUPABASE_URL,
      profilesCount: profiles.length,
      gameScoresCount: Object.keys(scores).length,
      tasksCount: tasks.length,
      announcementsCount: 1,
      storageSizeKb: Math.max(1, Math.round(sizeBytes / 1024)),
      pendingSyncCount: 0,
    };
  }

  getNetworkSyncState() {
    return this.cloudSyncService.getSyncState();
  }

  subscribeSyncState(listener: (state: any) => void): () => void {
    return this.cloudSyncService.subscribeSyncState(listener);
  }

  flushSyncQueue() {
    return this.cloudSyncService.pullAllFromCloud();
  }

  exportDatabaseJson(): string {
    const payload = {
      exportMetadata: {
        app: '2077 Family Portal & Arcade',
        version: '2.6.2',
        exportedAt: new Date().toISOString(),
      },
      profiles: this.profilesService.getProfiles(),
      gameScores: this.gameScoresService.getGameScores(),
      tasks: this.tasksService.getTasks(),
      announcement: this.announcementsService.getAnnouncement(),
    };
    return JSON.stringify(payload, null, 2);
  }

  importDatabaseJson(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.profiles || !Array.isArray(parsed.profiles)) {
        return { success: false, message: 'ساختار فایل پشتیبان نامعتبر است (آرایه profiles یافت نشد)' };
      }

      this.profilesService.setProfilesFromRemote(parsed.profiles);
      if (parsed.gameScores) this.gameScoresService.setScoresFromRemote(parsed.gameScores);
      if (parsed.tasks) this.tasksService.setTasksFromRemote(parsed.tasks);
      if (parsed.announcement) this.announcementsService.setAnnouncementFromRemote(parsed.announcement);

      // Also sync all to cloud
      parsed.profiles.forEach((p: any) => this.cloudSyncService.saveProfile(p));
      parsed.tasks?.forEach((t: any) => this.cloudSyncService.saveTask(t));
      if (parsed.announcement) this.cloudSyncService.saveAnnouncement(parsed.announcement);

      return {
        success: true,
        message: `پشتیبان با موفقیت بازیابی شد (${parsed.profiles.length} پروفایل و ${parsed.tasks?.length || 0} تسک)`,
        count: parsed.profiles.length,
      };
    } catch (e: any) {
      return { success: false, message: `خطا در پردازش فایل پشتیبان: ${e.message}` };
    }
  }

  resetDatabase() {
    StorageVault.removeItem(STORAGE_KEYS.PROFILES);
    StorageVault.removeItem(STORAGE_KEYS.GAME_SCORES);
    StorageVault.removeItem(STORAGE_KEYS.TASKS);
    StorageVault.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    StorageVault.removeItem(STORAGE_KEYS.SAFE_BACKUP);
  }
}

export const db = new DatabaseService();
