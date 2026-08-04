import type { Meal } from './types';

/** Hour (0–24) after which a slot typically occurs (UI hints only; not auto-eaten). */
export const SLOT_PASS_HOUR: Record<string, number> = {
  Desayuno: 10,
  Almuerzo: 15,
  Snack: 18,
  Cena: 21.5,
};

export type MacroBag = { cals: number; p: number; c: number; f: number };

const emptyMacros = (): MacroBag => ({ cals: 0, p: 0, c: 0, f: 0 });

export function sumMealMacros(meals: Meal[]): MacroBag {
  return meals.reduce(
    (a, m) => ({
      cals: a.cals + m.kcal,
      p: a.p + m.p,
      c: a.c + m.c,
      f: a.f + m.f,
    }),
    emptyMacros(),
  );
}

/** Local hour as decimal (e.g. 21:30 → 21.5). */
export function localDecimalHour(now = new Date()): number {
  return now.getHours() + now.getMinutes() / 60;
}

export function slotHasPassed(slot: string, now = new Date()): boolean {
  const threshold = SLOT_PASS_HOUR[slot];
  if (threshold == null) return localDecimalHour(now) >= 12;
  return localDecimalHour(now) >= threshold;
}

function mealStatus(meal: Meal): 'planned' | 'eaten' | 'skipped' | 'replaced' {
  return meal.status || 'planned';
}

/**
 * Meals that count toward “eaten so far”.
 * Only explicit user/server marks count — never auto by clock time.
 */
export function progressiveMeals(
  meals: Meal[],
  overrides: Record<number, boolean> = {},
  _now = new Date(),
): Meal[] {
  return meals.filter((meal, i) => isMealCounted(meal, i, overrides));
}

export function progressiveMacros(
  meals: Meal[],
  overrides: Record<number, boolean> = {},
  now = new Date(),
): MacroBag {
  return sumMealMacros(progressiveMeals(meals, overrides, now));
}

export function isMealCounted(
  meal: Meal,
  index: number,
  overrides: Record<number, boolean> = {},
  _now = new Date(),
): boolean {
  const status = mealStatus(meal);
  if (status === 'skipped' || status === 'replaced') return false;
  if (status === 'eaten') return true;
  if (Object.prototype.hasOwnProperty.call(overrides, index)) {
    return overrides[index];
  }
  return false;
}

/** Build localStorage overrides from persisted meal statuses (cache). */
export function overridesFromMeals(meals: Meal[]): Record<number, boolean> {
  const out: Record<number, boolean> = {};
  meals.forEach((meal, i) => {
    const status = mealStatus(meal);
    if (status === 'eaten') out[i] = true;
    else if (status === 'skipped' || status === 'replaced') out[i] = false;
  });
  return out;
}

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const EATEN_STORAGE_KEY = 'nutriplan_meal_eaten_overrides';

type StoredEaten = { date: string; overrides: Record<string, boolean> };

export function loadEatenOverrides(now = new Date()): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(EATEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredEaten;
    if (parsed.date !== todayKey(now)) return {};
    const out: Record<number, boolean> = {};
    for (const [k, v] of Object.entries(parsed.overrides || {})) {
      out[Number(k)] = Boolean(v);
    }
    return out;
  } catch {
    return {};
  }
}

export function storeEatenOverrides(overrides: Record<number, boolean>, now = new Date()): void {
  try {
    const payload: StoredEaten = {
      date: todayKey(now),
      overrides: Object.fromEntries(
        Object.entries(overrides).map(([k, v]) => [k, v]),
      ),
    };
    localStorage.setItem(EATEN_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota
  }
}

/** Merge server meal statuses into local cache. */
export function syncEatenOverridesFromMeals(meals: Meal[], now = new Date()): Record<number, boolean> {
  const fromServer = overridesFromMeals(meals);
  const local = loadEatenOverrides(now);
  const merged = { ...local, ...fromServer };
  // Drop local marks for slots that are explicitly planned on server
  meals.forEach((meal, i) => {
    if (mealStatus(meal) === 'planned' && Object.prototype.hasOwnProperty.call(fromServer, i) === false) {
      // keep local time-override if any; server planned means no forced state
    }
  });
  storeEatenOverrides(merged, now);
  return merged;
}

const RATING_PROMPT_KEY = 'nutriplan_meal_rating_prompt';

type RatingPromptStatus = 'rated' | 'skipped';
type StoredRatingPrompts = { date: string; byMeal: Record<string, RatingPromptStatus> };

function normMealKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadRatingPromptMap(now = new Date()): Record<string, RatingPromptStatus> {
  try {
    const raw = localStorage.getItem(RATING_PROMPT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredRatingPrompts;
    if (parsed.date !== todayKey(now)) return {};
    return parsed.byMeal && typeof parsed.byMeal === 'object' ? parsed.byMeal : {};
  } catch {
    return {};
  }
}

function storeRatingPromptMap(byMeal: Record<string, RatingPromptStatus>, now = new Date()): void {
  try {
    const payload: StoredRatingPrompts = { date: todayKey(now), byMeal };
    localStorage.setItem(RATING_PROMPT_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

/** True if we already asked (rated or skipped) for this meal name today. */
export function hasAskedMealRatingToday(mealName: string, now = new Date()): boolean {
  const map = loadRatingPromptMap(now);
  return Boolean(map[normMealKey(mealName)]);
}

export function markMealRatingAsked(
  mealName: string,
  status: RatingPromptStatus,
  now = new Date(),
): void {
  const map = loadRatingPromptMap(now);
  map[normMealKey(mealName)] = status;
  storeRatingPromptMap(map, now);
}
