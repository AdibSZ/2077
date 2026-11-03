import { sound } from '../utils/audio';

export type NotificationPermState = 'granted' | 'denied' | 'default' | 'unsupported';

class WebNotificationService {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermState;
  }

  public async requestPermission(): Promise<NotificationPermState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        sound.play('score');
        await this.showNotification('سیستم اعلان‌های ۲۰۷۷ فعال شد', {
          body: 'از این پس هشدارهای فوری و تسک‌های جدید به صورت سیستمی به شما اطلاع داده می‌شوند.',
          tag: 'welcome-notification',
        });
      }
      return res as NotificationPermState;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return this.getPermission();
    }
  }

  public async showNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      renotify?: boolean;
      requireInteraction?: boolean;
      data?: any;
    }
  ): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    const defaultIcon = '/icons/icon-192.png';
    const mergedOptions: any = {
      body: options?.body || '',
      icon: options?.icon || defaultIcon,
      badge: options?.badge || defaultIcon,
      tag: options?.tag || '2077-general',
      renotify: options?.renotify ?? true,
      requireInteraction: options?.requireInteraction ?? false,
      data: options?.data,
    };

    // Trigger vibration on devices that support it
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    // Try service worker showNotification first
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, mergedOptions);
          return true;
        }
      } catch (e) {
        console.warn('Service worker showNotification fallback:', e);
      }
    }

    // Fallback to standard Notification constructor
    try {
      new Notification(title, mergedOptions);
      return true;
    } catch (e) {
      console.warn('Standard Notification failed:', e);
      return false;
    }
  }

  public notifyEmergencyAlert(title: string, content: string): void {
    sound.play('hit');
    this.showNotification(`🚨 هشدار اضطراری مدیر: ${title}`, {
      body: content,
      tag: 'emergency-alert',
      requireInteraction: true,
    });
  }

  public notifyNewTask(taskTitle: string, isGlobal = false): void {
    sound.play('tap');
    this.showNotification(
      isGlobal ? '⚡ وظیفه همگانی جدید تعریف شد' : '⚡ وظیفه جدید به شما محول شد',
      {
        body: taskTitle,
        tag: 'task-assigned',
      }
    );
  }
}

export const webNotifications = new WebNotificationService();
