import type { ExtraLogApi } from './api/types';

const STORAGE_KEY = 'nutriplan_daily_other_extras';

type StoredDay = { date: string; extras: ExtraLogApi[] };

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadTodayOtherExtras(now = new Date()): ExtraLogApi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredDay;
    if (stored.date !== todayKey(now)) return [];
    return Array.isArray(stored.extras) ? stored.extras : [];
  } catch {
    return [];
  }
}

export function storeTodayOtherExtras(extras: ExtraLogApi[], now = new Date()): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(now), extras }),
    );
  } catch {
    // ignore
  }
}
