import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseStats, SyncQueueItem, NetworkSyncState } from '../../types';
import { STORAGE_KEYS, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY } from './storageKeys';
import { StorageVault } from './vault';
import {
  toCloudProfile,
  fromCloudProfile,
  toCloudTask,
  fromCloudTask,
  toCloudAnnouncement,
  fromCloudAnnouncement,
} from './cloudMappers';

export class CloudSyncService {
  private supabase: SupabaseClient | null = null;
  private supabaseUrl: string = '';
  private supabaseKey: string = '';
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private syncListeners: ((state: NetworkSyncState) => void)[] = [];
  private onDataSynced?: () => void;

  constructor(onDataSynced?: () => void) {
    this.onDataSynced = onDataSynced;
    this.initSupabaseClient();
    this.syncQueue = StorageVault.getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
    try {
      this.lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch {}

    if (this.supabase) {
      setTimeout(() => this.pullFromCloud(), 300);
      setInterval(() => {
        if (!this.isSyncing) this.pullFromCloud().catch(() => {});
      }, 15000);
    }
  }

  initSupabaseClient() {
    let customConfig: { url: string; key: string } | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      if (saved) customConfig = JSON.parse(saved);
    } catch {}

    const url = customConfig?.url || (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
    const key = customConfig?.key || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_KEY;

    this.supabaseUrl = url;
    this.supabaseKey = key;

    if (url && key) {
      try {
        this.supabase = createClient(url, key);
        this.setupRealtimeSubscription();
      } catch (e) {
        console.warn('Supabase initialization warning:', e);
        this.supabase = null;
      }
    }
  }

  getSupabase(): SupabaseClient | null {
    return this.supabase;
  }

  getSyncState(): NetworkSyncState {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      cloudConnected: Boolean(this.supabase),
    };
  }

  subscribeSyncState(listener: (state: NetworkSyncState) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.getSyncState());
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  notifySyncListeners() {
    const state = this.getSyncState();
    this.syncListeners.forEach((l) => l(state));
  }

  enqueue(item: { type: SyncQueueItem['type']; payload: any }) {
    const queueItem: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: item.type,
      payload: item.payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.syncQueue.push(queueItem);
    StorageVault.setItem(STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    this.notifySyncListeners();
    this.flushSyncQueue().catch(() => {});
  }

  async flushSyncQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (this.isSyncing || !this.supabase || !isOnline) {
      return { syncedCount: 0, remainingCount: this.syncQueue.length };
    }

    this.isSyncing = true;
    this.notifySyncListeners();
    let syncedCount = 0;
    const remaining: SyncQueueItem[] = [];

    for (const item of this.syncQueue) {
      try {
        if (item.type === 'profile_update') {
          const { error } = await this.supabase.from('profiles').upsert(toCloudProfile(item.payload));
          if (error) throw error;
        } else if (item.type === 'task_add' || item.type === 'task_toggle') {
          const { error } = await this.supabase.from('tasks').upsert(toCloudTask(item.payload));
          if (error) throw error;
        } else if (item.type === 'announcement') {
          const { error } = await this.supabase.from('announcements').upsert(toCloudAnnouncement(item.payload));
          if (error) throw error;
        }
        syncedCount++;
      } catch (err) {
        item.retryCount = (item.retryCount || 0) + 1;
        remaining.push(item);
      }
    }

    this.syncQueue = remaining;
    StorageVault.setItem(STORAGE_KEYS.SYNC_QUEUE, this.syncQueue);
    this.isSyncing = false;
    this.lastSyncTime = new Date().toLocaleTimeString('fa-IR');
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
    } catch {}
    this.notifySyncListeners();

    return { syncedCount, remainingCount: this.syncQueue.length };
  }

  async pullFromCloud(): Promise<boolean> {
    if (!this.supabase || typeof navigator !== 'undefined' && !navigator.onLine) return false;

    try {
      const { data: cloudProfiles } = await this.supabase.from('profiles').select('*').order('total_cp', { ascending: false });
      if (cloudProfiles && cloudProfiles.length > 0) {
        StorageVault.setItem(STORAGE_KEYS.PROFILES, cloudProfiles.map(fromCloudProfile));
      }

      const { data: cloudTasks } = await this.supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (cloudTasks) {
        StorageVault.setItem(STORAGE_KEYS.TASKS, cloudTasks.map(fromCloudTask));
      }

      const { data: cloudAnn } = await this.supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(1);
      if (cloudAnn && cloudAnn.length > 0) {
        StorageVault.setItem(STORAGE_KEYS.ANNOUNCEMENTS, fromCloudAnnouncement(cloudAnn[0]));
      }

      this.lastSyncTime = new Date().toLocaleTimeString('fa-IR');
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
      } catch {}

      if (this.onDataSynced) this.onDataSynced();
      this.notifySyncListeners();
      return true;
    } catch (e) {
      console.warn('Pull from Supabase failed, using local vault:', e);
      return false;
    }
  }

  private setupRealtimeSubscription() {
    if (!this.supabase) return;
    try {
      this.supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => this.pullFromCloud().catch(() => {}))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => this.pullFromCloud().catch(() => {}))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => this.pullFromCloud().catch(() => {}))
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription warning:', err);
    }
  }

  getSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean } {
    return {
      url: this.supabaseUrl,
      anonKey: this.supabaseKey,
      isCustom: Boolean(localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG)),
    };
  }

  async configureSupabase(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim() || DEFAULT_SUPABASE_URL;
    const cleanKey = anonKey.trim() || DEFAULT_SUPABASE_KEY;

    try {
      const client = createClient(cleanUrl, cleanKey);
      await client.from('profiles').select('id').limit(1);

      localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({ url: cleanUrl, key: cleanKey }));
      this.supabaseUrl = cleanUrl;
      this.supabaseKey = cleanKey;
      this.supabase = client;
      this.setupRealtimeSubscription();
      this.pullFromCloud().catch(() => {});
      this.notifySyncListeners();

      return { success: true, message: 'ارتباط ابری با سرور Supabase با موفقیت برقرار شد!' };
    } catch (e: any) {
      return { success: false, message: `خطا در اتصال به سرور ابری: ${e.message}` };
    }
  }

  getDatabaseStats(profilesCount: number, scoresCount: number, tasksCount: number): DatabaseStats {
    let sizeBytes = 0;
    try {
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.PROFILES) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.GAME_SCORES) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.TASKS) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '').length * 2;
      sizeBytes += (localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '').length * 2;
    } catch {}

    return {
      mode: this.supabase ? 'supabase' : 'local',
      supabaseConnected: Boolean(this.supabase),
      supabaseUrl: this.supabaseUrl || undefined,
      profilesCount,
      gameScoresCount: scoresCount,
      tasksCount,
      announcementsCount: 1,
      storageSizeKb: Math.max(1, Math.round(sizeBytes / 1024)),
      pendingSyncCount: this.syncQueue.length,
    };
  }
}
