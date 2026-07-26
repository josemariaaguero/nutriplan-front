export type NotificationPrefs = {
  mealReminders: boolean;
  weeklyPlan: boolean;
  sportSync: boolean;
  tips: boolean;
};

const KEY = 'nutriplan_notification_prefs';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  mealReminders: true,
  weeklyPlan: true,
  sportSync: false,
  tips: true,
};

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
