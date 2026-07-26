import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import './App.css';
import type { Screen, Sport, Provider, User, SwapMealCtx, Meal, DayMacros, Ingredient, HealthSummary } from './types';
import type { AuthScreen } from './types';
import { INITIAL_SPORTS, INITIAL_PROVIDERS, MEALS, WEEK_MEALS, WEEK_MEAL_SLOTS } from './data';
import { mapHealthConnections } from './healthProviders';
import { getHealthKitAvailability } from './native/healthkit';
import {
  applyLocalIngredientSwap,
  clearWeekMealOverride,
  currentWeekDayIndex,
  defaultWeekSports,
  generateLocalWeekMeals,
  loadStoredWeekMeals,
  loadStoredWeekSports,
  loadWeekMealOverride,
  mealPlanToWeekMeals,
  mergeDayWithCatalog,
  storeWeekMealOverride,
  storeWeekMeals,
  storeWeekMealsFresh,
  storeWeekSports,
  withWeekDaySports,
} from './weekPlan';
import { resolveMealByName } from './mealLookup';
import { withMealImage } from './mealImages';
import { isMealCounted, loadEatenOverrides } from './dayProgress';
import { AppStateContext, AppActionsContext } from './store';
import type { AppState, AppActions, SportCtx } from './store';
import BottomNav from './components/BottomNav';
import SideNav from './components/SideNav';
import AssistantChatbox from './components/AssistantChatbox';
import AssistantFab from './components/AssistantFab';
import { useWebShell } from './hooks/useWebShell';
import { ShellContext } from './shellContext';
import { AssistantUiContext } from './assistantUi';
import { TutorialProvider } from './tutorials';
import HoyScreen from './components/HoyScreen';
import SemanaScreen from './components/SemanaScreen';
import RecetaScreen from './components/RecetaScreen';
import SportScreen from './components/SportScreen';
import SwapScreen from './components/SwapScreen';
import SwapMealScreen from './components/SwapMealScreen';
import SaludScreen from './components/SaludScreen';
import PerfilScreen from './components/PerfilScreen';
import HistorialScreen from './components/HistorialScreen';
import CompraScreen from './components/CompraScreen';
import MisRecetasScreen from './components/MisRecetasScreen';
import AsistenteScreen from './components/AsistenteScreen';
import SugerenciasScreen from './components/SugerenciasScreen';
import AdminSuggestionsScreen from './components/AdminSuggestionsScreen';
import LegalConsentModal from './components/LegalConsentModal';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import OnboardingScreen from './components/OnboardingScreen';
import {
  completeOnboarding,
  connectHealthProvider,
  createSportActivity,
  deleteSportActivityApi,
  disconnectHealthProvider,
  fetchHealthConnections,
  fetchMe,
  fetchSportActivities,
  fetchToday,
  forgotPassword as apiForgotPassword,
  insertTodayFromRecipe,
  login as apiLogin,
  logoutLocal,
  register as apiRegister,
  resetPassword as apiResetPassword,
  swapTodayIngredient,
  swapTodayMeal,
  syncHealth,
  updateProfile,
  updateSportActivityApi,
  updateTodaySports,
  generateMealPlan,
  type SportActivityApi,
} from './api';
import { ApiError } from './api/client';
import { hasTokens } from './api/tokens';
import { shouldShowLegalModal } from './legalConsent';
import { color, font } from './theme';
import type { ConnectProviderResult } from './store';

function activityApiToSport(a: SportActivityApi): Sport {
  return {
    id: a.id,
    name: a.name,
    emoji: a.emoji || '🏃',
    min: a.min,
    kcal: a.kcal,
    on: false,
    activityType: a.activity_type ?? undefined,
    custom: Boolean(a.is_custom) || a.id.startsWith('custom:'),
  };
}

function patchSportTemplate(list: Sport[], id: string, patch: Partial<Sport>): Sport[] {
  return list.map(s => {
    if (s.id !== id) return s;
    const nextMin = patch.min ?? s.min;
    const next: Sport = {
      ...s,
      ...patch,
      min: nextMin,
      // Keep practiced duration in sync when editing baseline if it matched old min
      customMin: s.customMin != null && s.customMin === s.min
        ? nextMin
        : s.customMin,
    };
    return next;
  });
}

const EMPTY_HEALTH_SUMMARY: HealthSummary = {
  kcal: 0,
  steps: 0,
  minutes: 0,
  lastSyncAt: null,
  hasConnected: false,
};

