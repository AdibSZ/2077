import { Announcement } from '../../types';
import { STORAGE_KEYS, INITIAL_ANNOUNCEMENT } from './storageKeys';
import { StorageVault } from './vault';
import { generateUUID, isUUID } from './supabaseClient';

export class AnnouncementService {
  private announcement: Announcement;
  private onCloudSave?: (a: Announcement) => Promise<boolean>;

  constructor(onCloudSave?: (a: Announcement) => Promise<boolean>) {
    this.onCloudSave = onCloudSave;
    this.announcement = StorageVault.getItem<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENT);
  }

  getAnnouncement(): Announcement {
    this.announcement = StorageVault.getItem<Announcement>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENT);
    return { ...this.announcement };
  }

  async updateAnnouncement(
    title: string,
    content: string,
    priority: 'عادی' | 'مهم' | 'فوری' = 'عادی'
  ): Promise<Announcement> {
    const safeId = this.announcement.id && isUUID(this.announcement.id) ? this.announcement.id : generateUUID();
    this.announcement = {
      id: safeId,
      title,
      content,
      priority,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.saveAnnouncementLocally();

    if (this.onCloudSave) {
      this.onCloudSave(this.announcement).catch(() => {});
    }

    return this.announcement;
  }

  async publishUrgentAlert(title: string, content: string): Promise<Announcement> {
    return this.updateAnnouncement(title, content, 'فوری');
  }

  async clearUrgentAlert(): Promise<Announcement> {
    if (this.announcement.priority === 'فوری') {
      return this.updateAnnouncement('تابلوی اعلانات فروشگاه ۲۰۷۷', '', 'عادی');
    }
    return this.announcement;
  }

  async clearAnnouncement(): Promise<Announcement> {
    const safeId = this.announcement.id && isUUID(this.announcement.id) ? this.announcement.id : generateUUID();
    this.announcement = {
      id: safeId,
      title: 'تابلوی اعلانات فروشگاه ۲۰۷۷',
      content: '',
      priority: 'عادی',
      isActive: false,
      createdAt: new Date().toISOString(),
    };

    this.saveAnnouncementLocally();

    if (this.onCloudSave) {
      this.onCloudSave(this.announcement).catch(() => {});
    }

    return this.announcement;
  }

  setAnnouncementFromRemote(remoteAnnouncement: Announcement) {
    this.announcement = remoteAnnouncement;
    this.saveAnnouncementLocally();
  }

  private saveAnnouncementLocally() {
    StorageVault.setItem(STORAGE_KEYS.ANNOUNCEMENTS, this.announcement);
  }
}
