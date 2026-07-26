/** Daily fruit log — piece defaults + per-100g macros (approx.). */

export type FruitMacros100 = {
  kcal: number;
  p: number;
  c: number;
  f: number;
};

/** Catalog entry: typical edible piece weight + macros per 100 g. */
export type FruitKind = {
  id: string;
  name: string;
  /** Approximate weight of one piece / serving (g). */
  defaultG: number;
  per100: FruitMacros100;
  /** Short hint under the name in the picker. */
  pieceLabel: string;
  /** Extra search keys (accents optional). */
  aliases?: string[];
};

export type LoggedFruit = {
  id: string;
  kindId: string;
  name: string;
  g: number;
  per100: FruitMacros100;
};

/** Expanded catalog — search is the primary way to find items. */
export const FRUIT_CATALOG: FruitKind[] = [
  { id: 'platano', name: 'Plátano', defaultG: 120, pieceLabel: '1 unidad media', aliases: ['banana', 'platano'], per100: { kcal: 90, p: 1.1, c: 23, f: 0.3 } },
  { id: 'manzana', name: 'Manzana', defaultG: 180, pieceLabel: '1 unidad media', aliases: ['apple'], per100: { kcal: 52, p: 0.3, c: 14, f: 0.2 } },
  { id: 'manzana-verde', name: 'Manzana verde', defaultG: 170, pieceLabel: '1 unidad', aliases: ['granny smith'], per100: { kcal: 52, p: 0.3, c: 14, f: 0.2 } },
  { id: 'naranja', name: 'Naranja', defaultG: 150, pieceLabel: '1 unidad media', aliases: ['orange'], per100: { kcal: 45, p: 0.9, c: 12, f: 0.1 } },
  { id: 'naranja-sanguina', name: 'Naranja sanguina', defaultG: 150, pieceLabel: '1 unidad', aliases: ['blood orange'], per100: { kcal: 45, p: 0.9, c: 12, f: 0.1 } },
  { id: 'pera', name: 'Pera', defaultG: 170, pieceLabel: '1 unidad media', aliases: ['pear'], per100: { kcal: 55, p: 0.4, c: 15, f: 0.1 } },
  { id: 'pera-conferencia', name: 'Pera conferencia', defaultG: 160, pieceLabel: '1 unidad', per100: { kcal: 55, p: 0.4, c: 15, f: 0.1 } },
  { id: 'kiwi', name: 'Kiwi', defaultG: 75, pieceLabel: '1 unidad', aliases: ['kiwis'], per100: { kcal: 60, p: 1.1, c: 14, f: 0.5 } },
  { id: 'kiwi-amarillo', name: 'Kiwi amarillo', defaultG: 80, pieceLabel: '1 unidad', aliases: ['kiwi gold'], per100: { kcal: 60, p: 1.1, c: 14, f: 0.5 } },
  { id: 'mandarina', name: 'Mandarina', defaultG: 80, pieceLabel: '1 unidad', aliases: ['tangerine', 'clementina'], per100: { kcal: 53, p: 0.8, c: 13, f: 0.3 } },
  { id: 'clementina', name: 'Clementina', defaultG: 75, pieceLabel: '1 unidad', aliases: ['mandarina'], per100: { kcal: 47, p: 0.9, c: 12, f: 0.2 } },
  { id: 'satsuma', name: 'Satsuma', defaultG: 90, pieceLabel: '1 unidad', per100: { kcal: 43, p: 0.8, c: 11, f: 0.2 } },
  { id: 'pomelo', name: 'Pomelo', defaultG: 200, pieceLabel: '½ unidad', aliases: ['toronja', 'grapefruit'], per100: { kcal: 42, p: 0.8, c: 11, f: 0.1 } },
  { id: 'limon', name: 'Limón', defaultG: 60, pieceLabel: '1 unidad', aliases: ['lemon'], per100: { kcal: 29, p: 1.1, c: 9, f: 0.3 } },
  { id: 'lima', name: 'Lima', defaultG: 55, pieceLabel: '1 unidad', aliases: ['lime'], per100: { kcal: 30, p: 0.7, c: 11, f: 0.2 } },
  { id: 'melocoton', name: 'Melocotón', defaultG: 150, pieceLabel: '1 unidad media', aliases: ['peach', 'durazno'], per100: { kcal: 39, p: 0.9, c: 10, f: 0.3 } },
  { id: 'nectarina', name: 'Nectarina', defaultG: 140, pieceLabel: '1 unidad', aliases: ['nectarine'], per100: { kcal: 44, p: 1.1, c: 11, f: 0.3 } },
  { id: 'albaricoque', name: 'Albaricoque', defaultG: 55, pieceLabel: '1 unidad', aliases: ['apricot', 'chabacano'], per100: { kcal: 48, p: 1.4, c: 11, f: 0.4 } },
  { id: 'ciruela', name: 'Ciruela', defaultG: 65, pieceLabel: '1 unidad', aliases: ['plum'], per100: { kcal: 46, p: 0.7, c: 11, f: 0.3 } },
  { id: 'ciruela-roja', name: 'Ciruela roja', defaultG: 70, pieceLabel: '1 unidad', per100: { kcal: 46, p: 0.7, c: 11, f: 0.3 } },
  { id: 'uva', name: 'Uva', defaultG: 150, pieceLabel: '1 racimo pequeño', aliases: ['uvas', 'grape'], per100: { kcal: 70, p: 0.7, c: 17, f: 0.2 } },
  { id: 'uva-blanca', name: 'Uva blanca', defaultG: 150, pieceLabel: '1 racimo pequeño', per100: { kcal: 69, p: 0.7, c: 17, f: 0.2 } },
  { id: 'uva-negra', name: 'Uva negra', defaultG: 150, pieceLabel: '1 racimo pequeño', per100: { kcal: 69, p: 0.7, c: 17, f: 0.2 } },
  { id: 'fresa', name: 'Fresas', defaultG: 150, pieceLabel: '1 ración (~10 ud.)', aliases: ['fresa', 'strawberry'], per100: { kcal: 32, p: 0.7, c: 8, f: 0.3 } },
  { id: 'frambuesa', name: 'Frambuesas', defaultG: 100, pieceLabel: '1 ración', aliases: ['frambuesa', 'raspberry'], per100: { kcal: 52, p: 1.2, c: 12, f: 0.7 } },
  { id: 'mora', name: 'Moras', defaultG: 100, pieceLabel: '1 ración', aliases: ['mora', 'blackberry'], per100: { kcal: 43, p: 1.4, c: 10, f: 0.5 } },
  { id: 'arandanos', name: 'Arándanos', defaultG: 100, pieceLabel: '1 ración', aliases: ['arandanos', 'blueberry'], per100: { kcal: 55, p: 0.7, c: 14, f: 0.3 } },
  { id: 'grosella', name: 'Grosellas', defaultG: 100, pieceLabel: '1 ración', aliases: ['grosella', 'currant'], per100: { kcal: 56, p: 1.4, c: 14, f: 0.2 } },
  { id: 'cereza', name: 'Cerezas', defaultG: 100, pieceLabel: '1 ración', aliases: ['cereza', 'cherry'], per100: { kcal: 63, p: 1.1, c: 16, f: 0.2 } },
  { id: 'guinda', name: 'Guindas', defaultG: 100, pieceLabel: '1 ración', aliases: ['guinda', 'sour cherry'], per100: { kcal: 50, p: 1, c: 12, f: 0.3 } },
  { id: 'mango', name: 'Mango', defaultG: 150, pieceLabel: '½ unidad', aliases: ['mango'], per100: { kcal: 60, p: 0.8, c: 15, f: 0.4 } },
  { id: 'pina', name: 'Piña', defaultG: 100, pieceLabel: '1 rodaja', aliases: ['pineapple', 'ananas'], per100: { kcal: 50, p: 0.5, c: 13, f: 0.1 } },
  { id: 'sandia', name: 'Sandía', defaultG: 200, pieceLabel: '1 trozo', aliases: ['watermelon'], per100: { kcal: 30, p: 0.6, c: 8, f: 0.2 } },
  { id: 'melon', name: 'Melón', defaultG: 150, pieceLabel: '1 trozo', aliases: ['cantaloupe', 'melon'], per100: { kcal: 34, p: 0.8, c: 8, f: 0.2 } },
  { id: 'melon-galia', name: 'Melón galia', defaultG: 150, pieceLabel: '1 trozo', per100: { kcal: 30, p: 0.7, c: 7, f: 0.1 } },
  { id: 'melon-piel-sapo', name: 'Melón piel de sapo', defaultG: 160, pieceLabel: '1 trozo', per100: { kcal: 28, p: 0.6, c: 7, f: 0.1 } },
  { id: 'papaya', name: 'Papaya', defaultG: 150, pieceLabel: '1 trozo', aliases: ['fruta bomba'], per100: { kcal: 43, p: 0.5, c: 11, f: 0.3 } },
  { id: 'aguacate', name: 'Aguacate', defaultG: 100, pieceLabel: '½ unidad', aliases: ['avocado', 'palta'], per100: { kcal: 160, p: 2, c: 8.5, f: 15 } },
  { id: 'higo', name: 'Higo', defaultG: 50, pieceLabel: '1 unidad', aliases: ['fig', 'higos'], per100: { kcal: 74, p: 0.8, c: 19, f: 0.3 } },
  { id: 'higo-chumbo', name: 'Higo chumbo', defaultG: 100, pieceLabel: '1 unidad', aliases: ['tuna', 'cactus fruit'], per100: { kcal: 41, p: 0.7, c: 10, f: 0.5 } },
  { id: 'granada', name: 'Granada', defaultG: 150, pieceLabel: '½ unidad', aliases: ['pomegranate'], per100: { kcal: 83, p: 1.7, c: 19, f: 1.2 } },
  { id: 'caqui', name: 'Caqui', defaultG: 170, pieceLabel: '1 unidad', aliases: ['persimmon', 'kaki'], per100: { kcal: 70, p: 0.6, c: 19, f: 0.2 } },
  { id: 'chirimoya', name: 'Chirimoya', defaultG: 150, pieceLabel: '½ unidad', aliases: ['custard apple'], per100: { kcal: 75, p: 1.6, c: 18, f: 0.7 } },
  { id: 'nispero', name: 'Níspero', defaultG: 50, pieceLabel: '1 unidad', aliases: ['loquat', 'nispero'], per100: { kcal: 47, p: 0.4, c: 12, f: 0.2 } },
  { id: 'membrillo', name: 'Membrillo', defaultG: 150, pieceLabel: '½ unidad', aliases: ['quince'], per100: { kcal: 57, p: 0.4, c: 15, f: 0.1 } },
  { id: 'coco', name: 'Coco', defaultG: 50, pieceLabel: '1 trozo', aliases: ['coconut'], per100: { kcal: 354, p: 3.3, c: 15, f: 33 } },
  { id: 'datil', name: 'Dátil', defaultG: 24, pieceLabel: '1 unidad', aliases: ['date', 'datiles'], per100: { kcal: 282, p: 2.5, c: 75, f: 0.4 } },
  { id: 'pasa', name: 'Pasas', defaultG: 40, pieceLabel: '1 puñado', aliases: ['raisins', 'uva pasa'], per100: { kcal: 299, p: 3.1, c: 79, f: 0.5 } },
  { id: 'orejon', name: 'Orejones', defaultG: 40, pieceLabel: '1 puñado', aliases: ['dried apricot', 'albaricoque seco'], per100: { kcal: 241, p: 3.4, c: 63, f: 0.5 } },
  { id: 'platano-macho', name: 'Plátano macho', defaultG: 140, pieceLabel: '1 unidad', aliases: ['plantain'], per100: { kcal: 122, p: 1.3, c: 32, f: 0.4 } },
  { id: 'guayaba', name: 'Guayaba', defaultG: 100, pieceLabel: '1 unidad', aliases: ['guava'], per100: { kcal: 68, p: 2.6, c: 14, f: 1 } },
  { id: 'maracuya', name: 'Maracuyá', defaultG: 50, pieceLabel: '1 unidad', aliases: ['passion fruit', 'parchita'], per100: { kcal: 97, p: 2.2, c: 23, f: 0.7 } },
  { id: 'lichi', name: 'Lichi', defaultG: 20, pieceLabel: '1 unidad', aliases: ['lychee', 'litchi'], per100: { kcal: 66, p: 0.8, c: 17, f: 0.4 } },
  { id: 'mangostan', name: 'Mangostán', defaultG: 70, pieceLabel: '1 unidad', aliases: ['mangosteen'], per100: { kcal: 73, p: 0.4, c: 18, f: 0.6 } },
  { id: 'carambola', name: 'Carambola', defaultG: 90, pieceLabel: '1 unidad', aliases: ['star fruit'], per100: { kcal: 31, p: 1, c: 7, f: 0.3 } },
  { id: 'pitaya', name: 'Pitaya', defaultG: 150, pieceLabel: '½ unidad', aliases: ['dragon fruit', 'pitahaya'], per100: { kcal: 60, p: 1.2, c: 13, f: 0.4 } },
  { id: 'rambutan', name: 'Rambután', defaultG: 35, pieceLabel: '1 unidad', aliases: ['rambutan'], per100: { kcal: 82, p: 0.9, c: 21, f: 0.2 } },
  { id: 'tamarindo', name: 'Tamarindo', defaultG: 30, pieceLabel: '1 porción', aliases: ['tamarind'], per100: { kcal: 239, p: 2.8, c: 63, f: 0.6 } },
  { id: 'acerola', name: 'Acerola', defaultG: 20, pieceLabel: '1 unidad', aliases: ['barbados cherry'], per100: { kcal: 32, p: 0.4, c: 8, f: 0.3 } },
  { id: 'physalis', name: 'Physalis', defaultG: 50, pieceLabel: '1 ración', aliases: ['uchuva', 'golden berry'], per100: { kcal: 53, p: 1.9, c: 11, f: 0.7 } },
  { id: 'endrina', name: 'Endrinas', defaultG: 50, pieceLabel: '1 ración', aliases: ['sloe'], per100: { kcal: 55, p: 0.8, c: 13, f: 0.4 } },
  { id: 'serba', name: 'Serbas', defaultG: 50, pieceLabel: '1 ración', aliases: ['serviceberry'], per100: { kcal: 85, p: 0.7, c: 20, f: 0.5 } },
  { id: 'azufaifa', name: 'Azufaifa', defaultG: 20, pieceLabel: '1 unidad', aliases: ['jujube'], per100: { kcal: 79, p: 1.2, c: 20, f: 0.2 } },
  { id: 'chirimoya-custard', name: 'Anona', defaultG: 150, pieceLabel: '½ unidad', aliases: ['sugar apple'], per100: { kcal: 94, p: 2.1, c: 24, f: 0.3 } },
  { id: 'breva', name: 'Breva', defaultG: 55, pieceLabel: '1 unidad', aliases: ['early fig'], per100: { kcal: 74, p: 0.8, c: 19, f: 0.3 } },
  { id: 'uva-moscatel', name: 'Uva moscatel', defaultG: 150, pieceLabel: '1 racimo pequeño', per100: { kcal: 72, p: 0.7, c: 18, f: 0.2 } },
  { id: 'manzana-fuji', name: 'Manzana fuji', defaultG: 180, pieceLabel: '1 unidad', per100: { kcal: 60, p: 0.3, c: 15, f: 0.2 } },
  { id: 'manzana-gala', name: 'Manzana gala', defaultG: 170, pieceLabel: '1 unidad', per100: { kcal: 57, p: 0.3, c: 14, f: 0.2 } },
  { id: 'platano-canario', name: 'Plátano de Canarias', defaultG: 110, pieceLabel: '1 unidad', aliases: ['banana canarias'], per100: { kcal: 89, p: 1.1, c: 23, f: 0.3 } },
];

