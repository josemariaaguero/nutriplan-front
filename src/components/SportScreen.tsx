import { useEffect, useState } from 'react';
import { useAppState, useAppActions } from '../store';
import { BASE, WEEK_DAYS } from '../data';
import { n } from '../format';
import { currentWeekDayIndex } from '../weekPlan';
import { color, font, radius, primaryBtnStyle, secondaryBtnStyle, inputStyle } from '../theme';
import { BackButton, ScreenPage, SectionTitle } from './ui';
import type { Sport } from '../types';

const ACTIVITY_TYPES = ['Cardio', 'Fuerza', 'Mixto', 'Técnica', 'Flexibilidad'];
const EMOJI_OPTIONS = ['🏃', '🚴', '🏋️', '🧘', '🏊', '⚽', '🎾', '🥾', '💃', '🥊'];

function sportKcal(kcal: number, defaultMin: number, customMin?: number): number {
  const min = customMin ?? defaultMin;
  if (!defaultMin) return Math.round(kcal);
  return n((kcal / defaultMin) * min);
}

/** First grapheme from free text (custom emoji / icon). */
function firstEmojiToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const first = [...seg.segment(trimmed)][0];
    return first?.segment?.trim() || '';
  } catch {
    return [...trimmed][0] || '';
  }
}

function DurationField({
  sportId,
  value,
  onCommit,
}: {
  sportId: string;
  value: number;
  onCommit: (id: string, min: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value, sportId]);

  function commit() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setDraft(String(value));
      return;
    }
    const next = Math.min(480, Math.round(parsed));
    setDraft(String(next));
    if (next !== value) onCommit(sportId, next);
  }

  return (
    <input
      type="number"
      value={draft}
      min={1}
      max={480}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      onClick={e => e.stopPropagation()}
      style={{
        width: 80, border: '2px solid #f0e8df', borderRadius: 12,
        padding: '10px 12px', fontSize: 17, fontWeight: 800,
        fontFamily: "'Nunito',sans-serif", outline: 'none', background: '#f7f2ea',
        textAlign: 'center', color: '#2a2520',
      }}
    />
  );
}

