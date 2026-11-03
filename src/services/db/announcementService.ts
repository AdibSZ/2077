import { Announcement } from '../../types';
import { STORAGE_KEYS, INITIAL_ANNOUNCEMENT } from './storageKeys';
import { StorageVault } from './vault';

export class AnnouncementService {
  private announcement: Announcement;

  constructor() {
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
    this.announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      priority,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.saveAnnouncementLocally();
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
    this.announcement = {
      id: `ann-${Date.now()}`,
      title: 'تابلوی اعلانات فروشگاه ۲۰۷۷',
      content: '',
      priority: 'عادی',
      isActive: false,
      createdAt: new Date().toISOString(),
    };

    this.saveAnnouncementLocally();
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