/** Quick picks shown when the search field is empty. */
export const FRUIT_QUICK_PICKS = [
  'platano',
  'manzana',
  'naranja',
  'pera',
  'fresa',
  'kiwi',
] as const;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function scaleFruitMacros(per100: FruitMacros100, grams: number) {
  const g = Math.max(0, Number(grams) || 0);
  const f = g / 100;
  return {
    kcal: Math.round(per100.kcal * f),
    p: round1(per100.p * f),
    c: round1(per100.c * f),
    f: round1(per100.f * f),
  };
}

export function sumFruitMacros(fruits: LoggedFruit[]) {
  return fruits.reduce(
    (acc, fruit) => {
      const m = scaleFruitMacros(fruit.per100, fruit.g);
      return {
        cals: acc.cals + m.kcal,
        p: acc.p + m.p,
        c: acc.c + m.c,
        f: acc.f + m.f,
      };
    },
    { cals: 0, p: 0, c: 0, f: 0 },
  );
}

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const STORAGE_KEY = 'nutriplan_daily_fruits';

type StoredDay = { date: string; fruits: LoggedFruit[] };

function readStore(): StoredDay | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDay;
  } catch {
    return null;
  }
}

export function loadTodayFruits(now = new Date()): LoggedFruit[] {
  const stored = readStore();
  if (!stored || stored.date !== todayKey(now)) return [];
  return Array.isArray(stored.fruits) ? stored.fruits : [];
}

