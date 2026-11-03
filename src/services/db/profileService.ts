import { UserProfile } from '../../types';
import { STORAGE_KEYS, INITIAL_PROFILES, normalizePersianText } from './storageKeys';
import { StorageVault } from './vault';

export class ProfileService {
  private profiles: UserProfile[];
  private currentUser: UserProfile | null = null;

  constructor() {
    this.profiles = StorageVault.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    this.currentUser = StorageVault.getItem<UserProfile | null>(STORAGE_KEYS.AUTH_SESSION, null);
  }

  getProfiles(): UserProfile[] {
    this.profiles = StorageVault.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    return [...this.profiles];
  }

  getProfileById(id: string): UserProfile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  getProfileByUsername(rawUsername: string): UserProfile | undefined {
    const clean = normalizePersianText(rawUsername);
    return this.getProfiles().find((p) => normalizePersianText(p.username) === clean);
  }

  getCurrentUser(): UserProfile | null {
    this.currentUser = StorageVault.getItem<UserProfile | null>(STORAGE_KEYS.AUTH_SESSION, null);
    return this.currentUser;
  }

  setAuthSession(user: UserProfile) {
    this.currentUser = user;
    StorageVault.setItem(STORAGE_KEYS.AUTH_SESSION, user);
  }

  clearAuthSession() {
    this.currentUser = null;
    StorageVault.removeItem(STORAGE_KEYS.AUTH_SESSION);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch {}
  }

  logout() {
    this.clearAuthSession();
  }

  verifyLogin(rawUsername: string, rawPassword: string): UserProfile | null {
    const cleanUsername = normalizePersianText(rawUsername);
    const cleanPassword = normalizePersianText(rawPassword);

    // Refresh from storage to guarantee latest profiles are inspected
    this.profiles = this.getProfiles();

    const matched = this.profiles.find((p) => {
      const storedU = normalizePersianText(p.username);
      const storedP = normalizePersianText(p.passwordHash);
      return storedU === cleanUsername && storedP === cleanPassword;
    });

    if (matched) {
      this.setAuthSession(matched);
      return matched;
    }

    return null;
  }

  async addProfile(
    profile: Omit<UserProfile, 'id' | 'bankedXp' | 'crownsCount' | 'totalCp'> & {
      id?: string;
      bankedXp?: number;
      crownsCount?: number;
      totalCp?: number;
    }
  ): Promise<UserProfile> {
    this.profiles = this.getProfiles();
    const newId = profile.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullProfile: UserProfile = {
      ...profile,
      id: newId,
      username: normalizePersianText(profile.username),
      passwordHash: normalizePersianText(profile.passwordHash),
      bankedXp: profile.bankedXp || 0,
      crownsCount: profile.crownsCount || 0,
      totalCp: profile.totalCp || 0,
    };

    this.profiles.push(fullProfile);
    this.saveProfilesLocally();
    return fullProfile;
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    this.profiles = this.getProfiles();
    const index = this.profiles.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.username) {
      sanitizedUpdates.username = normalizePersianText(sanitizedUpdates.username);
    }
    if (sanitizedUpdates.passwordHash) {
      sanitizedUpdates.passwordHash = normalizePersianText(sanitizedUpdates.passwordHash);
    }

    const updated = {
      ...this.profiles[index],
      ...sanitizedUpdates,
    };

    this.profiles[index] = updated;
    this.saveProfilesLocally();

    if (this.currentUser && this.currentUser.id === id) {
      this.setAuthSession(updated);
    }

    return updated;
  }

  async deleteProfile(id: string): Promise<boolean> {
    this.profiles = this.getProfiles();
    const prevLength = this.profiles.length;
    this.profiles = this.profiles.filter((p) => p.id !== id);
    if (this.profiles.length !== prevLength) {
      this.saveProfilesLocally();
      return true;
    }
    return false;
  }

  setProfilesFromRemote(remoteProfiles: UserProfile[]) {
    this.profiles = remoteProfiles;
    this.saveProfilesLocally();
  }

  private saveProfilesLocally() {
    StorageVault.setItem(STORAGE_KEYS.PROFILES, this.profiles);
  }
}
