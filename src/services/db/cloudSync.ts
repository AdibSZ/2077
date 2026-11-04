import { supabase, generateUUID } from './supabaseClient';
import { STORAGE_KEYS } from './storageKeys';
import { StorageVault } from './vault';
import { UserProfile, Task, Announcement, NetworkSyncState } from '../../types';
import { GameScoreRecord } from './gameScoreService';
import {
  toCloudProfile,
  fromCloudProfile,
  toCloudTask,
  fromCloudTask,
  toCloudAnnouncement,
  fromCloudAnnouncement,
} from './cloudMappers';

export class CloudSyncService {
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private listeners: ((state: NetworkSyncState) => void)[] = [];
  private onDataSynced?: () => void;

  constructor(onDataSynced?: () => void) {
    this.onDataSynced = onDataSynced;
    try {
      this.lastSyncTime = localStorage.getItem('2077_last_cloud_sync_time');
    } catch {}

    // Initial pull after 200ms
    setTimeout(() => this.pullAllFromCloud(), 200);

    // Setup Realtime subscriptions
    this.setupRealtimeSubscriptions();

    // Background poll every 15 seconds
    setInterval(() => {
      if (!this.isSyncing) {
        this.pullAllFromCloud().catch(() => {});
      }
    }, 15000);
  }

  getSyncState(): NetworkSyncState {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      cloudConnected: true,
      pendingCount: 0,
      lastSyncTime: this.lastSyncTime,
    };
  }

  subscribeSyncState(listener: (state: NetworkSyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const state = this.getSyncState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch {}
    });
  }

  async pullAllFromCloud(): Promise<boolean> {
    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.notifyListeners();

    try {
      // 1. Pull Profiles
      const { data: cloudProfiles } = await supabase
        .from('profiles')
        .select('*')
        .order('total_cp', { ascending: false });

      if (cloudProfiles && cloudProfiles.length > 0) {
        const parsedProfiles = cloudProfiles.map(fromCloudProfile);
        StorageVault.setItem(STORAGE_KEYS.PROFILES, parsedProfiles);

        const currentSession = StorageVault.getItem<UserProfile | null>(STORAGE_KEYS.AUTH_SESSION, null);
        if (currentSession) {
          const freshUser = parsedProfiles.find((p) => p.id === currentSession.id);
          if (freshUser) {
            StorageVault.setItem(STORAGE_KEYS.AUTH_SESSION, freshUser);
          }
        }
      }

      // 2. Pull Tasks
      const { data: cloudTasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (cloudTasks) {
        const parsedTasks = cloudTasks.map(fromCloudTask);
        StorageVault.setItem(STORAGE_KEYS.TASKS, parsedTasks);
      }

      // 3. Pull Announcements
      const { data: cloudAnn } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (cloudAnn && cloudAnn.length > 0) {
        StorageVault.setItem(STORAGE_KEYS.ANNOUNCEMENTS, fromCloudAnnouncement(cloudAnn[0]));
      }

      // 4. Pull Game Scores
      const { data: cloudScores } = await supabase.from('game_scores').select('*');
      if (cloudScores && cloudScores.length > 0) {
        const profiles = StorageVault.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, []);
        const scoreMap: Record<string, GameScoreRecord> = {};
        for (const row of cloudScores) {
          const user = profiles.find((p) => p.id === row.user_id);
          scoreMap[row.game_id] = {
            userId: row.user_id,
            userName: user?.fullName || 'کاربر سیستم',
            score: Number(row.high_score) || 0,
          };
        }
        StorageVault.setItem(STORAGE_KEYS.GAME_SCORES, scoreMap);
      }

      this.lastSyncTime = new Date().toLocaleTimeString('fa-IR');
      try {
        localStorage.setItem('2077_last_cloud_sync_time', this.lastSyncTime);
      } catch {}

      if (this.onDataSynced) {
        this.onDataSynced();
      }
      return true;
    } catch (err) {
      console.warn('[CloudSync] Pull from cloud warning:', err);
      return false;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  async saveProfile(profile: UserProfile): Promise<boolean> {
    try {
      const row = toCloudProfile(profile);
      const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
      if (error) {
        console.error('[CloudSync] saveProfile error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[CloudSync] saveProfile exception:', e);
      return false;
    }
  }

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  async saveTask(task: Task): Promise<boolean> {
    try {
      const row = toCloudTask(task);
      const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  async saveAnnouncement(ann: Announcement): Promise<boolean> {
    try {
      const row = toCloudAnnouncement(ann);
      const { error } = await supabase.from('announcements').upsert(row, { onConflict: 'id' });
      return !error;
    } catch {
      return false;
    }
  }

  async saveGameScore(gameId: string, userId: string, score: number): Promise<boolean> {
    try {
      // Check existing high score
      const { data: existing } = await supabase
        .from('game_scores')
        .select('id, high_score')
        .eq('game_id', gameId)
        .limit(1);

      if (existing && existing.length > 0) {
        if (score > (existing[0].high_score || 0)) {
          await supabase
            .from('game_scores')
            .update({ user_id: userId, high_score: score, updated_at: new Date().toISOString() })
            .eq('id', existing[0].id);
        }
      } else {
        const newScoreId = generateUUID();
        await supabase.from('game_scores').insert([
          {
            id: newScoreId,
            game_id: gameId,
            user_id: userId,
            high_score: score,
          },
        ]);
      }
      return true;
    } catch {
      return false;
    }
  }

  private setupRealtimeSubscriptions() {
    try {
      supabase
        .channel('realtime-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          this.pullAllFromCloud().catch(() => {});
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          this.pullAllFromCloud().catch(() => {});
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          this.pullAllFromCloud().catch(() => {});
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, () => {
          this.pullAllFromCloud().catch(() => {});
        })
        .subscribe();
    } catch (e) {
      console.warn('[CloudSync] Realtime setup issue:', e);
    }
  }
}
