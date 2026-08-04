import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchHistoryCalendar, fetchHistoryDay, type DailyLogApi } from '../api';
import { ApiError } from '../api/client';
import { n } from '../format';
import { useAppActions, useAppState } from '../store';
import type { Meal } from '../types';
import { color, font, macro, radius, shadow, cardStyle, secondaryBtnStyle } from '../theme';
import MacroRings from './MacroRings';
import { BackButton, Eyebrow, ScreenPage, ScreenTitle, SectionTitle } from './ui';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function formatMonthTitle(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  const raw = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatDateLabel(iso: string): string {
  try {
    return parseIso(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return iso;
  }
}

function buildMonthCells(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function DayStats({
  log,
  onOpenMeal,
}: {
  log: DailyLogApi;
  onOpenMeal: (meal: Meal) => void;
}) {
  const meals = log.meals_snapshot || [];
  const sports = (log.sports_snapshot || []).filter(s => s.on);
  const targets = log.targets || { cals: 0, p: 0, c: 0, f: 0 };
  const consumed = log.consumed || { cals: 0, p: 0, c: 0, f: 0 };
  const eaten = Math.round(consumed.cals || 0);
  const targetCals = Math.round(targets.cals || 0);
  const burn = log.sports_burn_kcal || 0;

  const macroRows = [
    { label: 'Proteína', ...macro.protein, cur: consumed.p || 0, max: targets.p || 0 },
    { label: 'Carbos', ...macro.carbs, cur: consumed.c || 0, max: targets.c || 0 },
    { label: 'Grasas', ...macro.fat, cur: consumed.f || 0, max: targets.f || 0 },
  ] as const;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        ...cardStyle,
        borderRadius: 30,
        padding: '20px 18px 18px',
        boxShadow: shadow.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MacroRings
            pPct={targets.p ? consumed.p / targets.p : 0}
            cPct={targets.c ? consumed.c / targets.c : 0}
            fPct={targets.f ? consumed.f / targets.f : 0}
            value={eaten}
            mode="kcal"
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.2, color: color.textMuted }}>
              {eaten} / {targetCals} kcal
              {burn > 0 ? ` · +${burn} act.` : ''}
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

      <SectionTitle style={{ fontSize: 16 }}>Comidas</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {meals.map((m, i) => {
          const st = m.status || 'planned';
          const statusHint =
            st === 'skipped' ? ' · omitida'
              : st === 'replaced' ? ' · otra cosa'
                : st === 'eaten' ? ' · hecha'
                  : '';
          return (
          <button
            key={i}
            type="button"
            onClick={() => onOpenMeal(m)}
            style={{
              ...cardStyle,
              borderRadius: radius.lg,
              padding: '13px 15px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              opacity: st === 'skipped' || st === 'replaced' ? 0.75 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase' }}>
                {m.slot}{statusHint}
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                marginTop: 3,
                textDecoration: st === 'skipped' || st === 'replaced' ? 'line-through' : undefined,
              }}>
                {m.name}
              </div>
              <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600, marginTop: 4 }}>
                {n(m.kcal)} kcal · P {n(m.p)} · C {n(m.c)} · G {n(m.f)}
              </div>
            </div>
            <svg width="7" height="12" viewBox="0 0 8 14" aria-hidden>
              <path d="M1 1l6 6-6 6" stroke={color.chevron} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          );
        })}
        {meals.length === 0 && (
          <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 600 }}>Sin comidas.</div>
        )}
      </div>

      {(log.extras_snapshot || []).filter(e => (e.type || 'fruit') === 'other').length > 0 && (
        <>
          <SectionTitle style={{ fontSize: 16 }}>Otra cosa</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(log.extras_snapshot || [])
              .filter(e => (e.type || 'fruit') === 'other')
              .map(e => (
                <div key={e.id} style={{ ...cardStyle, borderRadius: radius.lg, padding: '12px 15px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase' }}>
                    {e.slot || 'Extra'}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>{e.name}</div>
                  <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600, marginTop: 4 }}>
                    {(Number(e.kcal) || 0) > 0
                      ? `~${Math.round(Number(e.kcal))} kcal · P ${n(Number(e.p) || 0)} · C ${n(Number(e.c) || 0)} · G ${n(Number(e.f) || 0)}`
                      : 'Sin estimación'}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {(log.extras_snapshot || []).filter(e => (e.type || 'fruit') === 'fruit').length > 0 && (
        <>
          <SectionTitle style={{ fontSize: 16 }}>Frutas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(log.extras_snapshot || [])
              .filter(e => (e.type || 'fruit') === 'fruit')
              .map(e => (
                <div key={e.id} style={{ ...cardStyle, borderRadius: radius.lg, padding: '12px 15px' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{e.name}</div>
                  <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600, marginTop: 4 }}>
                    {Math.round(Number(e.g) || 0)} g · {Math.round(Number(e.kcal) || 0)} kcal
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {sports.length > 0 && (
        <>
          <SectionTitle style={{ fontSize: 16 }}>Actividad física</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sports.map(s => (
              <div key={s.id} style={{ ...cardStyle, borderRadius: radius.lg, padding: '12px 15px', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600 }}>
                    {s.min} min · +{n(s.kcal)} kcal
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HistorialScreen() {
  const { dayMacros, historyFocusDate, historyBack } = useAppState();
  const { go, openHistoryRecipe } = useAppActions();

  const todayIso = dayMacros?.date || toIso(new Date());
  const today = parseIso(todayIso);
  const initialIso = historyFocusDate && historyFocusDate <= todayIso ? historyFocusDate : todayIso;
  const initialDate = parseIso(initialIso);

  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [selectedIso, setSelectedIso] = useState(initialIso);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<DailyLogApi | null>(null);
  const [loadingCal, setLoadingCal] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [error, setError] = useState('');
  const [emptyMsg, setEmptyMsg] = useState('');

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);

  const loadCalendar = useCallback(async () => {
    setLoadingCal(true);
    setError('');
    try {
      const res = await fetchHistoryCalendar(year, month);
      setMarked(new Set(res.dates || []));
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : 'No se pudo cargar el calendario.');
      setMarked(new Set());
    } finally {
      setLoadingCal(false);
    }
  }, [year, month]);

  const loadDay = useCallback(async (iso: string) => {
    setLoadingDay(true);
    setEmptyMsg('');
    setLog(null);
    try {
      const day = await fetchHistoryDay(iso);
      setLog(day);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setEmptyMsg('Sin datos este día.');
      } else {
        setEmptyMsg(e instanceof ApiError ? e.detail : 'No se pudo cargar el día.');
      }
    } finally {
      setLoadingDay(false);
    }
  }, []);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    void loadDay(selectedIso);
  }, [selectedIso, loadDay]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function selectDay(dayNum: number) {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    if (iso > todayIso) return;
    setSelectedIso(iso);
  }

  return (
    <ScreenPage>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <BackButton onClick={() => go(historyBack)} />
        <div>
          <Eyebrow style={{ fontSize: 13, fontWeight: 600 }}>CALENDARIO</Eyebrow>
          <ScreenTitle style={{ margin: 0 }}>Historial</ScreenTitle>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 500, margin: '4px 0 14px 52px' }}>
        Macros, comidas y actividad.
      </div>

      <div data-tutorial="historial-lista" style={{ ...cardStyle, borderRadius: radius['2xl'], padding: '14px 14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mes anterior"
            style={{
              width: 36, height: 36, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: color.surfaceMuted, color: color.ink, fontSize: 18, fontWeight: 700,
            }}
          >
            ‹
          </button>
          <div style={{ fontFamily: font.display, fontSize: 17, fontWeight: 800 }}>
            {formatMonthTitle(year, month)}
          </div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Mes siguiente"
            disabled={year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1)}
            style={{
              width: 36, height: 36, borderRadius: 12, border: 'none',
              cursor: 'pointer',
              background: color.surfaceMuted, color: color.ink, fontSize: 18, fontWeight: 700,
              opacity: (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth() + 1)) ? 0.35 : 1,
            }}
          >
            ›
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map(w => (
            <div key={w} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 800, color: color.textMuted, padding: '4px 0',
            }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((dayNum, i) => {
            if (dayNum == null) return <div key={`e-${i}`} />;
            const iso = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isFuture = iso > todayIso;
            const isSelected = iso === selectedIso;
            const isToday = iso === todayIso;
            const hasData = marked.has(iso);

            return (
              <button
                key={iso}
                type="button"
                disabled={isFuture}
                onClick={() => selectDay(dayNum)}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 12,
                  border: isToday && !isSelected ? `1.5px solid ${color.primary}` : 'none',
                  background: isSelected ? color.ink : isToday ? color.primarySoft : 'transparent',
                  color: isSelected ? color.white : isFuture ? color.textSoft : color.ink,
                  fontSize: 13.5,
                  fontWeight: isSelected || isToday ? 800 : 600,
                  cursor: isFuture ? 'default' : 'pointer',
                  opacity: isFuture ? 0.35 : 1,
                }}
              >
                {dayNum}
                {hasData && !isSelected && (
                  <span style={{
                    position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)',
                    width: 5, height: 5, borderRadius: 99, background: color.primary,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {loadingCal && (
          <div style={{ fontSize: 12, color: color.textMuted, textAlign: 'center', marginTop: 10 }}>
            Cargando mes…
          </div>
        )}
        {error && (
          <div style={{ fontSize: 12.5, color: color.primaryDeep, fontWeight: 600, marginTop: 10, textAlign: 'center' }}>
            {error}
            <button type="button" onClick={() => void loadCalendar()} style={{ ...secondaryBtnStyle(), marginTop: 8, width: '100%' }}>
              Reintentar
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{
          fontFamily: font.display, fontSize: 18, fontWeight: 800, letterSpacing: -0.2,
          textTransform: 'capitalize',
        }}>
          {formatDateLabel(selectedIso)}
        </div>

        {loadingDay && (
          <div style={{ fontSize: 14, color: color.textMuted, fontWeight: 600, padding: '20px 0', textAlign: 'center' }}>
            Cargando día…
          </div>
        )}

        {!loadingDay && emptyMsg && (
          <div style={{ ...cardStyle, borderRadius: radius.xl, padding: 20, marginTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 13.5, color: color.textMuted, lineHeight: 1.45, fontWeight: 500 }}>
              {emptyMsg}
            </div>
          </div>
        )}

        {!loadingDay && log && (
          <DayStats log={log} onOpenMeal={openHistoryRecipe} />
        )}
      </div>
    </ScreenPage>
  );
}