function readOAuthReturn(): { screen: Screen | null; banner: string } {
  if (typeof window === 'undefined') return { screen: null, banner: '' };
  const path = window.location.pathname.replace(/\/+$/, '');
  const params = new URLSearchParams(window.location.search);
  const connected = params.get('connected');
  const error = params.get('error');
  const provider = params.get('provider') || connected || '';
  const onSalud = path.endsWith('/salud') || Boolean(connected || error);

  let banner = '';
  if (connected) banner = `Conectado: ${connected}. Pulsa Sincronizar para traer la actividad de hoy.`;
  else if (error) banner = `No se pudo conectar${provider ? ` ${provider}` : ''}: ${error}`;

  if (connected || error) {
    const url = new URL(window.location.href);
    url.searchParams.delete('connected');
    url.searchParams.delete('error');
    url.searchParams.delete('provider');
    const cleanPath = path.endsWith('/salud') ? path.replace(/\/salud$/, '/') || '/' : path;
    window.history.replaceState({}, '', `${cleanPath}${url.search}${url.hash}`);
  }

  return { screen: onSalud ? 'salud' : null, banner };
}

function readResetTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get('reset_token')?.trim() || null;
  if (token) {
    url.searchParams.delete('reset_token');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return token;
}

function App() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [pendingReg, setPendingReg] = useState<{ name: string; email: string } | null>(null);
  const [authError, setAuthError] = useState('');

  const [screen, setScreen] = useState<Screen>('hoy');
  const [showLegal, setShowLegal] = useState(() => shouldShowLegalModal());
  const [selectedDay, setSelectedDay] = useState(2);
  const [openMeal, setOpenMeal] = useState(1);
  const [openSwapIng, setOpenSwapIng] = useState(0);
  const [sports, setSports] = useState<Sport[]>(() => INITIAL_SPORTS.map(s => ({ ...s })));
  const [activityCatalog, setActivityCatalog] = useState<Sport[]>(() =>
    INITIAL_SPORTS.map(s => ({ ...s, on: false })),
  );
  const [weekSports, setWeekSports] = useState<Sport[][]>(() => {
    const catalog = INITIAL_SPORTS.map(s => ({ ...s, on: false }));
    return loadStoredWeekSports(catalog) ?? defaultWeekSports(catalog);
  });
  const [sportCtx, setSportCtx] = useState<SportCtx>(() => ({
    source: 'hoy',
    dayIdx: currentWeekDayIndex(),
  }));
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [healthSummary, setHealthSummary] = useState<HealthSummary>(EMPTY_HEALTH_SUMMARY);
  const [healthBanner, setHealthBanner] = useState('');
  const [currentMeals, setCurrentMeals] = useState<Meal[]>(() => MEALS.map(withMealImage));
  const [weekMeals, setWeekMeals] = useState<string[][]>(() => loadStoredWeekMeals() ?? WEEK_MEALS);
  const [swapMealCtx, setSwapMealCtx] = useState<SwapMealCtx | null>(null);
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);
  const [recipeBack, setRecipeBack] = useState<'hoy' | 'semana' | 'historial'>('hoy');
  const [dayMacros, setDayMacros] = useState<DayMacros | null>(null);
  const [historyFocusDate, setHistoryFocusDate] = useState<string | null>(null);
  const [historyBack, setHistoryBack] = useState<'hoy' | 'perfil'>('perfil');

  function applyPlan(
    plan: { meals: Meal[]; sports: Sport[]; macros: DayMacros },
    catalogOverride?: Sport[],
  ) {
    setCurrentMeals(plan.meals);
    const catalog = catalogOverride?.length
      ? catalogOverride
      : (activityCatalog.length ? activityCatalog : INITIAL_SPORTS.map(s => ({ ...s, on: false })));
    const merged = mergeDayWithCatalog(plan.sports, catalog);
    setSports(merged);
    setDayMacros(plan.macros);
    const todayIdx = currentWeekDayIndex();
    setWeekSports(prev => withWeekDaySports(prev, todayIdx, merged));
  }

  async function hydrateSportCatalog(): Promise<Sport[]> {
    try {
      const rows = await fetchSportActivities();
      const catalog = rows.map(activityApiToSport);
      setActivityCatalog(catalog);
      setWeekSports(prev => {
        const next = (prev.length === 7 ? prev : defaultWeekSports(catalog)).map(day =>
          mergeDayWithCatalog(day, catalog),
        );
        storeWeekSports(next);
        return next;
      });
      setSports(prev => mergeDayWithCatalog(prev, catalog));
      return catalog;
    } catch {
      return activityCatalog.length ? activityCatalog : INITIAL_SPORTS.map(s => ({ ...s, on: false }));
    }
  }

  async function loadHealthConnections() {
    try {
      const api = await fetchHealthConnections();
      const mapped = mapHealthConnections(api);
      setProviders(mapped.providers);
      setHealthSummary(mapped.summary);
    } catch {
      // Keep local provider list
    }
  }

  async function enterApp(u: User) {
    setUser(u);
    setPendingReg(null);
    setAuthError('');
    if (!u.onboardingComplete) {
      setPendingReg({ name: u.name, email: u.email });
      setAuthScreen('onboarding');
      return;
    }
    setAuthScreen('login');
    const oauth = readOAuthReturn();
    setScreen(oauth.screen || 'hoy');
    if (oauth.banner) setHealthBanner(oauth.banner);
    let mealsForLock = currentMeals;
    try {
      const catalog = await hydrateSportCatalog();
      const plan = await fetchToday();
      applyPlan(plan, catalog);
      mealsForLock = plan.meals;
    } catch {
      // Keep seed data if today fails
    }
    await loadHealthConnections();
    if (oauth.screen === 'salud' && oauth.banner.includes('Conectado')) {
      try {
        const overrides = loadEatenOverrides();
        const locked = mealsForLock
          .map((meal, i) => (isMealCounted(meal, i, overrides) ? i : -1))
          .filter(i => i >= 0);
        const sync = await syncHealth(locked);
        setHealthSummary({
          kcal: sync.kcal,
          steps: sync.steps,
          minutes: sync.minutes,
          lastSyncAt: sync.last_sync_at,
          hasConnected: true,
        });
        const today = await fetchToday();
        applyPlan(today);
        await loadHealthConnections();
      } catch {
        // User can sync manually
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = readResetTokenFromUrl();
      if (token) {
        if (!cancelled) {
          setResetToken(token);
          setAuthScreen('reset');
          setUser(null);
          setBootstrapping(false);
        }
        return;
      }
      if (!hasTokens()) {
        if (!cancelled) setBootstrapping(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        await enterApp(me);
      } catch {
        logoutLocal();
        if (!cancelled) {
          setUser(null);
          setAuthScreen('login');
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(email: string, password: string) {
    setAuthError('');
    try {
      await apiLogin(email, password);
      const me = await fetchMe();
      await enterApp(me);
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.detail : 'No se pudo iniciar sesión.');
    }
  }

  async function handleRegister(name: string, email: string, password: string) {
    setAuthError('');
    try {
      await apiRegister(email, password, name);
      const me = await fetchMe();
      await enterApp(me);
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.detail : 'No se pudo crear la cuenta.');
    }
  }

  async function handleForgotPassword(email: string) {
    setAuthError('');
    try {
      const res = await apiForgotPassword(email);
      return { message: res.message, devResetUrl: res.dev_reset_url };
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : 'No se pudo enviar el enlace.';
      setAuthError(msg);
      throw e;
    }
  }

  async function handleResetPassword(password: string) {
    setAuthError('');
    if (!resetToken) {
      setAuthError('El enlace no es válido. Solicita uno nuevo.');
      throw new Error('missing reset token');
    }
    try {
      await apiResetPassword(resetToken, password);
      setResetToken(null);
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.detail : 'No se pudo actualizar la contraseña.');
      throw e;
    }
  }

  async function handleOnboardingComplete(payload: {
    name: string;
    email: string;
    age: number;
    sex: 'male' | 'female';
    height: number;
    weight: number;
    targetWeight: number;
    goals: string[];
    dietType: string;
    allergies: string[];
    activityLevel: string;
    healthProviders: Record<string, boolean>;
  }) {
    setAuthError('');
    try {
      const u = await completeOnboarding({
        name: payload.name,
        age: payload.age,
        sex: payload.sex,
        height: payload.height,
        weight: payload.weight,
        target_weight: payload.targetWeight,
        goals: payload.goals,
        diet_type: payload.dietType,
        allergies: payload.allergies,
        activity_level: payload.activityLevel,
        health_providers: payload.healthProviders,
      });
      await enterApp(u);
    } catch (e) {
      setAuthError(e instanceof ApiError ? e.detail : 'No se pudo guardar el perfil.');
    }
  }

  const go = useCallback((s: Screen) => {
    if (s !== 'receta') setViewingMeal(null);
    setScreen(s);
  }, []);

  const openHistory = useCallback((date?: string, back: 'hoy' | 'perfil' = 'perfil') => {
    setHistoryFocusDate(date ?? null);
    setHistoryBack(back);
    setViewingMeal(null);
    setScreen('historial');
  }, []);

  const sportsSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sportsSyncSeq = useRef(0);

  const flushSportsToApi = useCallback(async (next: Sport[]) => {
    const seq = ++sportsSyncSeq.current;
    const overrides = loadEatenOverrides();
    const locked = currentMeals
      .map((meal, i) => (isMealCounted(meal, i, overrides) ? i : -1))
      .filter(i => i >= 0);
    try {
      const plan = await updateTodaySports(next, locked);
      if (seq !== sportsSyncSeq.current) return;
      // Keep local sports as source of truth — only refresh meals/macros.
      setCurrentMeals(plan.meals);
      setDayMacros(plan.macros);
    } catch {
      // Keep optimistic local state
    }
  }, [currentMeals]);

  const scheduleSportsFlush = useCallback((next: Sport[], debounceMs = 0) => {
    if (sportsSyncTimer.current) clearTimeout(sportsSyncTimer.current);
    if (debounceMs <= 0) {
      void flushSportsToApi(next);
      return;
    }
    sportsSyncTimer.current = setTimeout(() => {
      void flushSportsToApi(next);
    }, debounceMs);
  }, [flushSportsToApi]);

  const syncSports = useCallback((next: Sport[], opts?: { debounceMs?: number }) => {
    setSports(next);
    const todayIdx = currentWeekDayIndex();
    setWeekSports(prev => withWeekDaySports(prev, todayIdx, next));
    scheduleSportsFlush(next, opts?.debounceMs ?? 0);
  }, [scheduleSportsFlush]);

  const mutateEditingSports = useCallback((
    mutator: (list: Sport[]) => Sport[],
    opts?: { debounceMs?: number },
  ) => {
    const dayIdx = sportCtx.dayIdx;
    const todayIdx = currentWeekDayIndex();
    const isToday = dayIdx === todayIdx;

    if (isToday) {
      setSports(prev => {
        const next = mutator(prev);
        setWeekSports(w => withWeekDaySports(w, todayIdx, next));
        scheduleSportsFlush(next, opts?.debounceMs ?? 0);
        return next;
      });
      return;
    }

    setWeekSports(prev => {
      const fallback = defaultWeekSports(
        activityCatalog.length ? activityCatalog : INITIAL_SPORTS.map(s => ({ ...s, on: false })),
      )[0];
      const day = prev[dayIdx] ?? fallback;
      return withWeekDaySports(prev, dayIdx, mutator(day.map(s => ({ ...s }))));
    });
  }, [sportCtx.dayIdx, scheduleSportsFlush, activityCatalog]);

  const toggleSport = useCallback((id: string) => {
    mutateEditingSports(list => list.map(s => (s.id === id ? { ...s, on: !s.on } : s)));
  }, [mutateEditingSports]);

  const setSportDuration = useCallback((id: string, min: number) => {
    if (!Number.isFinite(min) || min < 1) return;
    mutateEditingSports(
      list => list.map(s => (s.id === id ? { ...s, customMin: Math.min(480, Math.round(min)) } : s)),
      { debounceMs: 450 },
    );
  }, [mutateEditingSports]);

  const setSportActivityType = useCallback((id: string, type: string) => {
    mutateEditingSports(list =>
      list.map(s => {
        if (s.id !== id) return s;
        // Second tap on the same chip clears the type.
        const nextType = s.activityType === type ? undefined : type;
        return { ...s, activityType: nextType };
      }),
    );
  }, [mutateEditingSports]);

  const addCustomSport = useCallback(async (input: {
    name: string;
    min: number;
    kcal: number;
    emoji?: string;
    activityType?: string;
  }) => {
    try {
      const created = activityApiToSport(await createSportActivity({
        name: input.name,
        min: input.min,
        kcal: input.kcal,
        emoji: input.emoji,
        activity_type: input.activityType ?? null,
      }));
      const asSession = { ...created, on: true, customMin: created.min };

      setActivityCatalog(prev => [...prev.filter(s => s.id !== created.id), { ...created, on: false }]);

      const dayIdx = sportCtx.dayIdx;
      const todayIdx = currentWeekDayIndex();

      setWeekSports(prev => {
        const next = prev.map((day, i) => {
          const without = day.filter(s => s.id !== created.id);
          if (i !== dayIdx) return [...without, { ...created, on: false }];
          return [...without, { ...asSession }];
        });
        storeWeekSports(next);
        return next;
      });

      if (dayIdx === todayIdx) {
        setSports(prev => {
          const without = prev.filter(s => s.id !== created.id);
          const next = [...without, { ...asSession }];
          syncSports(next);
          return next;
        });
      }
    } catch {
      // keep local UI unchanged on failure
    }
  }, [sportCtx.dayIdx, syncSports]);

  const updateSportActivity = useCallback(async (id: string, input: {
    name: string;
    min: number;
    kcal: number;
    emoji?: string;
    activityType?: string;
  }) => {
    try {
      const updated = activityApiToSport(await updateSportActivityApi(id, {
        name: input.name,
        min: input.min,
        kcal: input.kcal,
        emoji: input.emoji,
        activity_type: input.activityType ?? null,
      }));
      const patch: Partial<Sport> = {
        name: updated.name,
        emoji: updated.emoji,
        min: updated.min,
        kcal: updated.kcal,
        activityType: updated.activityType,
        custom: updated.custom,
      };

      setActivityCatalog(prev => patchSportTemplate(prev, id, { ...patch, on: false }));

      setWeekSports(prev => {
        const next = prev.map(day => patchSportTemplate(day, id, patch));
        storeWeekSports(next);
        return next;
      });

      setSports(prev => {
        const next = patchSportTemplate(prev, id, patch);
        const todayIdx = currentWeekDayIndex();
        if (sportCtx.dayIdx === todayIdx) syncSports(next);
        return next;
      });
    } catch {
      // ignore
    }
  }, [sportCtx.dayIdx, syncSports]);

  const removeCustomSport = useCallback(async (id: string) => {
    try {
      await deleteSportActivityApi(id);
    } catch {
      return;
    }

    setActivityCatalog(prev => prev.filter(s => s.id !== id));

    const todayIdx = currentWeekDayIndex();
    setWeekSports(prev => {
      const next = prev.map(day => day.filter(s => s.id !== id));
      storeWeekSports(next);
      return next;
    });

    setSports(prev => {
      if (!prev.some(s => s.id === id)) return prev;
      const next = prev.filter(s => s.id !== id);
      if (sportCtx.dayIdx === todayIdx) syncSports(next);
      return next;
    });
  }, [sportCtx.dayIdx, syncSports]);

  const refreshHealthConnections = useCallback(async () => {
    await loadHealthConnections();
  }, []);

  const connectProvider = useCallback(async (id: string): Promise<ConnectProviderResult> => {
    if (id === 'apple') {
      const avail = await getHealthKitAvailability();
      setHealthBanner(avail.message);
      await loadHealthConnections();
      return { message: avail.message, status: 'needs_native' };
    }
    try {
      const res = await connectHealthProvider(id);
      if (res.authorize_url) {
        window.location.href = res.authorize_url;
        return { authorizeUrl: res.authorize_url, status: res.status, message: res.message };
      }
      setHealthBanner(res.message || '');
      await loadHealthConnections();
      return { message: res.message, status: res.status, authorizeUrl: null };
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : 'No se pudo iniciar la conexión';
      setHealthBanner(msg);
      throw e;
    }
  }, []);

  const disconnectProvider = useCallback(async (id: string) => {
    await disconnectHealthProvider(id);
    setHealthBanner('');
    await loadHealthConnections();
    try {
      const today = await fetchToday();
      applyPlan(today);
    } catch {
      // ignore
    }
  }, []);

  const syncHealthProviders = useCallback(async () => {
    const overrides = loadEatenOverrides();
    const locked = currentMeals
      .map((meal, i) => (isMealCounted(meal, i, overrides) ? i : -1))
      .filter(i => i >= 0);
    const sync = await syncHealth(locked);
    setHealthSummary({
      kcal: sync.kcal,
      steps: sync.steps,
      minutes: sync.minutes,
      lastSyncAt: sync.last_sync_at,
      hasConnected: true,
    });
    setHealthBanner(sync.kcal > 0 || sync.steps > 0
      ? `Sync listo: ${sync.kcal} kcal · ${sync.steps} pasos`
      : 'Sync listo. No hay actividad nueva de hoy.');
    try {
      const today = await fetchToday();
      applyPlan(today);
    } catch {
      // ignore
    }
    await loadHealthConnections();
  }, [currentMeals]);

  const openRecipe = useCallback((i: number) => {
    setOpenMeal(i);
    setViewingMeal(null);
    setRecipeBack('hoy');
    setScreen('receta');
  }, []);

  const openWeekRecipe = useCallback((dayIdx: number, slotIdx: number) => {
    const name = weekMeals[dayIdx]?.[slotIdx];
    if (!name) return;
    const slot = WEEK_MEAL_SLOTS[slotIdx] || 'Almuerzo';
    const overridden = loadWeekMealOverride(dayIdx, slotIdx);
    setViewingMeal(overridden ?? resolveMealByName(name, slot));
    setOpenMeal(slotIdx);
    setRecipeBack('semana');
    setSelectedDay(dayIdx);
    setSwapMealCtx({ source: 'semana', slotIdx, dayIdx });
    setScreen('receta');
  }, [weekMeals]);

  const openHistoryRecipe = useCallback((meal: Meal) => {
    setViewingMeal(meal);
    setOpenMeal(0);
    setRecipeBack('historial');
    setSwapMealCtx(null);
    setScreen('receta');
  }, []);

  const openSwap = useCallback((mealIdx: number, ingIdx: number) => {
    setOpenMeal(mealIdx);
    setOpenSwapIng(ingIdx);
    setScreen('swap');
  }, []);

  const openSwapMeal = useCallback((ctx: SwapMealCtx) => {
    setSwapMealCtx(ctx);
    setRecipeBack(ctx.source === 'semana' ? 'semana' : 'hoy');
    setScreen('swapMeal');
  }, []);

  const applyMealSwap = useCallback(async (newMeal: Meal, newMealName: string) => {
    if (!swapMealCtx) return;
    const { source, slotIdx, dayIdx } = swapMealCtx;
    if (source === 'hoy') {
      try {
        const plan = await swapTodayMeal(slotIdx, newMeal);
        applyPlan(plan);
      } catch {
        setCurrentMeals(prev => prev.map((m, i) => i === slotIdx ? newMeal : m));
      }
    } else {
      clearWeekMealOverride(dayIdx, slotIdx);
      setWeekMeals(prev => {
        const next = prev.map((day, di) =>
          di === dayIdx ? day.map((m, mi) => mi === slotIdx ? newMealName : m) : day
        );
        storeWeekMeals(next);
        return next;
      });
      setViewingMeal(newMeal);
    }
    setSwapMealCtx(null);
  }, [swapMealCtx]);

  const applyUserRecipeSwap = useCallback(async (recipeId: number): Promise<string | null> => {
    if (!swapMealCtx) return null;
    const { slotIdx } = swapMealCtx;
    const overrides = loadEatenOverrides();
    const locked = currentMeals
      .map((m, i) => (m.recipe_source === 'user' || isMealCounted(m, i, overrides) ? i : -1))
      .filter(i => i >= 0);
    try {
      const plan = await insertTodayFromRecipe(recipeId, slotIdx, locked);
      applyPlan(plan);
      setSwapMealCtx(null);
      return plan.adjustmentWarning ?? null;
    } catch {
      setSwapMealCtx(null);
      return null;
    }
  }, [swapMealCtx, currentMeals]);

  const applyIngredientSwap = useCallback(async (alternative: Ingredient) => {
    if (recipeBack === 'semana' && viewingMeal && swapMealCtx) {
      const next = applyLocalIngredientSwap(viewingMeal, openSwapIng, alternative);
      setViewingMeal(next);
      storeWeekMealOverride(swapMealCtx.dayIdx, swapMealCtx.slotIdx, next);
      setScreen('receta');
      return;
    }
    try {
      const plan = await swapTodayIngredient(openMeal, openSwapIng, alternative);
      applyPlan(plan);
      setScreen('receta');
    } catch {
      // keep current
    }
  }, [openMeal, openSwapIng, recipeBack, viewingMeal, swapMealCtx]);

  const goSport = useCallback(() => {
    const todayIdx = currentWeekDayIndex();
    setSportCtx({ source: 'hoy', dayIdx: todayIdx });
    setScreen('sport');
  }, []);

  const goWeekSport = useCallback((dayIdx: number) => {
    setSelectedDay(dayIdx);
    setSportCtx({ source: 'semana', dayIdx });
    setScreen('sport');
  }, []);

  const goSwapDefault = useCallback(() => {
    setOpenMeal(1);
    setOpenSwapIng(1);
    setScreen('swap');
  }, []);

  const updateUser = useCallback(async (u: User) => {
    setUser(u);
    try {
      const saved = await updateProfile(u);
      setUser(saved);
    } catch {
      // keep local
    }
  }, []);

  const generateWeek = useCallback(async () => {
    const target = dayMacros?.targets.cals ?? 2000;
    const opts = { dietType: user?.dietType, allergies: user?.allergies };
    try {
      const plan = await generateMealPlan(target);
      const next = mealPlanToWeekMeals(plan, opts);
      setWeekMeals(next);
      storeWeekMealsFresh(next);
      setSelectedDay(0);
      // Hoy was rebuilt on the server to match day 0 + new calorie target
      try {
        const today = await fetchToday();
        applyPlan(today);
      } catch {
        // keep current day if refresh fails
      }
      return { ok: true as const, source: plan.source };
    } catch {
      const next = generateLocalWeekMeals(opts);
      setWeekMeals(next);
      storeWeekMealsFresh(next);
      setSelectedDay(0);
      return { ok: true as const, source: 'local' };
    }
  }, [dayMacros, user?.dietType, user?.allergies]);

  const logout = useCallback(() => {
    logoutLocal();
    setUser(null);
    setPendingReg(null);
    setAuthScreen('login');
    setScreen('hoy');
    setDayMacros(null);
    setSports(INITIAL_SPORTS.map(s => ({ ...s })));
    setActivityCatalog(INITIAL_SPORTS.map(s => ({ ...s, on: false })));
    setWeekSports(defaultWeekSports(INITIAL_SPORTS.map(s => ({ ...s, on: false }))));
    setSportCtx({ source: 'hoy', dayIdx: currentWeekDayIndex() });
    setCurrentMeals(MEALS.map(withMealImage));
    setProviders(INITIAL_PROVIDERS);
    setHealthSummary(EMPTY_HEALTH_SUMMARY);
    setHealthBanner('');
  }, []);

  const state: AppState = useMemo(() => ({
    screen, selectedDay, openMeal, openSwapIng, sports, weekSports, sportCtx, providers,
    healthSummary, healthBanner,
    user: user!,
    currentMeals, weekMeals, swapMealCtx, dayMacros,
    viewingMeal, recipeBack,
    historyFocusDate, historyBack,
    activityCatalog,
  }), [screen, selectedDay, openMeal, openSwapIng, sports, weekSports, sportCtx, providers, healthSummary, healthBanner, user, currentMeals, weekMeals, swapMealCtx, dayMacros, viewingMeal, recipeBack, historyFocusDate, historyBack, activityCatalog]);

  const actions: AppActions = useMemo(() => ({
    go, toggleSport, setSportDuration, setSportActivityType,
    addCustomSport, updateSportActivity, removeCustomSport,
    connectProvider, disconnectProvider, syncHealthProviders, refreshHealthConnections,
    setSelectedDay,
    openRecipe, openWeekRecipe, openHistoryRecipe, openSwap, openSwapMeal, applyMealSwap, applyUserRecipeSwap, applyIngredientSwap,
    goSport, goWeekSport, goSwapDefault, openHistory, updateUser, logout, generateWeek,
  }), [go, toggleSport, setSportDuration, setSportActivityType, addCustomSport, updateSportActivity, removeCustomSport, connectProvider, disconnectProvider, syncHealthProviders, refreshHealthConnections, openRecipe, openWeekRecipe, openHistoryRecipe, openSwap, openSwapMeal, applyMealSwap, applyUserRecipeSwap, applyIngredientSwap, goSport, goWeekSport, goSwapDefault, openHistory, updateUser, logout, generateWeek]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) node.scrollTop = 0;
  }, [screen, authScreen]);

  const isWebShell = useWebShell();
  const [assistantOpen, setAssistantOpen] = useState(false);

  const assistantUi = useMemo(() => ({
    open: assistantOpen,
    openAssistant: () => setAssistantOpen(true),
    closeAssistant: () => setAssistantOpen(false),
    toggleAssistant: () => setAssistantOpen(v => !v),
  }), [assistantOpen]);

  // Web: never stay on full-page asistente — open chatbox instead
  useEffect(() => {
    if (!isWebShell || screen !== 'asistente') return;
    setAssistantOpen(true);
    go('hoy');
  }, [isWebShell, screen, go]);

  useEffect(() => {
    if (!isWebShell) setAssistantOpen(false);
  }, [isWebShell]);

  const legalOk = !shouldShowLegalModal() || !showLegal;
  const openLegal = () => setShowLegal(true);

  const authScreens = (
    <>
      {authScreen === 'login' && (
        <LoginScreen
          onLogin={handleLogin}
          onRegister={() => { setAuthError(''); setAuthScreen('register'); }}
          onForgotPassword={() => { setAuthError(''); setAuthScreen('forgot'); }}
          error={authError}
        />
      )}
      {authScreen === 'register' && (
        <RegisterScreen
          onContinue={handleRegister}
          onLogin={() => { setAuthError(''); setAuthScreen('login'); }}
          error={authError}
        />
      )}
      {authScreen === 'forgot' && (
        <ForgotPasswordScreen
          onSubmit={handleForgotPassword}
          onBack={() => { setAuthError(''); setAuthScreen('login'); }}
          error={authError}
        />
      )}
      {authScreen === 'reset' && (
        <ResetPasswordScreen
          onSubmit={handleResetPassword}
          onBack={() => {
            setAuthError('');
            setResetToken(null);
            setAuthScreen('login');
          }}
          error={authError}
        />
      )}
      {authScreen === 'onboarding' && pendingReg && (
        <OnboardingScreen
          name={pendingReg.name}
          email={pendingReg.email}
          onComplete={handleOnboardingComplete}
          error={authError}
        />
      )}
    </>
  );

  const mainScreens = user ? (
    <>
      {screen === 'hoy' && <HoyScreen />}
      {screen === 'semana' && <SemanaScreen />}
      {screen === 'receta' && <RecetaScreen />}
      {screen === 'sport' && <SportScreen />}
      {screen === 'swap' && <SwapScreen />}
      {screen === 'swapMeal' && <SwapMealScreen />}
      {screen === 'salud' && <SaludScreen />}
      {screen === 'perfil' && <PerfilScreen onShowLegal={() => setShowLegal(true)} />}
      {screen === 'historial' && <HistorialScreen />}
      {screen === 'compra' && <CompraScreen />}
      {screen === 'misRecetas' && <MisRecetasScreen />}
      {screen === 'asistente' && !isWebShell && (
        <AsistenteScreen
          legalOk={legalOk}
          onNeedLegal={openLegal}
        />
      )}
      {screen === 'sugerencias' && <SugerenciasScreen />}
      {screen === 'adminSugerencias' && <AdminSuggestionsScreen />}
    </>
  ) : null;

  if (bootstrapping) {
    if (isWebShell) {
      return (
        <div className="app-shell-boot">
          <div style={{ fontFamily: font.display, fontWeight: 800, color: color.textMuted }}>Cargando…</div>
        </div>
      );
    }
    return (
      <div className="app-wrapper">
        <div className="phone-frame">
          <div className="phone-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, color: color.textMuted }}>Cargando…</div>
          </div>
        </div>
      </div>
    );
  }

  // Auth / onboarding flow
  if (!user || (authScreen === 'onboarding' && pendingReg)) {
    if (isWebShell) {
      return (
        <ShellContext.Provider value="web">
          <div className="app-shell-auth app-root">
            <div className="app-shell-auth-card">
              <div ref={scrollRef} className="np-scroll">
                {authScreens}
              </div>
            </div>
          </div>
        </ShellContext.Provider>
      );
    }
    return (
      <ShellContext.Provider value="phone">
        <div className="app-wrapper">
          <div className="phone-frame">
            <div className="phone-screen">
              <div ref={scrollRef} className="np-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {authScreens}
              </div>
            </div>
          </div>
        </div>
      </ShellContext.Provider>
    );
  }

  if (isWebShell) {
    return (
      <AppStateContext.Provider value={state}>
        <AppActionsContext.Provider value={actions}>
          <ShellContext.Provider value="web">
            <AssistantUiContext.Provider value={assistantUi}>
              <TutorialProvider legalReady={!showLegal}>
              <div className="app-shell app-root">
                <SideNav />
                <div className="app-main">
                  <div className="app-main-inner">
                    <div
                      ref={scrollRef}
                      className="np-scroll"
                      style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                    >
                      {mainScreens}
                    </div>
                  </div>
                </div>
                <AssistantFab />
                <AssistantChatbox
                  open={assistantOpen}
                  onClose={() => setAssistantOpen(false)}
                  legalOk={legalOk}
                  onNeedLegal={openLegal}
                />
                {showLegal && (
                  <LegalConsentModal onDone={() => setShowLegal(false)} />
                )}
              </div>
              </TutorialProvider>
            </AssistantUiContext.Provider>
          </ShellContext.Provider>
        </AppActionsContext.Provider>
      </AppStateContext.Provider>
    );
  }

  return (
    <AppStateContext.Provider value={state}>
      <AppActionsContext.Provider value={actions}>
        <ShellContext.Provider value="phone">
          <TutorialProvider legalReady={!showLegal}>
          <div className="app-wrapper">
            <div className="phone-frame">
              <div className="phone-screen">
                <div
                  ref={scrollRef}
                  className="np-scroll"
                  style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                >
                  {mainScreens}
                </div>
                <BottomNav />
                {showLegal && (
                  <LegalConsentModal onDone={() => setShowLegal(false)} />
                )}
              </div>
            </div>
          </div>
          </TutorialProvider>
        </ShellContext.Provider>
      </AppActionsContext.Provider>
    </AppStateContext.Provider>
  );
}

export default App;
