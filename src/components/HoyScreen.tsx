import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAppState, useAppActions } from '../store';
import { BASE } from '../data';
import MacroRings from './MacroRings';
import MealThumb from './MealThumb';
import MealRatingModal from './MealRatingModal';
import HoyFruitsSection from './HoyFruitsSection';
import OtherFoodSheet, { type OtherFoodSavePayload } from './OtherFoodSheet';
import PhoneSheet from './PhoneSheet';
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
  syncEatenOverridesFromMeals,
} from '../dayProgress';
import { submitMealRating, updateMealStatus, updateTodayFruits } from '../api';
import type { ExtraLogApi } from '../api/types';
import { registerHoyRatingTutorialHandler } from '../tutorials/hoyBridge';
import {
  loadTodayFruits,
  storeTodayFruits,
  sumFruitMacros,
  type LoggedFruit,
} from '../fruits';
import { loadTodayOtherExtras, storeTodayOtherExtras } from '../dayExtras';

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

function sumOtherExtras(extras: ExtraLogApi[]) {
  return extras
    .filter(e => (e.type || 'fruit') === 'other')
    .reduce(
      (a, e) => ({
        cals: a.cals + (Number(e.kcal) || 0),
        p: a.p + (Number(e.p) || 0),
        c: a.c + (Number(e.c) || 0),
        f: a.f + (Number(e.f) || 0),
      }),
      { cals: 0, p: 0, c: 0, f: 0 },
    );
}

function statusLabel(meal: Meal, eaten: boolean): string {
  if (meal.status === 'skipped') return ' · omitida';
  if (meal.status === 'replaced') return ' · otra cosa';
  if (eaten) return ' · hecha';
  return '';
}

