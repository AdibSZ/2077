/**
 * App Version & Update Service
 * Checks version.json and Service Worker state to trigger cyberpunk update popups.
 */

export const CURRENT_APP_VERSION = '2.8.8';
export const CURRENT_BUILD_TIME = 1793755000000;

export interface RemoteVersionInfo {
  version: string;
  buildTime: number;
  buildDate?: string;
  description?: string;
}

export type UpdateCheckResult = {
  hasUpdate: boolean;
  remote?: RemoteVersionInfo;
  currentVersion: string;
  error?: string;
};

type UpdateCallback = (info: RemoteVersionInfo) => void;
const updateListeners: Set<UpdateCallback> = new Set();

export function onAppUpdateAvailable(callback: UpdateCallback): () => void {
  updateListeners.add(callback);
  return () => {
    updateListeners.delete(callback);
  };
}

export function notifyUpdateAvailable(info: RemoteVersionInfo): void {
  updateListeners.forEach((cb) => {
    try {
      cb(info);
    } catch (e) {
      console.warn('Update listener error:', e);
    }
  });
}

/**
 * Checks for updates by querying version.json and triggering ServiceWorker update.
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  // 1. Trigger Service Worker registration update check if supported
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          const remote: RemoteVersionInfo = {
            version: CURRENT_APP_VERSION,
            buildTime: Date.now(),
            description: 'نسخه جدید در حافظه مرورگر دریافت شد و آماده نصب است.',
          };
          notifyUpdateAvailable(remote);
          return { hasUpdate: true, remote, currentVersion: CURRENT_APP_VERSION };
        }
      }
    } catch (swErr) {
      console.warn('SW update check issue:', swErr);
    }
  }

  // 2. Fetch version.json directly with cache-busting timestamp
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const res = await fetch(`${cleanBase}version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });

    if (!res.ok) {
      return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION };
    }

    const data: RemoteVersionInfo = await res.json();
    const isNewerBuild = typeof data.buildTime === 'number' && data.buildTime > CURRENT_BUILD_TIME;
    const isNewerVersion = data.version && data.version !== CURRENT_APP_VERSION;

    if (isNewerBuild || isNewerVersion) {
      notifyUpdateAvailable(data);
      return { hasUpdate: true, remote: data, currentVersion: CURRENT_APP_VERSION };
    }

    return { hasUpdate: false, remote: data, currentVersion: CURRENT_APP_VERSION };
  } catch (err) {
    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION,
      error: err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور',
    };
  }
}

/**
 * Applies the update, instructs SW to skip waiting, and reloads window.
 */
export async function applyAppUpdate(customSWUpdater?: (reloadPage?: boolean) => Promise<void>): Promise<void> {
  if (customSWUpdater) {
    try {
      await customSWUpdater(true);
    } catch {}
  }

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch {}
  }

  window.location.reload();
}
