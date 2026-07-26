/** Meal photos: recipe API first, curated Unsplash keywords as fallback. */

import { apiRequest } from './api/client';

const SLOT_FALLBACK: Record<string, string> = {
  Desayuno:
    'https://images.unsplash.com/photo-1495214783159-240b7ebdcd02?w=900&q=80&auto=format&fit=crop',
  Almuerzo:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80&auto=format&fit=crop',
  Snack:
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900&q=80&auto=format&fit=crop',
  Cena:
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80&auto=format&fit=crop',
};

/**
 * keyword (normalized) → image URL — first match wins.
 * More specific dishes (pasta, etc.) must come before generic grains (espelta).
 */
const RULES: [string[], string][] = [
  [['pasta', 'fideo', 'edamame'],
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=900&q=80&auto=format&fit=crop'],
  [['porridge', 'avena', 'granola', 'oatmeal'],
    'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=900&q=80&auto=format&fit=crop'],
  [['espelta'],
    'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=900&q=80&auto=format&fit=crop'],
  [['tostada', 'aguacate', 'avocado', 'centeno'],
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&q=80&auto=format&fit=crop'],
  [['gofre', 'waffle', 'pancake', 'pancake'],
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=80&auto=format&fit=crop'],
  [['huevo', 'revuelto', 'egg'],
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&q=80&auto=format&fit=crop'],
  [['yogur', 'yogurt', 'smoothie', 'frutos rojos', 'bowl de yogur'],
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=900&q=80&auto=format&fit=crop'],
  [['quark', 'pancakes de quark'],
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=80&auto=format&fit=crop'],
  [['lenteja'],
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=80&auto=format&fit=crop'],
  [['garbanzo', 'curry', 'chili'],
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&q=80&auto=format&fit=crop'],
  [['quinoa', 'buddha', 'bowl'],
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80&auto=format&fit=crop'],
  [['ensalada'],
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=80&auto=format&fit=crop'],
  [['arroz'],
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80&auto=format&fit=crop'],
  [['hummus', 'crudit'],
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=900&q=80&auto=format&fit=crop'],
  [['batido', 'smoothie'],
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=900&q=80&auto=format&fit=crop'],
  [['manzana', 'almendra', 'frutos secos', 'nuez'],
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=900&q=80&auto=format&fit=crop'],
  [['ricotta', 'tostada de ricotta'],
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80&auto=format&fit=crop'],
  [['tofu', 'boniato', 'teriyaki'],
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=80&auto=format&fit=crop'],
  [['calabaza', 'crema'],
    'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=900&q=80&auto=format&fit=crop'],
  [['tortilla', 'quiche', 'verdura'],
    'https://images.unsplash.com/photo-1608039828541-c7a4c6c0f0f6?w=900&q=80&auto=format&fit=crop'],
  [['sopa'],
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=80&auto=format&fit=crop'],
  [['salmon', 'salmon', 'brocoli', 'brocoli'],
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80&auto=format&fit=crop'],
];

const API_CACHE_KEY = 'nutriplan_recipe_image_cache';
const memoryCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadDiskCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(API_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveDiskCache(key: string, url: string): void {
  try {
    const map = loadDiskCache();
    map[key] = url;
    // Cap size
    const keys = Object.keys(map);
    if (keys.length > 80) {
      for (const k of keys.slice(0, keys.length - 80)) delete map[k];
    }
    localStorage.setItem(API_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** Unsplash / slot fallback when the recipe API has no photo. */
export function resolveUnsplashMealImage(name: string, slot?: string): string {
  const n = norm(name);
  for (const [keys, url] of RULES) {
    if (keys.some(k => n.includes(norm(k)))) return url;
  }
  return SLOT_FALLBACK[slot || 'Almuerzo'] || SLOT_FALLBACK.Almuerzo;
}

/**
 * Resolve a display photo: prefer existing (API) URL, else Unsplash keywords.
 * Does not call the network — use fetchRecipeMealImage for API enrichment.
 */
export function resolveMealImage(
  name: string,
  slot?: string,
  existing?: string | null,
): string {
  if (existing) return existing;
  return resolveUnsplashMealImage(name, slot);
}

/** Search Spoonacular/Edamam via backend; cached in memory + localStorage. */
export async function fetchRecipeMealImage(name: string): Promise<string | null> {
  const key = norm(name);
  if (!key) return null;

  if (memoryCache.has(key)) return memoryCache.get(key) ?? null;

  const disk = loadDiskCache();
  if (disk[key]) {
    memoryCache.set(key, disk[key]);
    return disk[key];
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const q = encodeURIComponent(name);
      const res = await apiRequest<{
        results: { id: string; source: string; title: string; image?: string | null }[];
      }>(`/api/v1/recipes/search?query=${q}&number=3`);
      const withImg = res.results.find(r => r.image);
      const url = withImg?.image || null;
      memoryCache.set(key, url);
      if (url) saveDiskCache(key, url);
      return url;
    } catch {
      memoryCache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Attach Unsplash fallback image if meal has none (API fill happens in UI). */
export function withMealImage<T extends { name: string; slot: string; image?: string | null }>(
  meal: T,
): T {
  if (meal.image) return meal;
  return { ...meal, image: resolveUnsplashMealImage(meal.name, meal.slot) };
}
