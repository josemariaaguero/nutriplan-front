import { createContext, useContext } from 'react';
import type { Screen, Sport, Provider, User, SwapMealCtx, Meal, DayMacros, HealthSummary } from './types';

export interface SportCtx {
  source: 'hoy' | 'semana';
  dayIdx: number;
}

export interface AppState {
  screen: Screen;
  selectedDay: number;
  openMeal: number;
  openSwapIng: number;
  sports: Sport[];
  weekSports: Sport[][];
  sportCtx: SportCtx;
  providers: Provider[];
  healthSummary: HealthSummary;
  healthBanner: string;
  user: User;
  currentMeals: Meal[];
  weekMeals: string[][];
  swapMealCtx: SwapMealCtx | null;
  dayMacros: DayMacros | null;
  /** When set, RecetaScreen shows this meal instead of currentMeals[openMeal] */
  viewingMeal: Meal | null;
  recipeBack: 'hoy' | 'semana' | 'historial';
  /** Date (YYYY-MM-DD) to focus when opening Historial */
  historyFocusDate: string | null;
  historyBack: 'hoy' | 'perfil';
  /** Per-user activity templates (from API). */
  activityCatalog: Sport[];
}

export interface ConnectProviderResult {
  authorizeUrl?: string | null;
  message?: string;
  status?: string | null;
}

export interface AppActions {
  go: (screen: Screen) => void;
  toggleSport: (id: string) => void;
  setSportDuration: (id: string, min: number) => void;
  setSportActivityType: (id: string, type: string) => void;
  addCustomSport: (input: {
    name: string;
    min: number;
    kcal: number;
    emoji?: string;
    activityType?: string;
  }) => void | Promise<void>;
  updateSportActivity: (id: string, input: {
    name: string;
    min: number;
    kcal: number;
    emoji?: string;
    activityType?: string;
  }) => void | Promise<void>;
  removeCustomSport: (id: string) => void | Promise<void>;
  connectProvider: (id: string) => Promise<ConnectProviderResult>;
  disconnectProvider: (id: string) => Promise<void>;
  syncHealthProviders: () => Promise<void>;
  refreshHealthConnections: () => Promise<void>;
  setSelectedDay: (i: number) => void;
  openRecipe: (mealIndex: number) => void;
  openWeekRecipe: (dayIdx: number, slotIdx: number) => void;
  openHistoryRecipe: (meal: Meal) => void;
  openSwap: (mealIndex: number, ingIndex: number) => void;
  openSwapMeal: (ctx: SwapMealCtx) => void;
  applyMealSwap: (newMeal: Meal, newMealName: string) => void;
  applyUserRecipeSwap: (recipeId: number) => Promise<string | null>;
  applyIngredientSwap: (alternative: import('./types').Ingredient) => void;
  goSport: () => void;
  goWeekSport: (dayIdx: number) => void;
  goSwapDefault: () => void;
  openHistory: (date?: string, back?: 'hoy' | 'perfil') => void;
  applyTodayPlan: (plan: { meals: Meal[]; sports: Sport[]; macros: DayMacros }) => void;
  updateUser: (u: User) => void | Promise<void>;
  logout: () => void;
  generateWeek: () => Promise<{ ok: true; source: string }>;
}

export const AppStateContext = createContext<AppState>(null!);
export const AppActionsContext = createContext<AppActions>(null!);

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppActions() {
  return useContext(AppActionsContext);
}
