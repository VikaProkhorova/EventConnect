/**
 * App-level settings (language, notification toggles) — sessionStorage backed.
 */

export type AppLanguage = 'en' | 'uk' | 'es' | 'de';

export const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Українська' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

export type NotificationToggles = {
  chat: boolean;
  match: boolean;
  meetingReminder: boolean;
  engagementNudge: boolean;
  breakNetworking: boolean;
};

export const DEFAULT_NOTIFICATION_TOGGLES: NotificationToggles = {
  chat: true,
  match: true,
  meetingReminder: true,
  engagementNudge: false,
  breakNetworking: true,
};

const LANG_KEY = 'appLanguage';
const NOTIFS_KEY = 'notificationToggles';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getAppLanguage(): AppLanguage {
  const v = readJson<AppLanguage | null>(LANG_KEY, null);
  return v ?? 'en';
}
export function setAppLanguage(v: AppLanguage): void {
  writeJson(LANG_KEY, v);
}

export function getNotificationToggles(): NotificationToggles {
  return { ...DEFAULT_NOTIFICATION_TOGGLES, ...readJson<Partial<NotificationToggles>>(NOTIFS_KEY, {}) };
}
export function setNotificationToggles(v: NotificationToggles): void {
  writeJson(NOTIFS_KEY, v);
}

/** Wipes everything user-related from sessionStorage. Used by Logout / Delete account. */
export function clearAllUserData(): void {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/* ───────── Privacy settings (moved from ProfileScreen, SOW §4.9 / §4.17) ───────── */

export type PrivacySettings = {
  matchVisibility: 'all' | 'liked';
  whoCanMessage: 'all' | 'liked-match' | 'match';
  contactVisibility: 'all' | 'liked-match' | 'match';
};

export const DEFAULT_PRIVACY: PrivacySettings = {
  matchVisibility: 'all',
  whoCanMessage: 'all',
  contactVisibility: 'liked-match',
};

const PRIVACY_KEY = 'privacySettings';

export function getPrivacySettings(): PrivacySettings {
  return { ...DEFAULT_PRIVACY, ...readJson<Partial<PrivacySettings>>(PRIVACY_KEY, {}) };
}
export function setPrivacySettings(v: PrivacySettings): void {
  writeJson(PRIVACY_KEY, v);
}
