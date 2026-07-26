import { MEALS, MEAL_ALTERNATIVES, WEEK_MEAL_SLOTS } from './data';
import { withMealImage } from './mealImages';
import type { Meal } from './types';

const SLOT_SWATCHES: Record<string, string> = {
  Desayuno: 'linear-gradient(135deg,#ffc24d,#ff6a3d)',
  Almuerzo: 'linear-gradient(135deg,#ffb84d,#ef6f24)',
  Snack: 'linear-gradient(135deg,#57d39a,#11a866)',
  Cena: 'linear-gradient(135deg,#ff9a4d,#ff6a3d)',
};

const SLOT_EMOJI: Record<string, string> = {
  Desayuno: '🥣',
  Almuerzo: '🍲',
  Snack: '🥜',
  Cena: '🍽️',
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function allCatalogMeals(): Meal[] {
  const alts = Object.values(MEAL_ALTERNATIVES).flat();
  return [...MEALS, ...alts];
}

/** Resolve a week-plan title to a full Meal (ingredients + steps) when possible. */
export function resolveMealByName(name: string, slotHint?: string): Meal {
  const catalog = allCatalogMeals();
  const n = norm(name);

  const exact = catalog.find(m => norm(m.name) === n);
  if (exact) {
    const meal = slotHint ? { ...exact, slot: slotHint } : { ...exact };
    return withMealImage(meal);
  }

  // Prefer same slot, then any: substring / token overlap
  const slot = slotHint && WEEK_MEAL_SLOTS.includes(slotHint) ? slotHint : undefined;
  const pool = slot
    ? [...(MEAL_ALTERNATIVES[slot] || []), ...catalog.filter(m => m.slot === slot), ...catalog]
    : catalog;

  let best: Meal | null = null;
  let bestScore = 0;
  const tokens = n.split(' ').filter(t => t.length > 2);

  for (const m of pool) {
    const mn = norm(m.name);
    if (mn.includes(n) || n.includes(mn)) {
      return withMealImage(slotHint ? { ...m, slot: slotHint, name } : { ...m, name });
    }
    const score = tokens.filter(t => mn.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }

  if (best && bestScore >= 2) {
    return withMealImage({
      ...best,
      name,
      slot: slotHint || best.slot,
    });
  }

  // Stub for API-generated titles without local recipe data
  const s = slotHint || 'Almuerzo';
  return withMealImage({
    slot: s,
    name,
    kcal: 0,
    p: 0,
    c: 0,
    f: 0,
    emoji: SLOT_EMOJI[s] || '🍽️',
    time: '—',
    diff: 'Media',
    swatch: SLOT_SWATCHES[s] || SLOT_SWATCHES.Almuerzo,
    ingredients: [],
    steps: [
      'Esta receta viene del plan generado. Prueba “Cambiar” para elegir una alternativa con ingredientes y pasos detallados.',
    ],
  });
}
