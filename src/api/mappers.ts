import type { Ingredient, Meal, Sport, User } from '../types';
import type { DayPlanApi, FruitLogApi, ProfileApi, SportApi, TokenResponse } from './types';
import { withMealImage } from '../mealImages';
import { scaleFruitMacros, storeTodayFruits, type LoggedFruit } from '../fruits';

export function profileToUser(p: ProfileApi): User {
  return {
    name: p.name,
    email: p.email,
    age: p.age,
    sex: (p.sex as User['sex']) || 'female',
    height: p.height,
    weight: p.weight,
    targetWeight: p.target_weight,
    goals: p.goals || [],
    dietType: p.diet_type,
    allergies: p.allergies || [],
    activityLevel: p.activity_level,
    onboardingComplete: p.onboarding_complete,
    isSuperadmin: Boolean(p.is_superadmin),
  };
}

export function userToProfileUpdate(u: User) {
  return {
    name: u.name,
    age: u.age || undefined,
    sex: u.sex || undefined,
    height: u.height || undefined,
    weight: u.weight || undefined,
    target_weight: u.targetWeight || undefined,
    goals: u.goals,
    diet_type: u.dietType,
    allergies: u.allergies,
    activity_level: u.activityLevel,
  };
}

export function sportFromApi(s: SportApi): Sport {
  return {
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    min: s.min,
    kcal: s.kcal,
    on: s.on,
    customMin: s.custom_min ?? s.customMin ?? undefined,
    activityType: s.activity_type ?? s.activityType ?? undefined,
    custom: s.id.startsWith('custom:'),
  };
}

export function sportToApi(s: Sport): SportApi {
  return {
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    min: s.min,
    kcal: s.kcal,
    on: s.on,
    custom_min: s.customMin ?? null,
    activity_type: s.activityType ?? null,
  };
}

export function mealFromApi(m: Meal): Meal {
  return withMealImage({
    slot: m.slot,
    name: m.name,
    kcal: m.kcal,
    p: m.p,
    c: m.c,
    f: m.f,
    emoji: m.emoji || '🍽️',
    time: m.time || '',
    diff: m.diff || '',
    swatch: m.swatch || 'linear-gradient(135deg,#ffb84d,#ef6f24)',
    image: m.image || null,
    ingredients: (m.ingredients || []) as Ingredient[],
    steps: m.steps || [],
    external_recipe_id: m.external_recipe_id ?? null,
    recipe_source: m.recipe_source ?? null,
  });
}

export function fruitFromApi(f: FruitLogApi): LoggedFruit {
  const per = f.per100 || f.per_100g || {
    kcal: f.g ? ((f.kcal || 0) * 100) / f.g : 0,
    p: f.g ? ((f.p || 0) * 100) / f.g : 0,
    c: f.g ? ((f.c || 0) * 100) / f.g : 0,
    f: f.g ? ((f.f || 0) * 100) / f.g : 0,
  };
  return {
    id: f.id,
    kindId: f.kindId || f.kind_id || '',
    name: f.name,
    g: Number(f.g) || 0,
    per100: {
      kcal: Number(per.kcal) || 0,
      p: Number(per.p) || 0,
      c: Number(per.c) || 0,
      f: Number(per.f) || 0,
    },
  };
}

export function fruitToApi(f: LoggedFruit): FruitLogApi {
  const scaled = scaleFruitMacros(f.per100, f.g);
  return {
    id: f.id,
    kindId: f.kindId,
    name: f.name,
    g: f.g,
    kcal: scaled.kcal,
    p: scaled.p,
    c: scaled.c,
    f: scaled.f,
    per100: f.per100,
  };
}

export function applyDayPlan(day: DayPlanApi): {
  meals: Meal[];
  sports: Sport[];
  macros: DayPlanApi['macros'];
} {
  if (Array.isArray(day.fruits)) {
    storeTodayFruits(day.fruits.map(fruitFromApi));
  }
  return {
    meals: day.meals.map(mealFromApi),
    sports: day.sports.map(sportFromApi),
    macros: day.macros,
  };
}

export type { TokenResponse, ProfileApi, DayPlanApi };
