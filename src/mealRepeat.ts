import { WEEK_MEAL_SLOTS } from './data';

/** How often a repeated dish may come back in the week. */
export type MealRepeatFrequency =
  | 'daily_variety'
  | 'every_2_3_days'
  | 'weekday_weekend'
  | 'flexible';

export type MealRepeatSlot = 'Desayuno' | 'Almuerzo' | 'Snack' | 'Cena';

export type MealRepeatPrefs = {
  frequency: MealRepeatFrequency;
  /** Moments where the frequency applies. Ignored for daily_variety. */
  slots: MealRepeatSlot[];
};

/** @deprecated Use MealRepeatFrequency — kept for older call sites. */
export type MealRepeatPolicy = MealRepeatFrequency;

export const DEFAULT_MEAL_REPEAT_FREQUENCY: MealRepeatFrequency = 'daily_variety';
export const DEFAULT_MEAL_REPEAT_SLOTS: MealRepeatSlot[] = ['Almuerzo', 'Cena'];

export const DEFAULT_MEAL_REPEAT_PREFS: MealRepeatPrefs = {
  frequency: DEFAULT_MEAL_REPEAT_FREQUENCY,
  slots: [...DEFAULT_MEAL_REPEAT_SLOTS],
};

/** Legacy aliases from the avoid/allow MVP. */
const LEGACY_FREQUENCY: Record<string, MealRepeatFrequency> = {
  avoid: 'daily_variety',
  allow: 'flexible',
  daily_variety: 'daily_variety',
  every_2_3_days: 'every_2_3_days',
  weekday_weekend: 'weekday_weekend',
  flexible: 'flexible',
};

export const MEAL_REPEAT_FREQUENCY_OPTIONS: {
  id: MealRepeatFrequency;
  label: string;
  desc: string;
}[] = [
  {
    id: 'daily_variety',
    label: 'Una diferente cada día',
    desc: 'Máxima variedad: evita repetir el mismo plato en la semana',
  },
  {
    id: 'every_2_3_days',
    label: 'Cada 2–3 días',
    desc: 'El mismo plato se mantiene 2–3 días seguidos (batch cooking)',
  },
  {
    id: 'weekday_weekend',
    label: 'Entre semana / fin de semana',
    desc: 'Un plato de lunes a viernes y otro distinto el sábado y domingo',
  },
  {
    id: 'flexible',
    label: 'Flexible',
    desc: 'Puede repetirse cualquier día sin un patrón fijo',
  },
];

export const MEAL_REPEAT_SLOT_OPTIONS: { id: MealRepeatSlot; label: string }[] = [
  { id: 'Desayuno', label: 'Desayuno' },
  { id: 'Almuerzo', label: 'Almuerzo' },
  { id: 'Snack', label: 'Snack' },
  { id: 'Cena', label: 'Cena' },
];

export function normalizeMealRepeatFrequency(value?: string | null): MealRepeatFrequency {
  if (!value) return DEFAULT_MEAL_REPEAT_FREQUENCY;
  return LEGACY_FREQUENCY[value] ?? DEFAULT_MEAL_REPEAT_FREQUENCY;
}

/** @deprecated Prefer normalizeMealRepeatFrequency */
export function normalizeMealRepeatPolicy(value?: string | null): MealRepeatFrequency {
  return normalizeMealRepeatFrequency(value);
}

export function normalizeMealRepeatSlots(value?: string[] | null): MealRepeatSlot[] {
  const allowed = new Set<string>(WEEK_MEAL_SLOTS);
  const cleaned = (value || [])
    .map(s => String(s).trim())
    .filter((s): s is MealRepeatSlot => allowed.has(s));
  return cleaned.length > 0 ? cleaned : [...DEFAULT_MEAL_REPEAT_SLOTS];
}

export function normalizeMealRepeatPrefs(
  frequency?: string | null,
  slots?: string[] | null,
): MealRepeatPrefs {
  const freq = normalizeMealRepeatFrequency(frequency);
  return {
    frequency: freq,
    slots: freq === 'daily_variety' ? [...DEFAULT_MEAL_REPEAT_SLOTS] : normalizeMealRepeatSlots(slots),
  };
}

export function mealRepeatFrequencyLabel(value?: string | null): string {
  const id = normalizeMealRepeatFrequency(value);
  return MEAL_REPEAT_FREQUENCY_OPTIONS.find(o => o.id === id)?.label ?? 'Una diferente cada día';
}

/** Short label for profile summary rows. */
export function mealRepeatLabel(
  frequency?: string | null,
  slots?: string[] | null,
): string {
  const prefs = normalizeMealRepeatPrefs(frequency, slots);
  if (prefs.frequency === 'daily_variety') {
    return mealRepeatFrequencyLabel(prefs.frequency);
  }
  const slotBit = prefs.slots.length === WEEK_MEAL_SLOTS.length
    ? 'todas'
    : prefs.slots.join(', ');
  return `${mealRepeatFrequencyLabel(prefs.frequency)} · ${slotBit}`;
}

export function mealRepeatNeedsSlots(frequency: MealRepeatFrequency): boolean {
  return frequency !== 'daily_variety';
}

export function slotUsesRepeatPattern(
  slot: string,
  prefs: MealRepeatPrefs,
): boolean {
  if (prefs.frequency === 'daily_variety') return false;
  if (prefs.frequency === 'flexible') {
    return prefs.slots.includes(slot as MealRepeatSlot);
  }
  return prefs.slots.includes(slot as MealRepeatSlot);
}

/**
 * For patterned slots, which "bucket" key to reuse the same dish.
 * Days with the same key share a meal title for that slot.
 */
export function mealRepeatBucket(dayIdx: number, frequency: MealRepeatFrequency): string {
  if (frequency === 'every_2_3_days') {
    // Blocks of ~2–3 days: 0-1 | 2-3-4 | 5-6
    if (dayIdx <= 1) return 'b0';
    if (dayIdx <= 4) return 'b1';
    return 'b2';
  }
  if (frequency === 'weekday_weekend') {
    return dayIdx <= 4 ? 'weekday' : 'weekend';
  }
  return `d${dayIdx}`;
}
