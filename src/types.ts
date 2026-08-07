export interface Ingredient {
  n: string;
  g: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface Meal {
  slot: string;
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  emoji: string;
  time: string;
  diff: string;
  swatch: string;
  /** Photo URL from Spoonacular/Edamam; falls back to swatch when absent */
  image?: string | null;
  ingredients: Ingredient[];
  steps: string[];
  external_recipe_id?: string | null;
  recipe_source?: string | null;
  /** Server-persisted slot state for skip / replaced / eaten. */
  status?: 'planned' | 'eaten' | 'skipped' | 'replaced';
}

export interface Sport {
  id: string;
  name: string;
  emoji: string;
  min: number;
  kcal: number;
  on: boolean;
  customMin?: number;
  activityType?: string;
  /** User-created activity (can be removed). */
  custom?: boolean;
}

export interface WeekDay {
  d: string;
  n: number;
  tag: string;
  kcal: number;
  color: string;
}

export type HealthProviderStatus =
  | 'connected'
  | 'disconnected'
  | 'needs_native'
  | 'coming_soon'
  | 'error'
  | 'unconfigured';

export interface Provider {
  id: string;
  name: string;
  on: boolean;
  status?: HealthProviderStatus;
  message?: string;
  lastSyncAt?: string | null;
  configured?: boolean;
  meta?: Record<string, unknown>;
}

export interface HealthSummary {
  kcal: number;
  steps: number;
  minutes: number;
  lastSyncAt: string | null;
  hasConnected: boolean;
}

export interface SwapAlternative {
  n: string;
  g: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

import type { MealRepeatFrequency, MealRepeatPolicy, MealRepeatSlot } from './mealRepeat';

export type { MealRepeatFrequency, MealRepeatPolicy, MealRepeatSlot };

export interface User {
  name: string;
  email: string;
  age: number;
  sex?: 'male' | 'female';
  height: number;
  weight: number;
  targetWeight: number;
  goals: string[];
  dietType: string;
  allergies: string[];
  activityLevel: string;
  /** Weekly plan variety / batch-cooking pattern. */
  mealRepeatPolicy?: MealRepeatFrequency;
  /** Meal slots where the repeat pattern applies. */
  mealRepeatSlots?: MealRepeatSlot[];
  onboardingComplete?: boolean;
  isSuperadmin?: boolean;
}

export interface DayMacros {
  date: string;
  targets: {
    cals: number;
    p: number;
    c: number;
    f: number;
    sport_burn: number;
    adjustment_note: string;
  };
  consumed: { cals: number; p: number; c: number; f: number };
  kcal_left: number;
  deficit: number;
}

export interface SwapMealCtx {
  source: 'hoy' | 'semana';
  slotIdx: number;
  dayIdx: number;
}

export type Screen =
  | 'hoy'
  | 'semana'
  | 'receta'
  | 'sport'
  | 'swap'
  | 'swapMeal'
  | 'salud'
  | 'perfil'
  | 'historial'
  | 'compra'
  | 'misRecetas'
  | 'asistente'
  | 'sugerencias'
  | 'adminSugerencias';

export interface UserRecipe {
  id: number;
  name: string;
  preferred_slot: string;
  emoji: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  ingredients: Ingredient[];
  steps: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SuggestionItem {
  id: number;
  body: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  user_email?: string | null;
  user_name?: string | null;
}
export type AuthScreen = 'login' | 'register' | 'onboarding' | 'forgot' | 'reset';