export function storeTodayFruits(fruits: LoggedFruit[], now = new Date()): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(now), fruits }),
    );
  } catch {
    // ignore quota
  }
}

export function createLoggedFruit(kind: FruitKind): LoggedFruit {
  return {
    id: `${kind.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kindId: kind.id,
    name: kind.name,
    g: kind.defaultG,
    per100: { ...kind.per100 },
  };
}

export function createLoggedFruitFromLookup(
  name: string,
  per100: FruitMacros100,
  defaultG = 150,
): LoggedFruit {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'fruta';
  return {
    id: `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kindId: `lookup:${slug}`,
    name,
    g: defaultG,
    per100: { ...per100 },
  };
}

export function fruitKindById(id: string): FruitKind | undefined {
  return FRUIT_CATALOG.find(f => f.id === id);
}

export function normalizeFruitQuery(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Accent-insensitive search over name + aliases. Empty query → []. */
export function searchFruitCatalog(query: string, limit = 12): FruitKind[] {
  const q = normalizeFruitQuery(query);
  if (q.length < 1) return [];

  const scored: { kind: FruitKind; score: number }[] = [];
  for (const kind of FRUIT_CATALOG) {
    const keys = [
      normalizeFruitQuery(kind.name),
      ...(kind.aliases || []).map(normalizeFruitQuery),
    ];
    let score = 0;
    for (const key of keys) {
      if (key === q) score = Math.max(score, 100);
      else if (key.startsWith(q)) score = Math.max(score, 80 - Math.min(key.length, 40));
      else if (key.includes(q)) score = Math.max(score, 50 - Math.min(key.length, 40));
    }
    if (score > 0) scored.push({ kind, score });
  }
  scored.sort((a, b) => b.score - a.score || a.kind.name.localeCompare(b.kind.name, 'es'));
  return scored.slice(0, limit).map(s => s.kind);
}

export function fruitQuickPicks(): FruitKind[] {
  return FRUIT_QUICK_PICKS
    .map(id => FRUIT_CATALOG.find(f => f.id === id))
    .filter((f): f is FruitKind => Boolean(f));
}
