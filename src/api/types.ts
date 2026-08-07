import type { Ingredient, Meal } from '../types';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ProfileApi {
  email: string;
  name: string;
  age: number;
  sex: string;
  height: number;
  weight: number;
  target_weight: number;
  goals: string[];
  diet_type: string;
  allergies: string[];
  activity_level: string;
  meal_repeat_policy?: string;
  meal_repeat_slots?: string[];
  health_providers: Record<string, boolean>;
  onboarding_complete: boolean;
  is_superadmin?: boolean;
}

export interface SportApi {
  id: string;
  name: string;
  emoji: string;
  min: number;
  kcal: number;
  on: boolean;
  custom_min?: number | null;
  activity_type?: string | null;
  customMin?: number | null;
  activityType?: string | null;
}

export interface MacroTargetsApi {
  cals: number;
  p: number;
  c: number;
  f: number;
  bmr?: number | null;
  tdee?: number | null;
  sport_burn: number;
  adjustment_note: string;
}

export interface MacroConsumedApi {
  cals: number;
  p: number;
  c: number;
  f: number;
}

export interface MacrosTodayApi {
  date: string;
  targets: MacroTargetsApi;
  consumed: MacroConsumedApi;
  kcal_left: number;
  deficit: number;
}

export interface DayPlanApi {
  date: string;
  meals: Meal[];
  sports: SportApi[];
  macros: MacrosTodayApi;
  adjustment_warning?: string | null;
  fruits?: FruitLogApi[];
  extras?: ExtraLogApi[];
}

export interface FruitLogApi {
  id: string;
  kindId?: string;
  kind_id?: string;
  name: string;
  g: number;
  kcal?: number;
  p?: number;
  c?: number;
  f?: number;
  type?: 'fruit' | 'other';
  per100?: { kcal: number; p: number; c: number; f: number } | null;
  per_100g?: { kcal: number; p: number; c: number; f: number } | null;
}

export interface ExtraLogApi {
  id: string;
  type?: 'fruit' | 'other';
  name: string;
  g?: number;
  kcal?: number;
  p?: number;
  c?: number;
  f?: number;
  kindId?: string;
  kind_id?: string;
  per100?: { kcal: number; p: number; c: number; f: number } | null;
  per_100g?: { kcal: number; p: number; c: number; f: number } | null;
  slot?: string | null;
  mealIndex?: number | null;
  meal_index?: number | null;
}

export interface OnboardingPayload {
  name: string;
  age: number;
  sex: 'male' | 'female';
  height: number;
  weight: number;
  target_weight: number;
  goals: string[];
  diet_type: string;
  allergies: string[];
  activity_level: string;
  meal_repeat_policy?: string;
  meal_repeat_slots?: string[];
  health_providers?: Record<string, boolean>;
}

export type { Ingredient };
