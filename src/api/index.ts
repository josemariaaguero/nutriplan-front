import { apiRequest } from './client';
import { ApiError } from './client';
import { applyDayPlan, fruitToApi, profileToUser, sportToApi, userToProfileUpdate } from './mappers';
import { clearTokens, setTokens } from './tokens';
import type { DayPlanApi, OnboardingPayload, ProfileApi, TokenResponse } from './types';
import type { Ingredient, Meal, Sport, User } from '../types';
import type { LoggedFruit } from '../fruits';
import { isSupabaseConfigured, supabase } from '../supabase';

function requireSupabase(): void {
  if (!isSupabaseConfigured()) {
    throw new ApiError(
      503,
      'Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env',
    );
  }
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('user already registered')) return 'Ese email ya está registrado.';
  if (m.includes('email not confirmed')) return 'Confirma tu email antes de iniciar sesión.';
  if (m.includes('password')) return message;
  return message || 'Error de autenticación.';
}

export async function register(email: string, password: string, name: string): Promise<TokenResponse> {
  requireSupabase();
  const emailRedirectTo = `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo,
    },
  });
  if (error) throw new ApiError(400, mapAuthError(error.message));
  if (!data.session) {
    throw new ApiError(
      400,
      'Cuenta creada, pero falta confirmar el email. En el dashboard de Supabase desactiva “Confirm email” (Authentication → Providers → Email) mientras uses el SMTP gratis, o configura SMTP propio.',
    );
  }
  setTokens(data.session.access_token, data.session.refresh_token);
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    token_type: 'bearer',
  };
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new ApiError(401, mapAuthError(error.message));
  if (!data.session) throw new ApiError(401, 'No se pudo iniciar sesión.');
  setTokens(data.session.access_token, data.session.refresh_token);
  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    token_type: 'bearer',
  };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  requireSupabase();
  const redirectTo = `${window.location.origin}/`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new ApiError(400, mapAuthError(error.message));
  return {
    message: 'Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña.',
  };
}

export async function resetPassword(password: string): Promise<{ message: string }> {
  requireSupabase();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new ApiError(400, mapAuthError(error.message));
  return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

export async function logoutLocal(): Promise<void> {
  clearTokens();
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

/** Sync local token cache from Supabase session (boot / recovery). */
export async function syncSessionFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    setTokens(data.session.access_token, data.session.refresh_token);
    return true;
  }
  clearTokens();
  return false;
}

export function fetchMe(): Promise<User> {
  return apiRequest<ProfileApi>('/api/v1/auth/me').then(profileToUser);
}

export async function completeOnboarding(payload: OnboardingPayload): Promise<User> {
  const profile = await apiRequest<ProfileApi>('/api/v1/profile/onboarding', {
    method: 'POST',
    body: payload,
  });
  return profileToUser(profile);
}

export async function updateProfile(user: User): Promise<User> {
  const profile = await apiRequest<ProfileApi>('/api/v1/profile', {
    method: 'PUT',
    body: userToProfileUpdate(user),
  });
  return profileToUser(profile);
}

export async function fetchToday(): Promise<ReturnType<typeof applyDayPlan>> {
  const day = await apiRequest<DayPlanApi>('/api/v1/today');
  return applyDayPlan(day);
}

export async function updateTodayFruits(
  fruits: LoggedFruit[],
): Promise<ReturnType<typeof applyDayPlan>> {
  const day = await apiRequest<DayPlanApi>('/api/v1/today/fruits', {
    method: 'PUT',
    body: { fruits: fruits.map(fruitToApi) },
  });
  return applyDayPlan(day);
}

export async function updateTodaySports(
  sports: Sport[],
  lockedMealIndices: number[] = [],
): Promise<ReturnType<typeof applyDayPlan>> {
  const day = await apiRequest<DayPlanApi>('/api/v1/today/sports', {
    method: 'PUT',
    body: {
      sports: sports.map(sportToApi),
      locked_meal_indices: lockedMealIndices,
    },
  });
  return applyDayPlan(day);
}

export async function swapTodayMeal(mealIndex: number, newMeal: Meal): Promise<ReturnType<typeof applyDayPlan>> {
  const day = await apiRequest<DayPlanApi>('/api/v1/today/meals/swap', {
    method: 'PATCH',
    body: { meal_index: mealIndex, new_meal: newMeal },
  });
  return applyDayPlan(day);
}

export async function swapTodayIngredient(
  mealIndex: number,
  ingredientIndex: number,
  alternative: Ingredient,
): Promise<ReturnType<typeof applyDayPlan>> {
  const day = await apiRequest<DayPlanApi>('/api/v1/today/meals/swap-ingredient', {
    method: 'PATCH',
    body: {
      meal_index: mealIndex,
      ingredient_index: ingredientIndex,
      alternative,
    },
  });
  return applyDayPlan(day);
}

export async function fetchIngredientSwaps(mealIndex: number, ingredientIndex: number) {
  return apiRequest<{ original: Ingredient; alternatives: Ingredient[] }>(
    `/api/v1/today/meals/${mealIndex}/ingredient-swaps?ingredient_index=${ingredientIndex}`,
  );
}

/** Ingredient substitutes by name — works for today and weekly recipe detail. */
export async function fetchIngredientSubstitutes(ing: Ingredient) {
  const params = new URLSearchParams({
    name: ing.n,
    grams: String(ing.g),
    kcal: String(ing.kcal),
    p: String(ing.p),
    c: String(ing.c),
    f: String(ing.f),
  });
  const res = await apiRequest<{
    original: Ingredient;
    substitutes: { name: string; grams: number; kcal: number; p: number; c: number; f: number; source?: string }[];
  }>(`/api/v1/recipes/ingredients/substitutes?${params}`);

  return {
    original: res.original,
    alternatives: (res.substitutes || []).map(s => ({
      n: s.name,
      g: s.grams,
      kcal: s.kcal,
      p: s.p,
      c: s.c,
      f: s.f,
    })) as Ingredient[],
  };
}

export type IngredientNutritionApi = {
  name: string;
  g: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  source: string;
  per_100g?: { kcal: number; p: number; c: number; f: number } | null;
};

/** Name → macros (local catalog, then Edamam/USDA). Prefer per_100g for forms. */
export async function lookupIngredientNutrition(query: string, grams = 100) {
  const params = new URLSearchParams({
    query: query.trim(),
    grams: String(grams),
  });
  return apiRequest<IngredientNutritionApi>(
    `/api/v1/recipes/ingredients/nutrition?${params}`,
  );
}

export interface MealPlanDayApi {
  meals: { id: string; source: string; title: string; image?: string | null }[];
}

export interface MealPlanGenerateApi {
  source: string;
  days: MealPlanDayApi[];
}

export async function generateMealPlan(targetCalories = 2000): Promise<MealPlanGenerateApi> {
  return apiRequest<MealPlanGenerateApi>('/api/v1/recipes/meal-plan/generate', {
    method: 'POST',
    body: {
      target_calories: Math.max(1200, Math.min(5000, Math.round(targetCalories))),
      time_frame: 'week',
    },
  });
}

export async function searchRecipes(query: string, number = 6) {
  const q = encodeURIComponent(query);
  return apiRequest<{
    results: { id: string; source: string; title: string; image?: string | null }[];
    total: number;
  }>(`/api/v1/recipes/search?query=${q}&number=${number}`);
}

export interface HealthConnectionApi {
  provider: string;
  name: string;
  status: string;
  connected: boolean;
  message: string;
  last_sync_at: string | null;
  configured: boolean;
  meta: Record<string, unknown>;
}

export interface HealthConnectionsApi {
  connections: HealthConnectionApi[];
  summary: {
    kcal?: number;
    steps?: number;
    minutes?: number;
    last_sync_at?: string | null;
    has_connected?: boolean;
  };
}

export interface HealthSyncApi {
  date: string;
  kcal: number;
  steps: number;
  minutes: number;
  sport_burn: number;
  last_sync_at: string | null;
  providers: Record<string, unknown>;
  sports: Record<string, unknown>[];
}

export async function fetchHealthConnections(): Promise<HealthConnectionsApi> {
  return apiRequest<HealthConnectionsApi>('/api/v1/health/connections');
}

export async function connectHealthProvider(provider: string): Promise<{
  provider: string;
  authorize_url: string | null;
  status: string | null;
  message: string;
}> {
  return apiRequest(`/api/v1/health/connect/${provider}`, { method: 'POST' });
}

export async function disconnectHealthProvider(provider: string): Promise<void> {
  await apiRequest(`/api/v1/health/connections/${provider}`, { method: 'DELETE' });
}

export async function syncHealth(lockedMealIndices: number[] = []): Promise<HealthSyncApi> {
  return apiRequest<HealthSyncApi>('/api/v1/health/sync', {
    method: 'POST',
    body: { locked_meal_indices: lockedMealIndices },
  });
}

export interface DailyLogApi {
  date: string;
  targets: {
    cals: number;
    p: number;
    c: number;
    f: number;
    sport_burn: number;
    adjustment_note?: string;
  };
  consumed: { cals: number; p: number; c: number; f: number };
  sports_burn_kcal: number;
  meals_snapshot: Meal[];
  sports_snapshot: { id: string; name: string; emoji: string; min: number; kcal: number; on: boolean }[];
  notes: string | null;
  archived_at: string;
}

export interface HistoryListApi {
  items: DailyLogApi[];
  total: number;
}

export interface HistoryCalendarApi {
  year: number;
  month: number;
  dates: string[];
}

export async function fetchHistory(limit = 30, offset = 0): Promise<HistoryListApi> {
  return apiRequest<HistoryListApi>(
    `/api/v1/history?limit=${limit}&offset=${offset}`,
  );
}

export async function fetchHistoryCalendar(year: number, month: number): Promise<HistoryCalendarApi> {
  return apiRequest<HistoryCalendarApi>(`/api/v1/history/calendar?year=${year}&month=${month}`);
}

export async function fetchHistoryDay(date: string): Promise<DailyLogApi> {
  return apiRequest<DailyLogApi>(`/api/v1/history/${date}`);
}

export async function archiveDay(date: string, notes?: string): Promise<DailyLogApi> {
  const q = notes ? `?notes=${encodeURIComponent(notes)}` : '';
  return apiRequest<DailyLogApi>(`/api/v1/history/${date}/archive${q}`, {
    method: 'POST',
  });
}

export async function submitMealRating(
  mealName: string,
  rating: -1 | 0 | 1,
  slot?: string,
): Promise<{ meal_name: string; rating: number }> {
  return apiRequest(`/api/v1/meal-ratings`, {
    method: 'POST',
    body: { meal_name: mealName, rating, slot: slot ?? null },
  });
}

export interface SportActivityApi {
  id: string;
  name: string;
  emoji: string;
  min: number;
  kcal: number;
  activity_type?: string | null;
  is_custom: boolean;
  sort_order: number;
}

export async function fetchSportActivities(): Promise<SportActivityApi[]> {
  const res = await apiRequest<{ activities: SportActivityApi[] }>('/api/v1/sports/activities');
  return res.activities || [];
}

export async function createSportActivity(input: {
  name: string;
  min: number;
  kcal: number;
  emoji?: string;
  activity_type?: string | null;
}): Promise<SportActivityApi> {
  return apiRequest<SportActivityApi>('/api/v1/sports/activities', {
    method: 'POST',
    body: input,
  });
}

export async function updateSportActivityApi(
  activityId: string,
  patch: {
    name?: string;
    min?: number;
    kcal?: number;
    emoji?: string;
    activity_type?: string | null;
  },
): Promise<SportActivityApi> {
  return apiRequest<SportActivityApi>(`/api/v1/sports/activities/${encodeURIComponent(activityId)}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function deleteSportActivityApi(activityId: string): Promise<void> {
  await apiRequest(`/api/v1/sports/activities/${encodeURIComponent(activityId)}`, {
    method: 'DELETE',
  });
}

// ── User recipes ─────────────────────────────────────────────────────────────

export interface UserRecipeApi {
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
  created_at: string;
  updated_at: string;
}

export async function fetchMyRecipes(): Promise<UserRecipeApi[]> {
  const res = await apiRequest<{ recipes: UserRecipeApi[] }>('/api/v1/recipes/mine');
  return res.recipes || [];
}

export async function createMyRecipe(body: {
  name: string;
  preferred_slot?: string;
  emoji?: string;
  ingredients?: Ingredient[];
  steps?: string[];
  kcal?: number;
  p?: number;
  c?: number;
  f?: number;
}): Promise<UserRecipeApi> {
  return apiRequest<UserRecipeApi>('/api/v1/recipes/mine', { method: 'POST', body });
}

export async function updateMyRecipe(
  id: number,
  patch: Partial<{
    name: string;
    preferred_slot: string;
    emoji: string;
    ingredients: Ingredient[];
    steps: string[];
    kcal: number;
    p: number;
    c: number;
    f: number;
  }>,
): Promise<UserRecipeApi> {
  return apiRequest<UserRecipeApi>(`/api/v1/recipes/mine/${id}`, { method: 'PATCH', body: patch });
}

export async function deleteMyRecipe(id: number): Promise<void> {
  await apiRequest(`/api/v1/recipes/mine/${id}`, { method: 'DELETE' });
}

export async function insertTodayFromRecipe(
  recipeId: number,
  mealIndex: number,
  lockedMealIndices: number[] = [],
): Promise<ReturnType<typeof applyDayPlan> & { adjustmentWarning?: string | null }> {
  const day = await apiRequest<DayPlanApi>('/api/v1/today/meals/from-recipe', {
    method: 'POST',
    body: {
      recipe_id: recipeId,
      meal_index: mealIndex,
      locked_meal_indices: lockedMealIndices,
    },
  });
  return { ...applyDayPlan(day), adjustmentWarning: day.adjustment_warning ?? null };
}

// ── Suggestions ──────────────────────────────────────────────────────────────

export interface SuggestionApi {
  id: number;
  body: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  user_email?: string | null;
  user_name?: string | null;
}

export async function fetchMySuggestions(): Promise<SuggestionApi[]> {
  const res = await apiRequest<{ items: SuggestionApi[] }>('/api/v1/suggestions');
  return res.items || [];
}

export async function createSuggestion(body: string): Promise<SuggestionApi> {
  return apiRequest<SuggestionApi>('/api/v1/suggestions', {
    method: 'POST',
    body: { body },
  });
}

export async function fetchAdminSuggestions(status?: string): Promise<SuggestionApi[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await apiRequest<{ items: SuggestionApi[] }>(`/api/v1/admin/suggestions${q}`);
  return res.items || [];
}

export async function replySuggestion(id: number, reply: string): Promise<SuggestionApi> {
  return apiRequest<SuggestionApi>(`/api/v1/admin/suggestions/${id}/reply`, {
    method: 'POST',
    body: { reply },
  });
}

// ── Assistant ────────────────────────────────────────────────────────────────

export async function assistantChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const res = await apiRequest<{ reply: string }>('/api/v1/assistant/chat', {
    method: 'POST',
    body: { messages },
  });
  return res.reply;
}
