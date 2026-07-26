import { MEAL_ALTERNATIVES, WEEK_MEALS, WEEK_MEAL_SLOTS } from './data';
import type { MealPlanGenerateApi } from './api';
import type { Meal, Sport } from './types';

const WEEK_STORAGE_KEY = 'nutriplan_week_meals';
const WEEK_OVERRIDES_KEY = 'nutriplan_week_meal_overrides';

function overrideKey(dayIdx: number, slotIdx: number): string {
  return `${dayIdx}-${slotIdx}`;
}

export function loadWeekMealOverride(dayIdx: number, slotIdx: number): Meal | null {
  try {
    const raw = localStorage.getItem(WEEK_OVERRIDES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, Meal>;
    return map[overrideKey(dayIdx, slotIdx)] ?? null;
  } catch {
    return null;
  }
}

export function storeWeekMealOverride(dayIdx: number, slotIdx: number, meal: Meal): void {
  try {
    const raw = localStorage.getItem(WEEK_OVERRIDES_KEY);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, Meal>;
    map[overrideKey(dayIdx, slotIdx)] = meal;
    localStorage.setItem(WEEK_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

export function clearWeekMealOverride(dayIdx: number, slotIdx: number): void {
  try {
    const raw = localStorage.getItem(WEEK_OVERRIDES_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, Meal>;
    delete map[overrideKey(dayIdx, slotIdx)];
    localStorage.setItem(WEEK_OVERRIDES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function clearAllWeekMealOverrides(): void {
  try {
    localStorage.removeItem(WEEK_OVERRIDES_KEY);
  } catch {
    // ignore
  }
}

/** Replace one ingredient and recalculate meal-level macros. */
export function applyLocalIngredientSwap(
  meal: Meal,
  ingredientIndex: number,
  alternative: Meal['ingredients'][number],
): Meal {
  const ingredients = meal.ingredients.map((ing, i) =>
    i === ingredientIndex ? { ...alternative } : ing,
  );
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    ...meal,
    ingredients,
    kcal: round1(ingredients.reduce((a, i) => a + i.kcal, 0)),
    p: round1(ingredients.reduce((a, i) => a + i.p, 0)),
    c: round1(ingredients.reduce((a, i) => a + i.c, 0)),
    f: round1(ingredients.reduce((a, i) => a + i.f, 0)),
  };
}

const MEAT_FISH = [
  'pollo', 'pavo', 'ternera', 'cerdo', 'carne', 'jamón', 'jamon',
  'salmón', 'salmon', 'atún', 'atun', 'pescado', 'merluza', 'bacalao',
  'lubina', 'sardina', 'gambas', 'marisco',
];
const ANIMAL_EXTRA = [
  'huevo', 'yogur', 'yogurt', 'quark', 'queso', 'skyr', 'ricotta',
  'leche', 'miel', 'mantequilla', 'clara',
];

const ALLERGY_TOKENS: Record<string, string[]> = {
  Gluten: ['espelta', 'centeno', 'pasta', 'pan', 'trigo', 'gofre', 'pancakes', 'quiche', 'seitán', 'seitan'],
  Lactosa: ['yogur', 'yogurt', 'quark', 'queso', 'skyr', 'ricotta', 'leche', 'mantequilla'],
  'Frutos secos': ['nuez', 'nueces', 'almendra', 'almendras', 'pistacho', 'avellana', 'anacardo', 'frutos secos', 'cacahuete'],
  Huevo: ['huevo', 'clara', 'tortilla', 'quiche', 'gofre', 'pancakes'],
  Soja: ['tofu', 'edamame', 'soja', 'tempeh', 'miso', 'teriyaki'],
  Marisco: ['marisco', 'gambas', 'langostino', 'mejillón', 'mejillon'],
  Cacahuetes: ['cacahuete', 'maní', 'mani'],
};

function titleHas(title: string, tokens: string[]): boolean {
  const t = title.toLowerCase();
  return tokens.some(tok => t.includes(tok));
}

export function mealFitsDiet(title: string, dietType?: string | null): boolean {
  if (!dietType || dietType === 'Omnívora' || dietType === 'Flexitariana') return true;
  if (dietType === 'Vegetariana') return !titleHas(title, MEAT_FISH);
  if (dietType === 'Vegana') return !titleHas(title, [...MEAT_FISH, ...ANIMAL_EXTRA]);
  if (dietType === 'Sin lácteos') {
    return !titleHas(title, ['yogur', 'yogurt', 'quark', 'queso', 'skyr', 'ricotta', 'leche', 'mantequilla']);
  }
  if (dietType === 'Sin gluten') {
    return !titleHas(title, ['espelta', 'centeno', 'pasta', 'pan', 'trigo', 'gofre', 'pancakes', 'quiche']);
  }
  return true;
}

export function mealFitsAllergies(title: string, allergies?: string[] | null): boolean {
  if (!allergies?.length) return true;
  for (const a of allergies) {
    const tokens = ALLERGY_TOKENS[a];
    if (tokens && titleHas(title, tokens)) return false;
  }
  return true;
}

function mealAllowed(title: string, dietType?: string | null, allergies?: string[] | null): boolean {
  return mealFitsDiet(title, dietType) && mealFitsAllergies(title, allergies);
}

function isOmnivoreProteinMeal(title: string): boolean {
  return titleHas(title, [...MEAT_FISH, 'huevo']);
}

/** Detect English meal titles from Spoonacular (and similar APIs). */
export function looksEnglishTitle(title: string): boolean {
  const t = title.trim();
  if (!t) return false;

  if (/[áéíóúñü]/i.test(t)) return false;
  if (/\b(de|con|y|sin|al|del)\b/i.test(t)) return false;
  if (/\b(espelta|lenteja|garbanzo|boniato|quark|yogur|centeno|tofu|edamame|hummus|tortilla|calabaza|revuelto|tostada|ensalada|batido|almendra|platano|avena|quinoa|frutos)\b/i.test(t)) {
    return false;
  }

  if (/\b(with|without|and|the|for|from|quick|easy|spicy|creamy|baked|grilled|fried|roasted)\b/i.test(t)) {
    return true;
  }
  if (/\b(chicken|beef|pork|muffin|stir-?fry|zucchini|asparagus|peach|veggie|sardine|piri)\b/i.test(t)) {
    return true;
  }

  return /^[A-Za-z0-9 &',\-]+$/.test(t) && /[A-Z][a-z]+ [A-Z]/.test(t);
}

function weekHasEnglishTitles(meals: string[][]): boolean {
  return meals.some(day => day.some(looksEnglishTitle));
}

export type WeekGenOpts = {
  dietType?: string | null;
  allergies?: string[] | null;
};

/** Build a fresh 7×4 week from local alternatives (Spanish, no API). */
export function generateLocalWeekMeals(opts?: WeekGenOpts | string | null): string[][] {
  // Back-compat: generateLocalWeekMeals('Omnívora')
  const dietType = typeof opts === 'string' || opts == null
    ? (opts as string | null | undefined)
    : opts.dietType;
  const allergies = typeof opts === 'object' && opts ? opts.allergies : undefined;

  const used = new Set<string>();
  const preferAnimal = !dietType || dietType === 'Omnívora' || dietType === 'Flexitariana';

  function pick(slot: string, dayIdx: number): string {
    const fromAlts = (MEAL_ALTERNATIVES[slot] || []).map(m => m.name);
    const slotIdx = WEEK_MEAL_SLOTS.indexOf(slot);
    const fromWeek = WEEK_MEALS.map(d => d[slotIdx]).filter(Boolean);
    const raw = [...fromAlts, ...fromWeek];
    const pool = raw.filter(n => mealAllowed(n, dietType, allergies));
    const effective = pool.length > 0 ? pool : raw;
    if (effective.length === 0) return `${slot} del día`;

    let candidates = effective;
    if (preferAnimal && (slot === 'Almuerzo' || slot === 'Cena')) {
      const animal = effective.filter(isOmnivoreProteinMeal);
      if (animal.length > 0 && Math.random() < 0.72) candidates = animal;
    }

    const start = (dayIdx * 3 + slotIdx * 5 + Math.floor(Math.random() * candidates.length)) % candidates.length;
    for (let i = 0; i < candidates.length; i++) {
      const name = candidates[(start + i) % candidates.length];
      if (!used.has(name)) {
        used.add(name);
        return name;
      }
    }
    return candidates[start % candidates.length];
  }

  return Array.from({ length: 7 }, (_, day) =>
    WEEK_MEAL_SLOTS.map(slot => pick(slot, day)),
  );
}

/**
 * Map API meal-plan → week titles.
 * Always keeps Spanish: English Spoonacular titles are replaced by the local pool.
 */
export function mealPlanToWeekMeals(
  plan: MealPlanGenerateApi,
  opts?: WeekGenOpts | string | null,
): string[][] {
  const dietType = typeof opts === 'string' || opts == null
    ? (opts as string | null | undefined)
    : opts.dietType;
  const allergies = typeof opts === 'object' && opts ? opts.allergies : undefined;
  const local = generateLocalWeekMeals({ dietType, allergies });

  if (plan.source !== 'local') {
    return local;
  }

  const days = plan.days || [];
  return Array.from({ length: 7 }, (_, i) => {
    const apiMeals = days[i]?.meals ?? [];
    const titles = apiMeals.map(m => m.title).filter(Boolean);
    const fallback = local[i];
    return WEEK_MEAL_SLOTS.map((_, slot) => {
      const t = titles[slot];
      if (!t || looksEnglishTitle(t)) return fallback[slot];
      if (!mealAllowed(t, dietType, allergies)) return fallback[slot];
      return t;
    });
  });
}

export function loadStoredWeekMeals(): string[][] | null {
  try {
    const raw = localStorage.getItem(WEEK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[][];
    if (!Array.isArray(parsed) || parsed.length !== 7) return null;
    if (!parsed.every(d => Array.isArray(d) && d.length === 4)) return null;
    if (weekHasEnglishTitles(parsed)) {
      localStorage.removeItem(WEEK_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeWeekMeals(meals: string[][]): void {
  try {
    localStorage.setItem(WEEK_STORAGE_KEY, JSON.stringify(meals));
  } catch {
    // ignore quota
  }
}

/** Persist titles and drop ingredient overrides (new week / full meal swap). */
export function storeWeekMealsFresh(meals: string[][]): void {
  storeWeekMeals(meals);
  clearAllWeekMealOverrides();
}

/** Current ISO week label, e.g. "SEMANA 29 · 13–19 JUL" */
export function currentWeekLabel(ref = new Date()): string {
  const day = ref.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const oneJan = new Date(ref.getFullYear(), 0, 1);
  const week = Math.ceil((((ref.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);

  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
  return `SEMANA ${week} · ${monday.getDate()}–${fmt(sunday)}`;
}

/** Day numbers Mon–Sun for the current week */
export function currentWeekDayNumbers(ref = new Date()): number[] {
  const day = ref.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
}

/** Monday=0 … Sunday=6 for the current week. */
export function currentWeekDayIndex(ref = new Date()): number {
  const day = ref.getDay();
  return day === 0 ? 6 : day - 1;
}

const WEEK_SPORTS_KEY = 'nutriplan_week_sports';
const CUSTOM_SPORTS_KEY = 'nutriplan_custom_sports';

function cloneSportList(sports: Sport[]): Sport[] {
  return sports.map(s => ({ ...s }));
}

export function isCustomSportId(id: string): boolean {
  return id.startsWith('custom:');
}

export function loadCustomSports(): Sport[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Sport[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(s => s && typeof s.id === 'string' && isCustomSportId(s.id))
      .map(s => ({
        id: s.id,
        name: s.name || 'Actividad',
        emoji: s.emoji || '🏃',
        min: Math.max(1, Number(s.min) || 30),
        kcal: Math.max(1, Number(s.kcal) || 150),
        on: false,
        custom: true,
        activityType: s.activityType,
      }));
  } catch {
    return [];
  }
}

export function storeCustomSports(sports: Sport[]): void {
  try {
    const clean = sports
      .filter(s => isCustomSportId(s.id) || s.custom)
      .map(s => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        min: s.min,
        kcal: s.kcal,
        on: false,
        custom: true,
        activityType: s.activityType,
      }));
    localStorage.setItem(CUSTOM_SPORTS_KEY, JSON.stringify(clean));
  } catch {
    // ignore quota
  }
}

/** Default catalog + user-created activities. */
export function sportCatalog(defaults: Sport[]): Sport[] {
  const custom = loadCustomSports();
  const ids = new Set(defaults.map(d => d.id));
  return [...defaults.map(s => ({ ...s })), ...custom.filter(c => !ids.has(c.id))];
}

export function createCustomSport(input: {
  name: string;
  min: number;
  kcal: number;
  emoji?: string;
  activityType?: string;
}): Sport {
  const min = Math.max(1, Math.min(480, Math.round(input.min) || 30));
  const kcal = Math.max(1, Math.min(5000, Math.round(input.kcal) || 150));
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `custom:${crypto.randomUUID()}`
      : `custom:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    name: input.name.trim() || 'Actividad personalizada',
    emoji: input.emoji || '🏃',
    min,
    kcal,
    on: true,
    customMin: min,
    activityType: input.activityType,
    custom: true,
  };
}

export function mergeDayWithCatalog(day: Sport[] | undefined, catalog: Sport[]): Sport[] {
  const byId = new Map((day || []).map(s => [s.id, s]));
  const fromCatalog = catalog.map(base => {
    const saved = byId.get(base.id);
    if (!saved) return { ...base, on: false };
    return {
      ...base,
      on: Boolean(saved.on),
      customMin: saved.customMin,
      activityType: saved.activityType ?? base.activityType,
      custom: base.custom || isCustomSportId(base.id),
    };
  });
  const catalogIds = new Set(catalog.map(s => s.id));
  const orphans = (day || [])
    .filter(s => !catalogIds.has(s.id))
    .map(s => ({ ...s, custom: s.custom || isCustomSportId(s.id) }));
  return [...fromCatalog, ...orphans];
}

/** Seven days of inactive copies of the catalog (user plans each day). */
export function defaultWeekSports(catalog: Sport[]): Sport[][] {
  return Array.from({ length: 7 }, () =>
    cloneSportList(catalog).map(s => ({ ...s, on: false })),
  );
}

export function loadStoredWeekSports(catalog: Sport[]): Sport[][] | null {
  try {
    const raw = localStorage.getItem(WEEK_SPORTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Sport[][];
    if (!Array.isArray(parsed) || parsed.length !== 7) return null;
    return parsed.map(day => mergeDayWithCatalog(day, catalog));
  } catch {
    return null;
  }
}

export function storeWeekSports(week: Sport[][]): void {
  try {
    localStorage.setItem(WEEK_SPORTS_KEY, JSON.stringify(week));
  } catch {
    // ignore quota
  }
}

export function sportBurnKcal(sports: Sport[]): number {
  return sports
    .filter(s => s.on)
    .reduce((a, s) => {
      const min = s.customMin ?? s.min;
      return a + Math.round((s.kcal / s.min) * min);
    }, 0);
}

export function weekSportLabel(sports: Sport[]): string {
  const active = sports.filter(s => s.on);
  if (active.length === 0) return 'Sin actividad física';
  if (active.length === 1) return active[0].name.split('(')[0].trim();
  return `${active.length} actividades`;
}

/** Patch one day in the week plan and persist. */
export function withWeekDaySports(
  week: Sport[][],
  dayIdx: number,
  daySports: Sport[],
): Sport[][] {
  const next = week.map((d, i) => (i === dayIdx ? cloneSportList(daySports) : d));
  storeWeekSports(next);
  return next;
}
