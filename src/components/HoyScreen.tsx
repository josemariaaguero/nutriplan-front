import { useEffect, useRef, useState } from 'react';
import { useAppState, useAppActions } from '../store';
import { BASE } from '../data';
import MacroRings from './MacroRings';
import MealThumb from './MealThumb';
import MealRatingModal from './MealRatingModal';
import HoyFruitsSection from './HoyFruitsSection';
import { n } from '../format';
import type { Meal, SwapMealCtx } from '../types';
import { color, font, gradient, macro, radius, shadow, cardStyle } from '../theme';
import { Eyebrow, IconFlame, ScreenPage, ScreenTitle } from './ui';
import {
  hasAskedMealRatingToday,
  isMealCounted,
  loadEatenOverrides,
  markMealRatingAsked,
  progressiveMacros,
  storeEatenOverrides,
  sumMealMacros,
} from '../dayProgress';
import { submitMealRating, updateTodayFruits } from '../api';
import { registerHoyRatingTutorialHandler } from '../tutorials/hoyBridge';
import {
  loadTodayFruits,
  storeTodayFruits,
  sumFruitMacros,
  type LoggedFruit,
} from '../fruits';

const DAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function todayEyebrow(activeSportNames: string[]): string {
  const now = new Date();
  const day = DAY_NAMES[now.getDay()];
  const datePart = `${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const sport =
    activeSportNames.length === 0
      ? 'DESCANSO'
      : activeSportNames.length === 1
        ? activeSportNames[0].toUpperCase()
        : `${activeSportNames.length} ACTIVIDADES`;
  return `${day} · ${datePart} · ${sport}`;
}

export default function HoyScreen() {
  const { sports, user, currentMeals, dayMacros } = useAppState();
  const { openRecipe, goSport, openSwapMeal } = useAppActions();
  const [eatenOverrides, setEatenOverrides] = useState<Record<number, boolean>>(
    () => loadEatenOverrides(),
  );
  const [ratingMeal, setRatingMeal] = useState<Meal | null>(null);
  const [ratingFromTutorial, setRatingFromTutorial] = useState(false);
  const [fruits, setFruits] = useState<LoggedFruit[]>(() => loadTodayFruits());
  const fruitsSyncSkip = useRef(true);

  useEffect(() => {
    registerHoyRatingTutorialHandler(show => {
      if (show) {
        setRatingFromTutorial(true);
        setRatingMeal(currentMeals[0] ?? null);
      } else {
        setRatingFromTutorial(false);
        setRatingMeal(null);
      }
    });
    return () => registerHoyRatingTutorialHandler(null);
  }, [currentMeals]);

  useEffect(() => {
    storeTodayFruits(fruits);
    if (fruitsSyncSkip.current) {
      fruitsSyncSkip.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void updateTodayFruits(fruits).catch(() => {
        // local storage remains source of truth if API fails
      });
    }, 450);
    return () => window.clearTimeout(t);
  }, [fruits]);

  const activeSports = sports.filter(s => s.on);
  const burned = dayMacros?.targets.sport_burn ?? activeSports.reduce((a, s) => {
    const min = s.customMin ?? s.min;
    return a + Math.round((s.kcal / s.min) * min);
  }, 0);

  const targets = dayMacros?.targets ?? {
    cals: BASE.cals + burned,
    p: BASE.p + Math.round(burned * 0.06),
    c: BASE.c + Math.round(burned * 0.12),
    f: BASE.f,
  };

  /** Progress so far (past slots / marked eaten) — not the full day plan. */
  const mealConsumed = progressiveMacros(currentMeals, eatenOverrides);
  const fruitConsumed = sumFruitMacros(fruits);
  const consumed = {
    cals: mealConsumed.cals + fruitConsumed.cals,
    p: mealConsumed.p + fruitConsumed.p,
    c: mealConsumed.c + fruitConsumed.c,
    f: mealConsumed.f + fruitConsumed.f,
  };
  const planTotal = sumMealMacros(currentMeals);
  const deficit = targets.cals - consumed.cals;
  const eatenCals = Math.round(consumed.cals);
  const targetCals = Math.round(targets.cals);

  /** ±50 kcal = “en objetivo”; same band as adjustment_note_for_deficit. */
  const ringMode: 'restantes' | 'sobre' | 'kcal' =
    deficit > 50 ? 'restantes' : deficit < -50 ? 'sobre' : 'kcal';
  const ringValue =
    ringMode === 'restantes' ? deficit
      : ringMode === 'sobre' ? -deficit
        : eatenCals;

  const planSummary =
    ringMode === 'restantes'
      ? eatenCals <= 0
        ? `${Math.round(deficit)} kcal por cubrir`
        : `${Math.round(deficit)} kcal por cubrir de ${targetCals}`
      : ringMode === 'sobre'
        ? `+${Math.round(-deficit)} kcal sobre el objetivo de ${targetCals}`
        : `${eatenCals} / ${targetCals} kcal hoy`;

  const adjustNote = (() => {
    if (burned > 0 && deficit > 50) {
      return `+${burned} kcal actividad · faltan ${Math.round(deficit)} kcal`;
    }
    if (deficit > 50) return `Te faltan ${Math.round(deficit)} kcal`;
    if (deficit < -50) return `+${Math.round(-deficit)} kcal · ajusta el resto`;
    return `En objetivo · ${Math.round(planTotal.cals)} kcal`;
  })();

  const sportLabels = activeSports.map(s => s.name.split('(')[0].trim());
  const eyebrow = todayEyebrow(sportLabels);

  function handleSwapMeal(slotIdx: number) {
    const ctx: SwapMealCtx = { source: 'hoy', slotIdx, dayIdx: 2 };
    openSwapMeal(ctx);
  }

  function toggleEaten(index: number) {
    const meal = currentMeals[index];
    const currently = isMealCounted(meal, index, eatenOverrides);
    const next = { ...eatenOverrides, [index]: !currently };
    storeEatenOverrides(next);
    setEatenOverrides(next);
    // Ask once per meal name per day (rated or skipped); re-toggle does not re-prompt.
    if (!currently && !hasAskedMealRatingToday(meal.name)) {
      setRatingMeal(meal);
    }
  }

  async function handleRate(rating: -1 | 0 | 1) {
    const meal = ratingMeal;
    const fromTutorial = ratingFromTutorial;
    setRatingMeal(null);
    setRatingFromTutorial(false);
    if (!meal) return;
    if (fromTutorial) return;
    markMealRatingAsked(meal.name, 'rated');
    try {
      await submitMealRating(meal.name, rating, meal.slot);
    } catch {
      // keep UX non-blocking
    }
  }

  function handleSkipRating() {
    if (ratingFromTutorial) {
      setRatingFromTutorial(false);
      setRatingMeal(null);
      return;
    }
    if (ratingMeal) markMealRatingAsked(ratingMeal.name, 'skipped');
    setRatingMeal(null);
  }

  const macroRows = [
    { label: 'Proteína', ...macro.protein, cur: consumed.p, max: targets.p },
    { label: 'Carbos', ...macro.carbs, cur: consumed.c, max: targets.c },
    { label: 'Grasas', ...macro.fat, cur: consumed.f, max: targets.f },
  ] as const;

  return (
    <ScreenPage>
      <div style={{ marginBottom: 6 }}>
        <Eyebrow style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {eyebrow}
        </Eyebrow>
        <ScreenTitle>Hola, {user.name}</ScreenTitle>
      </div>

      <div
        data-tutorial="hoy-macros"
        style={{
        ...cardStyle,
        borderRadius: 30,
        padding: '20px 18px 18px',
        boxShadow: shadow.lg,
        marginTop: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MacroRings
            pPct={targets.p ? consumed.p / targets.p : 0}
            cPct={targets.c ? consumed.c / targets.c : 0}
            fPct={targets.f ? consumed.f / targets.f : 0}
            value={ringValue}
            mode={ringMode}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
              color: ringMode === 'sobre' ? color.primaryDeep : color.textMuted,
            }}>
              {planSummary}
            </div>
            {macroRows.map(row => {
              const pct = row.max ? Math.min((row.cur / row.max) * 100, 100) : 0;
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: color.text }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                      {row.label}
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b635a' }}>
                      {Math.round(row.cur)}/{Math.round(row.max)}g
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: radius.pill, background: row.track, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, background: row.color,
                      borderRadius: radius.pill, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        data-tutorial="hoy-actividad"
        onClick={goSport}
        role="button"
        style={{
          display: 'flex', alignItems: 'center', gap: 13,
          background: gradient.warmBanner,
          border: `1.5px solid ${color.borderAccent}`, borderRadius: radius.xl,
          padding: '14px 16px', marginTop: 14, cursor: 'pointer',
          transition: 'opacity .2s ease',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 13, background: color.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: color.white,
        }}>
          <IconFlame />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>+{burned} kcal actividad</div>
          <div style={{ fontSize: 12.5, color: color.textWarm, fontWeight: 500, marginTop: 1 }}>{adjustNote}</div>
        </div>
        <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden>
          <path d="M1 1l6 6-6 6" stroke="#c98a64" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ margin: '26px 4px 12px', fontFamily: font.display, fontSize: 19, fontWeight: 800 }}>
        Tu día
      </div>

      <div data-tutorial="hoy-comidas" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {currentMeals.map((meal, i) => {
          const eaten = isMealCounted(meal, i, eatenOverrides);
          return (
            <div key={i} style={{
              ...cardStyle,
              opacity: eaten ? 0.72 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                <button
                  type="button"
                  data-tutorial={i === 0 ? 'hoy-marcar' : undefined}
                  title={eaten ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  aria-pressed={eaten}
                  onClick={() => toggleEaten(i)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    border: eaten ? `2px solid ${color.success}` : `2px solid ${color.border}`,
                    background: eaten ? color.success : color.surface,
                    color: color.white, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, lineHeight: 1,
                    transition: 'background .2s ease, border-color .2s ease',
                  }}
                >
                  {eaten ? '✓' : ''}
                </button>
                <div
                  data-tutorial={i === 0 ? 'hoy-abrir-receta' : undefined}
                  onClick={() => openRecipe(i)}
                  role="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <MealThumb meal={meal} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: color.primaryDeep,
                      letterSpacing: 0.4, textTransform: 'uppercase',
                    }}>
                      {meal.slot}{eaten ? ' · hecha' : ''}
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 700, lineHeight: 1.2, marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textDecoration: eaten ? 'line-through' : undefined,
                      color: eaten ? color.textMuted : color.text,
                    }}>
                      {meal.name}
                    </div>
                    <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 500, marginTop: 3 }}>
                      P {n(meal.p)} · C {n(meal.c)} · G {n(meal.f)}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                    gap: 6, flexShrink: 0,
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: font.display, fontSize: 17, fontWeight: 800 }}>{n(meal.kcal)}</div>
                      <div style={{ fontSize: 10.5, color: color.textSoft, fontWeight: 600 }}>kcal</div>
                    </div>
                    <div
                      data-tutorial={i === 0 ? 'hoy-swap-comida' : undefined}
                      onClick={e => { e.stopPropagation(); handleSwapMeal(i); }}
                      title="Cambiar comida"
                      role="button"
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: color.surfaceMuted, border: `1.5px solid ${color.toggleOff}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="M4 6h12M4 6l3-3M4 6l3 3M16 14H4M16 14l-3-3M16 14l-3 3"
                          stroke={color.textWarm} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <HoyFruitsSection fruits={fruits} onChange={setFruits} />

      {ratingMeal && (
        <MealRatingModal
          mealName={ratingMeal.name}
          onRate={r => void handleRate(r)}
          onSkip={handleSkipRating}
        />
      )}
    </ScreenPage>
  );
}
