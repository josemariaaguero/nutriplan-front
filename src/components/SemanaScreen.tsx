import { useAppState, useAppActions } from '../store';
import { WEEK_DAYS } from '../data';
import {
  currentWeekDayIndex,
  currentWeekDayNumbers,
  currentWeekLabel,
  sportBurnKcal,
  weekSportLabel,
} from '../weekPlan';
import { n } from '../format';
import type { SwapMealCtx } from '../types';
import { color, font, gradient, radius, shadow } from '../theme';
import { Eyebrow, IconCart, IconRun, ScreenPage, ScreenTitle } from './ui';

const SLOT_LABELS = ['Desayuno', 'Almuerzo', 'Snack', 'Cena'];

export default function SemanaScreen() {
  const { selectedDay, weekMeals, weekSports } = useAppState();
  const { setSelectedDay, openSwapMeal, openWeekRecipe, goWeekSport, go } = useAppActions();

  const dayNumbers = currentWeekDayNumbers();
  const weekLabel = currentWeekLabel();
  const todayIdx = currentWeekDayIndex();

  function handleSwapMeal(dayIdx: number, slotIdx: number) {
    const ctx: SwapMealCtx = { source: 'semana', slotIdx, dayIdx };
    openSwapMeal(ctx);
  }

  function handleOpenMeal(dayIdx: number, slotIdx: number) {
    openWeekRecipe(dayIdx, slotIdx);
  }

  return (
    <ScreenPage>
      <div style={{ marginBottom: 6 }}>
        <Eyebrow style={{ fontSize: 14, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>
          {weekLabel}
        </Eyebrow>
        <div data-tutorial="semana-titulo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <ScreenTitle style={{ margin: 0, flex: 1, minWidth: 0, whiteSpace: 'nowrap' }}>
            Plan semanal
          </ScreenTitle>
          <button
            type="button"
            data-tutorial="semana-compra"
            onClick={() => go('compra')}
            aria-label="Lista de la compra"
            title="Lista de la compra"
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11, fontWeight: 800,
              background: color.ink, color: color.white,
              border: 'none', borderRadius: radius.pill,
              padding: '7px 10px', cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            <IconCart />
            Lista
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
        {WEEK_DAYS.map((day, i) => {
          const isSel = i === selectedDay;
          const daySports = weekSports[i] ?? [];
          const sportTag = weekSportLabel(daySports);
          const burn = sportBurnKcal(daySports);
          const isToday = i === todayIdx;

          return (
            <div
              key={i}
              data-tutorial={i === 0 ? 'semana-dia' : undefined}
              style={{
                background: isSel ? gradient.selected : color.surface,
                borderRadius: 24, padding: '16px 18px',
                boxShadow: shadow.md,
                transition: 'background .2s ease, box-shadow .2s ease',
              }}
            >
              <div
                onClick={() => setSelectedDay(i)}
                role="button"
                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <div style={{ textAlign: 'center', width: 42, flexShrink: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                    color: isSel ? 'rgba(255,255,255,.72)' : color.textMuted,
                  }}>
                    {day.d}
                  </div>
                  <div style={{
                    fontFamily: font.display, fontSize: 24, fontWeight: 800,
                    color: isSel ? color.white : color.text, lineHeight: 1,
                  }}>
                    {dayNumbers[i] ?? day.n}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 800, color: color.white,
                    background: isSel ? 'rgba(255,255,255,.24)' : day.color,
                    padding: '3px 10px', borderRadius: radius.pill,
                  }}>
                    {sportTag}
                    {isToday ? ' · Hoy' : ''}
                  </span>
                  <div style={{
                    fontSize: 13, fontWeight: 600, marginTop: 6,
                    color: isSel ? 'rgba(255,255,255,.72)' : color.textMuted,
                  }}>
                    {burn > 0
                      ? `+${n(burn)} kcal actividad`
                      : `${n(day.kcal)} kcal objetivo`}
                  </div>
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isSel ? 'rgba(255,255,255,.2)' : color.surfaceMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg
                    width="10" height="6" viewBox="0 0 10 6"
                    style={{ transform: isSel ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                    aria-hidden
                  >
                    <path d="M1 1l4 4 4-4" stroke={isSel ? '#fff' : color.textMuted} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {isSel && (
                <div style={{
                  marginTop: 14, paddingTop: 14,
                  borderTop: '1px solid rgba(255,255,255,.12)',
                  display: 'flex', flexDirection: 'column', gap: 9,
                }}>
                  {weekMeals[i].map((meal, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        onClick={e => { e.stopPropagation(); handleOpenMeal(i, j); }}
                        role="button"
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                          cursor: 'pointer', minWidth: 0,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                            {SLOT_LABELS[j]}
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.92)', marginTop: 1,
                          }}>
                            {meal}
                          </div>
                        </div>
                        <div
                          aria-label="Ver receta"
                          style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(255,255,255,.08)',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                              stroke="rgba(255,255,255,.55)"
                              strokeWidth="1.6"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" />
                          </svg>
                        </div>
                      </div>
                      <div
                        onClick={e => { e.stopPropagation(); handleSwapMeal(i, j); }}
                        role="button"
                        style={{
                          fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.9)',
                          background: 'rgba(255,255,255,.18)', padding: '5px 11px',
                          borderRadius: radius.pill, cursor: 'pointer', flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Cambiar
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={e => { e.stopPropagation(); goWeekSport(i); }}
                    role="button"
                    style={{
                      marginTop: 6,
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(255,255,255,.12)',
                      borderRadius: radius.lg,
                      padding: '12px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', color: 'rgba(255,255,255,.85)', flexShrink: 0 }} aria-hidden>
                      <IconRun />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                        Actividad física
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.92)', marginTop: 1 }}>
                        {sportTag}
                        {burn > 0 ? ` · +${n(burn)} kcal` : ''}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.9)',
                      background: 'rgba(255,255,255,.18)', padding: '5px 11px',
                      borderRadius: radius.pill, flexShrink: 0,
                    }}>
                      Editar
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScreenPage>
  );
}
