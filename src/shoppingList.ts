import { WEEK_MEAL_SLOTS } from './data';
import { resolveMealByName } from './mealLookup';
import type { Ingredient, Meal } from './types';
import { loadWeekMealOverride } from './weekPlan';

const CHECKED_KEY = 'nutriplan_shopping_checked';
const REMOVED_KEY = 'nutriplan_shopping_removed';

export interface ShoppingUsage {
  recipe: string;
  dayLabel: string;
  slot: string;
  grams: number;
}

export interface ShoppingItem {
  key: string;
  name: string;
  grams: number;
  kcal: number;
  /** @deprecated prefer usages */
  sources: string[];
  usages: ShoppingUsage[];
}

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function itemKey(name: string): string {
  return normName(name);
}

/** Resolve full meals for the week grid (overrides → catalog). */
export function resolveWeekMeals(weekMeals: string[][]): Meal[][] {
  return weekMeals.map((day, dayIdx) =>
    day.map((title, slotIdx) => {
      const slot = WEEK_MEAL_SLOTS[slotIdx] || 'Almuerzo';
      const overridden = loadWeekMealOverride(dayIdx, slotIdx);
      return overridden ?? resolveMealByName(title, slot);
    }),
  );
}

/** Aggregate ingredients across the week into a shopping list. */
export function buildShoppingList(weekMeals: string[][]): ShoppingItem[] {
  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const map = new Map<string, ShoppingItem>();

  const resolved = resolveWeekMeals(weekMeals);
  resolved.forEach((day, dayIdx) => {
    day.forEach((meal, slotIdx) => {
      const slot = WEEK_MEAL_SLOTS[slotIdx] || '';
      const recipe = meal.name || 'Receta';
      const source = `${dayLabels[dayIdx]} · ${slot}`;
      (meal.ingredients || []).forEach((ing: Ingredient) => {
        if (!ing?.n) return;
        const key = itemKey(ing.n);
        const grams = Number(ing.g) || 0;
        const usage: ShoppingUsage = {
          recipe,
          dayLabel: dayLabels[dayIdx],
          slot,
          grams,
        };
        const prev = map.get(key);
        if (prev) {
          prev.grams += grams;
          prev.kcal += Number(ing.kcal) || 0;
          prev.usages.push(usage);
          if (!prev.sources.includes(source)) prev.sources.push(source);
        } else {
          map.set(key, {
            key,
            name: ing.n,
            grams,
            kcal: Number(ing.kcal) || 0,
            sources: [source],
            usages: [usage],
          });
        }
      });
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function loadShoppingChecked(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function storeShoppingChecked(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function clearShoppingChecked(): void {
  try {
    localStorage.removeItem(CHECKED_KEY);
  } catch {
    // ignore
  }
}

export function loadShoppingRemoved(): string[] {
  try {
    const raw = localStorage.getItem(REMOVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function storeShoppingRemoved(keys: string[]): void {
  try {
    localStorage.setItem(REMOVED_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

export function clearShoppingRemoved(): void {
  try {
    localStorage.removeItem(REMOVED_KEY);
  } catch {
    // ignore
  }
}

export function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg`;
  return `${Math.round(g)} g`;
}