export default function SportScreen() {
  const { sports, weekSports, sportCtx, dayMacros } = useAppState();
  const {
    go, toggleSport, setSportDuration, setSportActivityType,
    addCustomSport, updateSportActivity, removeCustomSport,
  } = useAppActions();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('45');
  const [kcal, setKcal] = useState('300');
  const [emoji, setEmoji] = useState('🏃');
  const [customEmoji, setCustomEmoji] = useState('');
  const [activityType, setActivityType] = useState('Mixto');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!menuOpenId) return;
    function onDocClick() {
      setMenuOpenId(null);
    }
    // Defer so the opening click doesn't immediately close
    const t = window.setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('click', onDocClick);
    };
  }, [menuOpenId]);

  const todayIdx = currentWeekDayIndex();
  const dayIdx = sportCtx.dayIdx;
  const isToday = dayIdx === todayIdx;
  const fromWeek = sportCtx.source === 'semana';
  const editingSports: Sport[] = isToday ? sports : (weekSports[dayIdx] ?? sports);
  const dayLabel = WEEK_DAYS[dayIdx]?.d ?? '';

  const burned = editingSports
    .filter(s => s.on)
    .reduce((a, s) => a + sportKcal(s.kcal, s.min, s.customMin), 0);

  const baseCals = isToday && dayMacros
    ? Math.round(dayMacros.targets.cals - (dayMacros.targets.sport_burn || 0))
    : BASE.cals;
  const newCals = n(baseCals + burned);
  const newP = n(BASE.p + burned * 0.06);
  const newC = n(BASE.c + burned * 0.12);
  const dCals = n(newCals - baseCals);
  const dP = n(newP - BASE.p);
  const dC = n(newC - BASE.c);

  const title = fromWeek
    ? (isToday ? 'Actividad física · Hoy' : `Actividad física · ${dayLabel}`)
    : 'Actividad física de hoy';
  const subtitle = fromWeek && !isToday
    ? 'Se aplicará ese día.'
    : 'Activa, tiempo y tipo.';
  const backScreen = fromWeek ? 'semana' : 'hoy';
  const cta = isToday ? 'Aplicar a hoy' : 'Guardar';

  const emojiIsPreset = EMOJI_OPTIONS.includes(emoji);
  const previewEmoji = emoji || '🏃';

  function resetForm() {
    setEditingId(null);
    setName('');
    setMinutes('45');
    setKcal('300');
    setEmoji('🏃');
    setCustomEmoji('');
    setActivityType('Mixto');
    setFormError('');
  }

  function startEdit(sp: Sport) {
    setMenuOpenId(null);
    setEditingId(sp.id);
    setName(sp.name);
    setMinutes(String(sp.min));
    setKcal(String(sp.kcal));
    setEmoji(sp.emoji || '🏃');
    setCustomEmoji(EMOJI_OPTIONS.includes(sp.emoji) ? '' : sp.emoji);
    setActivityType(sp.activityType || 'Mixto');
    setFormError('');
    setShowForm(true);
  }

  function pickPreset(e: string) {
    setEmoji(e);
    setCustomEmoji('');
  }

  function onCustomEmojiChange(raw: string) {
    setCustomEmoji(raw);
    const token = firstEmojiToken(raw);
    if (token) setEmoji(token);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Pon un nombre.');
      return;
    }
    const min = Number(minutes);
    const burn = Number(kcal);
    if (!Number.isFinite(min) || min < 1) {
      setFormError('Mínimo 1 minuto.');
      return;
    }
    if (!Number.isFinite(burn) || burn < 1) {
      setFormError('Indica las kcal.');
      return;
    }
    const icon = firstEmojiToken(customEmoji) || emoji || '🏃';
    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        min,
        kcal: burn,
        emoji: icon,
        activityType: activityType || undefined,
      };
      if (editingId) {
        await updateSportActivity(editingId, payload);
      } else {
        await addCustomSport(payload);
      }
      resetForm();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenPage>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <BackButton onClick={() => go(backScreen)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 800, letterSpacing: -0.4 }}>
            {title}
          </div>
          <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 500, marginTop: 4 }}>
            {subtitle}
          </div>
        </div>
      </div>

      <div data-tutorial="sport-objetivo" style={{ background: color.ink, borderRadius: radius['2xl'], padding: 20, color: color.white, marginTop: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.65)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: color.success,
            boxShadow: '0 0 0 4px rgba(91,146,121,.25)',
          }} />
          {isToday ? 'OBJETIVO · HOY' : `PLAN · ${dayLabel.toUpperCase()}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 12 }}>
          <div style={{ fontFamily: font.display, fontSize: 42, fontWeight: 900, lineHeight: 1 }}>
            {newCals}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.55)', paddingBottom: 6 }}>
            kcal
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 13, fontWeight: 800,
            color: color.successSoft, background: 'rgba(91,146,121,.22)',
            padding: '5px 11px', borderRadius: radius.pill,
          }}>
            {dCals >= 0 ? '+' : ''}{dCals}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: radius.sm, padding: '11px 12px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Proteína</div>
            <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {newP}g <span style={{ fontSize: 11, color: color.successSoft }}>{dP >= 0 ? '+' : ''}{dP}</span>
            </div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: radius.sm, padding: '11px 12px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Carbos</div>
            <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {newC}g <span style={{ fontSize: 11, color: color.successSoft }}>{dC >= 0 ? '+' : ''}{dC}</span>
            </div>
          </div>
        </div>
      </div>

      <SectionTitle style={{ margin: '24px 2px 12px', fontSize: 16 }}>
        {isToday ? 'Actividad de hoy' : `Actividad · ${dayLabel}`}
      </SectionTitle>
      <div data-tutorial="sport-lista" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {editingSports.map(sp => {
          const effectiveMin = sp.customMin ?? sp.min;
          const effectiveKcal = sportKcal(sp.kcal, sp.min, sp.customMin);
          return (
            <div
              key={sp.id}
              style={{
                background: sp.on ? '#fff' : '#f7f2ea', borderRadius: 20,
                boxShadow: '0 3px 12px rgba(80,60,40,.04)',
                overflow: menuOpenId === sp.id ? 'visible' : 'hidden',
                position: 'relative',
                zIndex: menuOpenId === sp.id ? 5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{sp.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{sp.name}</div>
                  <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500 }}>
                    {effectiveMin} min · {sp.on ? `+${effectiveKcal} kcal` : `${sp.min} min · ${sp.kcal} kcal base`}
                  </div>
                </div>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    type="button"
                    aria-label={`Opciones de ${sp.name}`}
                    aria-expanded={menuOpenId === sp.id}
                    onClick={e => {
                      e.stopPropagation();
                      setMenuOpenId(prev => (prev === sp.id ? null : sp.id));
                    }}
                    style={{
                      width: 32, height: 32, borderRadius: 10,
                      border: 'none', background: 'transparent',
                      color: '#b0a498', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                      <circle cx="8" cy="13" r="1.5" fill="currentColor" />
                    </svg>
                  </button>
                  {menuOpenId === sp.id && (
                    <div
                      role="menu"
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: 4,
                        minWidth: 140,
                        background: color.surface,
                        borderRadius: 14,
                        boxShadow: '0 8px 24px rgba(80,60,40,.16)',
                        border: `1px solid ${color.borderWarm}`,
                        padding: 6,
                        zIndex: 30,
                      }}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpenId(null);
                          startEdit(sp);
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '10px 12px', borderRadius: 10,
                          fontSize: 13.5, fontWeight: 700, color: color.ink,
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpenId(null);
                          void removeCustomSport(sp.id);
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '10px 12px', borderRadius: 10,
                          fontSize: 13.5, fontWeight: 700, color: color.primaryDeep,
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-pressed={sp.on}
                  aria-label={sp.on ? `Desactivar ${sp.name}` : `Activar ${sp.name}`}
                  onClick={() => toggleSport(sp.id)}
                  style={{
                    width: 46, height: 28, borderRadius: 99, position: 'relative',
                    background: sp.on ? '#18bd73' : '#d8d0c4',
                    flexShrink: 0, border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'background .2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: sp.on ? 22 : 2,
                    width: 24, height: 24, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s',
                    pointerEvents: 'none',
                  }} />
                </button>
              </div>

              {sp.on && (
                <div
                  style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid #f0e8df',
                    display: 'flex', flexDirection: 'column', gap: 14,
                  }}
                >
                  <div style={{ paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
                      Duración
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <DurationField
                        sportId={sp.id}
                        value={effectiveMin}
                        onCommit={setSportDuration}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#9a9087' }}>minutos</span>
                      <div style={{
                        marginLeft: 'auto', fontSize: 13, fontWeight: 800,
                        color: '#18bd73', background: '#edf9f3',
                        padding: '6px 12px', borderRadius: 99,
                      }}>
                        +{effectiveKcal} kcal
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
                      Tipo de actividad
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {ACTIVITY_TYPES.map(type => {
                        const sel = sp.activityType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={sel}
                            onClick={() => setSportActivityType(sp.id, type)}
                            style={{
                              fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 99,
                              cursor: 'pointer', transition: 'all .15s',
                              border: sel ? '2px solid #ff6a3d' : '2px solid #f0e8df',
                              background: sel ? '#fff4f0' : '#fff',
                              color: sel ? '#e0512c' : '#4a4038',
                            }}
                          >
                            {sel && '✓ '}{type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{
            ...secondaryBtnStyle(),
            marginTop: 16,
            width: '100%',
            borderRadius: 20,
            borderStyle: 'dashed',
            padding: 15,
          }}
        >
          + Añadir actividad
        </button>
      ) : (
        <div style={{
          marginTop: 16,
          background: color.surface,
          borderRadius: 20,
          padding: 16,
          border: `1.5px solid ${color.border}`,
        }}>
          <div style={{ fontFamily: font.display, fontSize: 17, fontWeight: 800, marginBottom: 12 }}>
            {editingId ? 'Editar actividad' : 'Nueva actividad'}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>
            Nombre
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej. Pádel, Natación, Yoga…"
            style={{ ...inputStyle, marginBottom: 12 }}
          />

          <div style={{ fontSize: 12, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>
            Icono
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, background: color.primarySoft,
              border: `2px solid ${color.primary}`,
            }}>
              {previewEmoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                type="text"
                value={customEmoji}
                onChange={e => onCustomEmojiChange(e.target.value)}
                placeholder="Pega o escribe un emoji…"
                inputMode="text"
                autoComplete="off"
                style={inputStyle}
              />
              <div style={{ fontSize: 11.5, color: color.textMuted, fontWeight: 500, marginTop: 5 }}>
                Icono (elige o escribe)
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => pickPreset(e)}
                style={{
                  width: 40, height: 40, borderRadius: 12, fontSize: 20,
                  border: emojiIsPreset && emoji === e ? `2px solid ${color.primary}` : `2px solid ${color.border}`,
                  background: emojiIsPreset && emoji === e ? color.primarySoft : color.surfaceMuted,
                  cursor: 'pointer',
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>
                Duración (min)
              </div>
              <input
                type="number"
                min={1}
                max={480}
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>
                Kcal estimadas
              </div>
              <input
                type="number"
                min={1}
                max={5000}
                value={kcal}
                onChange={e => setKcal(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>
            Tipo
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
            {ACTIVITY_TYPES.map(type => {
              const sel = activityType === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => setActivityType(sel ? '' : type)}
                  style={{
                    fontSize: 13, fontWeight: 700, padding: '7px 14px', borderRadius: 99,
                    cursor: 'pointer',
                    border: sel ? `2px solid ${color.primary}` : `2px solid ${color.border}`,
                    background: sel ? color.primarySoft : color.white,
                    color: sel ? color.primaryDeep : color.text,
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {formError && (
            <div style={{ fontSize: 13, fontWeight: 600, color: color.primaryDeep, marginBottom: 10 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              style={{ ...secondaryBtnStyle(), flex: 1, borderRadius: 16, padding: 14 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{
                ...primaryBtnStyle({ padding: 14, disabled: saving }),
                flex: 1,
                borderRadius: 16,
              }}
            >
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => go(backScreen)}
        style={{
          ...primaryBtnStyle({ padding: 17 }),
          marginTop: 22,
          width: '100%',
          borderRadius: 20,
        }}
      >
        {cta}
      </button>
    </ScreenPage>
  );
}