export default function HoyScreen() {
  const { sports, user, currentMeals, dayMacros } = useAppState();
  const { openRecipe, goSport, openSwapMeal, applyTodayPlan } = useAppActions();
  const [eatenOverrides, setEatenOverrides] = useState<Record<number, boolean>>(
    () => loadEatenOverrides(),
  );
  const [ratingMeal, setRatingMeal] = useState<Meal | null>(null);
  const [ratingFromTutorial, setRatingFromTutorial] = useState(false);
  const [fruits, setFruits] = useState<LoggedFruit[]>(() => loadTodayFruits());
  const [otherExtras, setOtherExtras] = useState<ExtraLogApi[]>(() => loadTodayOtherExtras());
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [otherFoodIndex, setOtherFoodIndex] = useState<number | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [skipConfirmIndex, setSkipConfirmIndex] = useState<number | null>(null);
  const fruitsSyncSkip = useRef(true);

  useEffect(() => {
    setEatenOverrides(syncEatenOverridesFromMeals(currentMeals));
    setOtherExtras(loadTodayOtherExtras());
  }, [currentMeals]);

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
      void updateTodayFruits(fruits)
        .then(plan => {
          applyTodayPlan(plan);
          const others = (plan.extras || []).filter(e => e.type === 'other');
          setOtherExtras(others);
          storeTodayOtherExtras(others);
        })
        .catch(() => {
          // local storage remains source of truth if API fails
        });
    }, 450);
    return () => window.clearTimeout(t);
  }, [fruits, applyTodayPlan]);

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
  const otherConsumed = sumOtherExtras(otherExtras);
  const consumed = {
    cals: mealConsumed.cals + fruitConsumed.cals + otherConsumed.cals,
    p: mealConsumed.p + fruitConsumed.p + otherConsumed.p,
    c: mealConsumed.c + fruitConsumed.c + otherConsumed.c,
    f: mealConsumed.f + fruitConsumed.f + otherConsumed.f,
  };
  const planTotal = sumMealMacros(
    currentMeals.filter(m => m.status !== 'skipped' && m.status !== 'replaced'),
  );
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

  async function setMealStatus(
    index: number,
    status: 'planned' | 'eaten' | 'skipped' | 'replaced',
    estimate?: { name?: string; kcal?: number; p?: number; c?: number; f?: number } | null,
  ) {
    setStatusBusy(true);
    try {
      const bodyEstimate =
        status === 'replaced'
          ? estimate === null
            ? { name: '', kcal: 0 }
            : estimate
              ? {
                  name: estimate.name || '',
                  kcal: estimate.kcal || 0,
                  ...(estimate.p != null && estimate.c != null && estimate.f != null
                    ? { p: estimate.p, c: estimate.c, f: estimate.f }
                    : {}),
                }
              : undefined
          : undefined;
      const plan = await updateMealStatus(index, status, bodyEstimate);
      applyTodayPlan(plan);
      setEatenOverrides(syncEatenOverridesFromMeals(plan.meals));
      const others = (plan.extras || []).filter(e => e.type === 'other');
      setOtherExtras(others);
      storeTodayOtherExtras(others);
    } catch {
      // keep UX non-blocking
    } finally {
      setStatusBusy(false);
    }
  }

  function toggleEaten(index: number) {
    const meal = currentMeals[index];
    if (meal.status === 'skipped' || meal.status === 'replaced') {
      void setMealStatus(index, 'planned');
      return;
    }
    const currently = isMealCounted(meal, index, eatenOverrides);
    const nextStatus = currently ? 'planned' : 'eaten';
    const next = { ...eatenOverrides, [index]: !currently };
    storeEatenOverrides(next);
    setEatenOverrides(next);
    void setMealStatus(index, nextStatus);
    if (!currently && !hasAskedMealRatingToday(meal.name)) {
      setRatingMeal(meal);
    }
  }

  function confirmSkip(index: number) {
    setSkipConfirmIndex(null);
    setMenuIndex(null);
    void setMealStatus(index, 'skipped');
  }

  function handleOtherFoodSave(payload: OtherFoodSavePayload) {
    if (otherFoodIndex == null) return;
    const idx = otherFoodIndex;
    setOtherFoodIndex(null);
    setMenuIndex(null);
    void setMealStatus(
      idx,
      'replaced',
      payload.estimate
        ? { name: payload.name, ...payload.estimate }
        : null,
    );
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

  const menuMeal = menuIndex != null ? currentMeals[menuIndex] : null;

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
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MacroRings
            pPct={targets.p ? consumed.p / targets.p : 0}
            cPct={targets.c ? consumed.c / targets.c : 0}
            fPct={targets.f ? consumed.f / targets.f : 0}
            value={Math.round(ringValue)}
            mode={ringMode}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.2, color: color.textMuted }}>
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
                      borderRadius: radius.pill, transformOrigin: 'left',
                      transform: `scaleX(${pct / 100})`, transition: 'transform 0.6s ease',
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
          const inactive = meal.status === 'skipped' || meal.status === 'replaced';
          return (
            <div key={i} style={{
              ...cardStyle,
              opacity: eaten || inactive ? 0.72 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                <button
                  type="button"
                  data-tutorial={i === 0 ? 'hoy-marcar' : undefined}
                  title={eaten ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  aria-pressed={eaten}
                  onClick={() => toggleEaten(i)}
                  disabled={statusBusy}
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
                      {meal.slot}{statusLabel(meal, eaten)}
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 700, lineHeight: 1.2, marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textDecoration: eaten || inactive ? 'line-through' : undefined,
                      color: eaten || inactive ? color.textMuted : color.text,
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
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div
                        data-tutorial={i === 0 ? 'hoy-swap-comida' : undefined}
                        onClick={e => { e.stopPropagation(); handleSwapMeal(i); }}
                        title="Cambiar comida"
                        role="button"
                        style={iconBtnStyle}
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                          <path d="M4 6h12M4 6l3-3M4 6l3 3M16 14H4M16 14l-3-3M16 14l-3 3"
                            stroke={color.textWarm} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div
                        onClick={e => { e.stopPropagation(); setMenuIndex(i); }}
                        title="Más opciones"
                        role="button"
                        style={iconBtnStyle}
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                          <circle cx="10" cy="4" r="1.6" fill={color.textWarm} />
                          <circle cx="10" cy="10" r="1.6" fill={color.textWarm} />
                          <circle cx="10" cy="16" r="1.6" fill={color.textWarm} />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {otherExtras.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ margin: '0 4px 10px', fontFamily: font.display, fontSize: 16, fontWeight: 800 }}>
            Otra cosa
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherExtras.map(e => (
              <div key={e.id} style={{ ...cardStyle, padding: '12px 14px', borderRadius: radius.lg }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: color.primaryDeep, textTransform: 'uppercase' }}>
                  {e.slot || 'Extra'}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>{e.name}</div>
                <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600, marginTop: 3 }}>
                  {(Number(e.kcal) || 0) > 0
                    ? `~${Math.round(Number(e.kcal))} kcal · P ${n(Number(e.p) || 0)} · C ${n(Number(e.c) || 0)} · G ${n(Number(e.f) || 0)}`
                    : 'Sin estimación'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <HoyFruitsSection fruits={fruits} onChange={setFruits} />

      {menuMeal != null && menuIndex != null && (
        <PhoneSheet onClose={() => setMenuIndex(null)} maxHeight="70%">
          <div style={{ padding: '8px 20px 24px' }}>
            <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {menuMeal.slot}
            </div>
            <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 600, marginBottom: 16 }}>
              {menuMeal.name}
            </div>
            <ActionRow
              label="No la tomo"
              hint="Repartir estas kcal en el resto del día"
              onClick={() => setSkipConfirmIndex(menuIndex)}
              disabled={statusBusy || menuMeal.status === 'skipped'}
            />
            <ActionRow
              label="He comido otra cosa"
              hint="Sustituir el plato del plan (estimación opcional)"
              onClick={() => {
                setOtherFoodIndex(menuIndex);
                setMenuIndex(null);
              }}
              disabled={statusBusy}
            />
            {(menuMeal.status === 'skipped' || menuMeal.status === 'replaced') && (
              <ActionRow
                label="Volver al plan"
                hint="Reactivar esta comida y reequilibrar"
                onClick={() => {
                  const idx = menuIndex;
                  setMenuIndex(null);
                  void setMealStatus(idx, 'planned');
                }}
                disabled={statusBusy}
              />
            )}
          </div>
        </PhoneSheet>
      )}

      {skipConfirmIndex != null && (
        <PhoneSheet onClose={() => setSkipConfirmIndex(null)} maxHeight="50%">
          <div style={{ padding: '8px 20px 24px' }}>
            <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              ¿No la tomas?
            </div>
            <div style={{ fontSize: 14, color: color.textMuted, fontWeight: 600, marginBottom: 18, lineHeight: 1.45 }}>
              Repartiremos las kcal de esta comida entre el resto del día (salvo las que ya marques hechas u otra cosa).
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSkipConfirmIndex(null)}
                style={{
                  flex: 1, padding: '13px 16px', borderRadius: radius.lg,
                  border: `1.5px solid ${color.border}`, background: color.surface,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmSkip(skipConfirmIndex)}
                disabled={statusBusy}
                style={{
                  flex: 1, padding: '13px 16px', borderRadius: radius.lg,
                  border: 'none', background: color.primary, color: color.white,
                  fontWeight: 800, cursor: 'pointer', opacity: statusBusy ? 0.6 : 1,
                }}
              >
                Repartir
              </button>
            </div>
          </div>
        </PhoneSheet>
      )}

      {otherFoodIndex != null && currentMeals[otherFoodIndex] && (
        <OtherFoodSheet
          slotLabel={currentMeals[otherFoodIndex].slot}
          onClose={() => setOtherFoodIndex(null)}
          onSave={handleOtherFoodSave}
          busy={statusBusy}
        />
      )}

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

function ActionRow({
  label,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        marginBottom: 8,
        borderRadius: radius.lg,
        border: `1.5px solid ${color.border}`,
        background: color.surface,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600, marginTop: 3 }}>{hint}</div>
    </button>
  );
}

const iconBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: color.surfaceMuted,
  border: `1.5px solid ${color.toggleOff}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
