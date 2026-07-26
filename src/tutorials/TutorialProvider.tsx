import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useShellMode } from '../shellContext';
import { useAssistantUi } from '../assistantUi';
import { useAppActions, useAppState } from '../store';
import { TUTORIAL_BY_ID, TUTORIALS, tutorialsForAutoStart } from './registry';
import {
  isTutorialCompleted,
  markTutorialCompleted,
  resetAllTutorials,
  resetTutorial,
} from './storage';
import TutorialOverlay from './TutorialOverlay';
import { setHoyRatingTutorialVisible } from './hoyBridge';
import type { TutorialAppContext, TutorialId, TutorialPrep, TutorialStep } from './types';

type TutorialApi = {
  activeId: TutorialId | null;
  startTutorial: (id: TutorialId, opts?: { force?: boolean }) => Promise<boolean>;
  stopTutorial: () => void;
  resetTutorialProgress: (id: TutorialId) => void;
  resetAllTutorialProgress: () => void;
  isCompleted: (id: TutorialId) => boolean;
  catalog: typeof TUTORIALS;
};

const TutorialContext = createContext<TutorialApi | null>(null);

function waitFrames(n = 2): Promise<void> {
  return new Promise(resolve => {
    let left = n;
    const tick = () => {
      left -= 1;
      if (left <= 0) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTargetVisible(selector: string): boolean {
  const el = document.querySelector(selector);
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function filterStepsByWhen(steps: TutorialStep[], ctx: TutorialAppContext): TutorialStep[] {
  return steps.filter(s => !s.when || s.when(ctx));
}

/** If already on a mid-flow screen, skip earlier entry steps. */
function startIndexForScreen(steps: TutorialStep[], screen: string): number {
  if (screen === 'swapMeal') {
    const i = steps.findIndex(s => s.prep === 'swap-meal-hoy' || s.target.includes('swap-meal'));
    return i >= 0 ? i : 0;
  }
  if (screen === 'swap') {
    const i = steps.findIndex(s => s.prep === 'swap-ing-hoy' || s.target.includes('swap-ing'));
    return i >= 0 ? i : 0;
  }
  if (screen === 'receta') {
    const i = steps.findIndex(s => s.prep === 'recipe-hoy' || s.target.includes('receta-'));
    return i >= 0 ? i : 0;
  }
  return 0;
}

export function TutorialProvider({
  children,
  legalReady = true,
}: {
  children: ReactNode;
  /** When false (cookies / aviso legal abierto), no auto-start tours. */
  legalReady?: boolean;
}) {
  const { screen, user, currentMeals } = useAppState();
  const { go, openSwapMeal, openRecipe, openSwap } = useAppActions();
  const shell = useShellMode();
  const isWebShell = shell === 'web';
  const assistantUi = useAssistantUi();

  const [activeId, setActiveId] = useState<TutorialId | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepReady, setStepReady] = useState(false);
  const [tick, setTick] = useState(0);
  const autoTried = useRef<Set<string>>(new Set());
  const starting = useRef(false);
  const activeIdRef = useRef<TutorialId | null>(null);
  const startTutorialRef = useRef<(id: TutorialId, opts?: { force?: boolean }) => Promise<boolean>>(
    async () => false,
  );

  activeIdRef.current = activeId;

  const runPrep = useCallback(async (prep?: TutorialPrep) => {
    if (!prep) return;
    const slotIdx = 0;
    const dayIdx = 2;
    switch (prep) {
      case 'hoy':
        setHoyRatingTutorialVisible(false);
        go('hoy');
        break;
      case 'hoy-rating-demo':
        go('hoy');
        await waitFrames(3);
        await delay(80);
        setHoyRatingTutorialVisible(true);
        break;
      case 'swap-meal-hoy':
        setHoyRatingTutorialVisible(false);
        openSwapMeal({ source: 'hoy', slotIdx, dayIdx });
        break;
      case 'recipe-hoy':
        setHoyRatingTutorialVisible(false);
        openRecipe(slotIdx);
        break;
      case 'swap-ing-hoy': {
        setHoyRatingTutorialVisible(false);
        const meal = currentMeals[slotIdx];
        const ingIdx = meal?.ingredients?.length ? 0 : 0;
        openRecipe(slotIdx);
        await waitFrames(2);
        await delay(40);
        openSwap(slotIdx, ingIdx);
        break;
      }
      default:
        break;
    }
    await waitFrames(3);
    await delay(100);
  }, [currentMeals, go, openRecipe, openSwap, openSwapMeal]);

  const stopTutorial = useCallback(() => {
    setHoyRatingTutorialVisible(false);
    activeIdRef.current = null;
    setActiveId(null);
    setSteps([]);
    setStepIndex(0);
    setStepReady(false);
    starting.current = false;
  }, []);

  const finish = useCallback((id: TutorialId) => {
    markTutorialCompleted(id);
    setTick(t => t + 1);
    stopTutorial();
  }, [stopTutorial]);

  const startTutorial = useCallback(async (id: TutorialId, opts?: { force?: boolean }) => {
    if (starting.current) return false;
    if (activeIdRef.current && !opts?.force) return false;
    const def = TUTORIAL_BY_ID[id];
    if (!def) return false;
    if (!opts?.force && isTutorialCompleted(id)) return false;

    starting.current = true;
    try {
      const ctx: TutorialAppContext = {
        screen,
        isWebShell,
        isSuperadmin: Boolean(user?.isSuperadmin),
      };
      const filtered = filterStepsByWhen(def.steps, ctx);
      if (filtered.length === 0) return false;

      // Web asistente: keep FAB mounted
      const webAsistente = id === 'asistente' && isWebShell;
      if (webAsistente) {
        assistantUi.closeAssistant();
        await waitFrames(2);
        await delay(60);
      } else {
        const hasPrep = filtered.some(s => s.prep);
        const ensure = def.ensureScreen || (!hasPrep ? def.autoScreen : undefined);
        if (ensure && screen !== ensure) {
          go(ensure as import('../types').Screen);
          await waitFrames(4);
          await delay(120);
        }
      }

      const idx = opts?.force ? 0 : startIndexForScreen(filtered, screen);
      activeIdRef.current = id;
      setActiveId(id);
      setSteps(filtered);
      setStepIndex(idx);
      setStepReady(false);
      return true;
    } finally {
      starting.current = false;
    }
  }, [assistantUi, go, isWebShell, screen, user?.isSuperadmin]);

  startTutorialRef.current = startTutorial;

  // Prepare current step (navigate + wait for target)
  useEffect(() => {
    if (!activeId || steps.length === 0) return;
    const step = steps[stepIndex];
    if (!step) return;

    let cancelled = false;
    setStepReady(false);

    (async () => {
      try {
        if (step.prep) await runPrep(step.prep);
        else if (step.beforeShow) await step.beforeShow();
        else {
          await waitFrames(2);
          await delay(50);
        }
      } catch {
        // ignore
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (cancelled) return;
        if (isTargetVisible(step.target)) {
          setStepReady(true);
          return;
        }
        await delay(120 + attempt * 40);
      }

      if (cancelled) return;
      // Skip missing targets
      if (stepIndex < steps.length - 1) {
        setStepIndex(i => i + 1);
      } else {
        finish(activeId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId, stepIndex, steps, runPrep, finish]);

  // Auto-start on first visit per screen (when not completed).
  // Wait until legal/cookies consent is done so that modal always comes first.
  useEffect(() => {
    if (!user?.onboardingComplete) return;
    if (!legalReady) return;

    const candidates = tutorialsForAutoStart(screen, {
      isWebShell,
      isSuperadmin: Boolean(user?.isSuperadmin),
    }).filter(t => !isTutorialCompleted(t.id));

    const def = candidates[0];
    if (!def) return;

    const key = `${screen}:${def.id}`;
    if (autoTried.current.has(key)) return;

    let cancelled = false;
    const timers: number[] = [];

    const attempt = async (n: number) => {
      if (cancelled) return;
      if (activeIdRef.current) {
        autoTried.current.add(key);
        return;
      }
      const ok = await startTutorialRef.current(def.id);
      if (cancelled) return;
      if (ok) {
        autoTried.current.add(key);
        return;
      }
      if (n >= 7) {
        autoTried.current.add(key);
        return;
      }
      timers.push(window.setTimeout(() => void attempt(n + 1), 280 + n * 120));
    };

    timers.push(window.setTimeout(() => void attempt(0), 550));

    return () => {
      cancelled = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [screen, user?.onboardingComplete, user?.isSuperadmin, isWebShell, tick, legalReady]);

  const onNext = useCallback(() => {
    if (!activeId) return;
    if (stepIndex >= steps.length - 1) {
      finish(activeId);
      return;
    }
    setStepReady(false);
    setStepIndex(i => i + 1);
  }, [activeId, finish, stepIndex, steps.length]);

  const onSkip = useCallback(() => {
    if (!activeId) return;
    finish(activeId);
  }, [activeId, finish]);

  const api = useMemo<TutorialApi>(() => ({
    activeId,
    startTutorial,
    stopTutorial,
    resetTutorialProgress: (id) => {
      resetTutorial(id);
      for (const k of [...autoTried.current]) {
        if (k.endsWith(`:${id}`)) autoTried.current.delete(k);
      }
      setTick(t => t + 1);
    },
    resetAllTutorialProgress: () => {
      resetAllTutorials();
      autoTried.current.clear();
      setTick(t => t + 1);
    },
    isCompleted: (id) => {
      void tick;
      return isTutorialCompleted(id);
    },
    catalog: TUTORIALS,
  }), [activeId, startTutorial, stopTutorial, tick]);

  const defTitle = activeId ? TUTORIAL_BY_ID[activeId]?.title || '' : '';

  return (
    <TutorialContext.Provider value={api}>
      {children}
      {activeId && steps.length > 0 && stepReady && (
        <TutorialOverlay
          title={defTitle}
          steps={steps}
          stepIndex={stepIndex}
          onNext={onNext}
          onSkip={onSkip}
          onClose={onSkip}
        />
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorials(): TutorialApi {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorials must be used within TutorialProvider');
  }
  return ctx;
}
