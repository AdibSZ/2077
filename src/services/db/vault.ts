import { STORAGE_KEYS } from './storageKeys';

interface SafeVaultSnapshot {
  timestamp: string;
  version: string;
  data: Record<string, any>;
}

export class StorageVault {
  private static memoryCache: Record<string, any> = {};

  /**
   * Safely loads a key from storage with multi-layer recovery:
   * 1. Primary: localStorage
   * 2. Secondary: Safe Vault Snapshot
   * 3. Tertiary: sessionStorage mirror
   * 4. Quaternary: In-memory runtime cache
   */
  static getItem<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null && raw !== undefined && raw.trim() !== '') {
        const parsed = JSON.parse(raw);
        this.memoryCache[key] = parsed;
        return parsed as T;
      }
    } catch (e) {
      console.warn(`[Vault] Primary read failed for key ${key}, attempting snapshot recovery...`, e);
    }

    // Attempt recovery from Safe Vault Snapshot
    try {
      const vaultRaw = localStorage.getItem(STORAGE_KEYS.SAFE_BACKUP);
      if (vaultRaw) {
        const snapshot: SafeVaultSnapshot = JSON.parse(vaultRaw);
        if (snapshot && snapshot.data && snapshot.data[key] !== undefined) {
          console.info(`[Vault] Successfully recovered key "${key}" from Safe Vault Snapshot.`);
          const recovered = snapshot.data[key];
          // Restore primary localStorage so subsequent reads are direct
          localStorage.setItem(key, JSON.stringify(recovered));
          this.memoryCache[key] = recovered;
          return recovered as T;
        }
      }
    } catch (ve) {
      console.warn(`[Vault] Recovery from snapshot failed for ${key}:`, ve);
    }

    // Attempt recovery from sessionStorage mirror
    try {
      const sessionRaw = sessionStorage.getItem(key);
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw);
        localStorage.setItem(key, sessionRaw);
        this.memoryCache[key] = parsed;
        return parsed as T;
      }
    } catch {}

    // Check memory cache
    if (this.memoryCache[key] !== undefined) {
      return this.memoryCache[key] as T;
    }

    // Brand new first visit: write fallback safely
    try {
      localStorage.setItem(key, JSON.stringify(fallback));
      this.memoryCache[key] = fallback;
    } catch {}

    return fallback;
  }

  /**
   * Safely writes a key to primary storage, updates the vault snapshot, and mirrors to session.
   */
  static setItem<T>(key: string, value: T): void {
    this.memoryCache[key] = value;
    const jsonStr = JSON.stringify(value);

    try {
      localStorage.setItem(key, jsonStr);
    } catch (e) {
      console.error(`[Vault] Failed to write key ${key} to localStorage:`, e);
    }

    try {
      sessionStorage.setItem(key, jsonStr);
    } catch {}

    // Update Safe Vault Snapshot
    this.updateSnapshot(key, value);
  }

  /**
   * Removes a key safely
   */
  static removeItem(key: string): void {
    delete this.memoryCache[key];
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {}
  }

  /**
   * Updates the persistent multi-table vault snapshot to guarantee zero data loss.
   */
  private static updateSnapshot(key: string, value: any): void {
    try {
      let currentSnapshot: SafeVaultSnapshot = {
        timestamp: new Date().toISOString(),
        version: STORAGE_KEYS.VERSION,
        data: {},
      };

      const existingRaw = localStorage.getItem(STORAGE_KEYS.SAFE_BACKUP);
      if (existingRaw) {
        try {
          currentSnapshot = JSON.parse(existingRaw);
        } catch {}
      }

      currentSnapshot.timestamp = new Date().toISOString();
      currentSnapshot.data[key] = value;
      localStorage.setItem(STORAGE_KEYS.SAFE_BACKUP, JSON.stringify(currentSnapshot));
    } catch (err) {
      console.warn('[Vault] Snapshot update warning:', err);
    }
  }

  /**
   * Returns a complete backup archive object of all system data.
   */
  static getFullBackup(): Record<string, any> {
    const backup: Record<string, any> = {};
    for (const [name, k] of Object.entries(STORAGE_KEYS)) {
      if (k === STORAGE_KEYS.AUTH_SESSION) continue;
      try {
        const val = localStorage.getItem(k);
        if (val) backup[name] = JSON.parse(val);
      } catch {}
    }
    return backup;
  }
}
