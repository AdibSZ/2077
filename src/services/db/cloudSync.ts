import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseStats, SyncQueueItem, NetworkSyncState } from '../../types';
import { STORAGE_KEYS } from './storageKeys';
import { StorageVault } from './vault';

export class CloudSyncService {
  private supabase: SupabaseClient | null = null;
  private supabaseUrl: string = '';
  private supabaseKey: string = '';
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private syncListeners: ((state: NetworkSyncState) => void)[] = [];

  constructor() {
    this.initSupabaseClient();
    this.syncQueue = StorageVault.getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
    try {
      this.lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch {}
  }

  initSupabaseClient() {
    let customConfig: { url: string; key: string } | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
      if (saved) customConfig = JSON.parse(saved);
    } catch {}

    const url = customConfig?.url || (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const key = customConfig?.key || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

    this.supabaseUrl = url;
    this.supabaseKey = key;

    if (url && key) {
      try {
        this.supabase = createClient(url, key);
      } catch (e) {
        console.warn('Supabase initialization warning:', e);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
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
          const { id, updates } = item.payload;
          const { error } = await this.supabase.from('profiles').update(updates).eq('id', id);
          if (error) throw error;
        } else if (item.type === 'task_add') {
          const { error } = await this.supabase.from('tasks').insert(item.payload);
          if (error) throw error;
        } else if (item.type === 'task_toggle') {
          const { id, isCompleted } = item.payload;
          const { error } = await this.supabase.from('tasks').update({ is_completed: isCompleted }).eq('id', id);
          if (error) throw error;
        } else if (item.type === 'announcement') {
          const { error } = await this.supabase.from('announcements').insert(item.payload);
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

  getSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean } {
    return {
      url: this.supabaseUrl,
      anonKey: this.supabaseKey,
      isCustom: Boolean(localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG)),
    };
  }

  async configureSupabase(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl && !cleanKey) {
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG);
      this.initSupabaseClient();
      this.notifySyncListeners();
      return { success: true, message: 'تنظیمات پایگاه داده به حالت محلی (Local Safe Vault) بازگردانده شد.' };
    }

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, message: 'آدرس سرور Supabase باید با https:// شروع شود.' };
    }

    try {
      const client = createClient(cleanUrl, cleanKey);
      await client.from('profiles').select('id').limit(1);

      localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({ url: cleanUrl, key: cleanKey }));
      this.supabaseUrl = cleanUrl;
      this.supabaseKey = cleanKey;
      this.supabase = client;
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
