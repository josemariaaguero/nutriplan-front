import { useState } from 'react';
import { useAppState, useAppActions } from '../store';
import type { User } from '../types';
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../notificationPrefs';
import PhoneSheet from './PhoneSheet';
import { color, font, goalColors, radius, cardStyle, primaryBtnStyle, secondaryBtnStyle, gradient, shadow, chipStyle, inputStyle } from '../theme';
import { Avatar, IconLeaf, ScreenPage, SectionTitle } from './ui';
import { useShellMode } from '../shellContext';
import { useAssistantUi } from '../assistantUi';
import { useTutorials } from '../tutorials';
import type { TutorialId } from '../tutorials';

const GOALS_OPTIONS = ['Perder grasa', 'Ganar músculo', 'Mejorar resistencia', 'Tonificar', 'Mantenimiento'];
const ALLERGIES_OPTIONS = ['Gluten', 'Lactosa', 'Frutos secos', 'Huevo', 'Soja', 'Marisco', 'Cacahuetes'];
const DIET_OPTIONS = ['Omnívora', 'Vegetariana', 'Vegana', 'Flexitariana', 'Sin gluten', 'Sin lácteos'];
const ACTIVITY_OPTIONS = ['Sedentario', 'Ligeramente activo', 'Moderadamente activo', 'Muy activo'];

type EditMode = 'none' | 'personal' | 'allergies' | 'notifications';

function sortedKey(list: string[]): string {
  return [...list].map(s => s.toLowerCase()).sort().join('|');
}

/** True when saved fields affect meal plan generation. */
function planConfigChanged(prev: User, next: User): boolean {
  return (
    prev.weight !== next.weight
    || prev.dietType !== next.dietType
    || prev.activityLevel !== next.activityLevel
    || sortedKey(prev.goals) !== sortedKey(next.goals)
    || sortedKey(prev.allergies) !== sortedKey(next.allergies)
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ fontFamily: font.display, fontSize: 19, fontWeight: 800, letterSpacing: -0.3, paddingRight: 8 }}>
        {title}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          width: 36, height: 36, borderRadius: '50%', background: color.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, cursor: 'pointer', color: color.textMuted, lineHeight: 1,
          boxShadow: shadow.sm, flexShrink: 0, border: 'none',
        }}
      >
        ✕
      </button>
    </div>
  );
}

function RegeneratePlanModal({
  onConfirm,
  onCancel,
  busy,
  reason = 'prefs',
}: {
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  reason?: 'prefs' | 'manual';
}) {
  const copy = reason === 'manual'
    ? {
        title: '¿Plan nuevo?',
        body: 'Se reemplazará el plan de 7 días.',
        confirm: 'Regenerar',
        footer: '',
      }
    : {
        title: '¿Actualizar semana?',
        body: '¿Regeneramos con tus cambios?',
        confirm: 'Regenerar',
        footer: 'También en Perfil → Cuenta.',
      };

  return (
    <PhoneSheet onClose={busy ? undefined : onCancel} maxHeight="50%">
      <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 18, margin: '0 auto 14px',
          background: gradient.avatar,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color.white, boxShadow: shadow.avatar,
        }}>
          <IconLeaf />
        </div>
        <div style={{ fontFamily: font.display, fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>
          {copy.title}
        </div>
        <div style={{
          fontSize: 14, color: color.textMuted, fontWeight: 500, marginTop: 10,
          lineHeight: 1.45, padding: '0 6px',
        }}>
          {copy.body}
        </div>
      </div>

      <button
        type="button"
        onClick={() => { if (!busy) onConfirm(); }}
        disabled={busy}
        style={{
          ...primaryBtnStyle({ disabled: busy }),
          marginTop: 22, width: '100%',
          opacity: busy ? 0.75 : 1,
        }}
      >
        {busy ? 'Generando…' : copy.confirm}
      </button>
      <button
        type="button"
        onClick={() => { if (!busy) onCancel(); }}
        disabled={busy}
        style={{
          ...secondaryBtnStyle(),
          marginTop: 10, width: '100%',
          opacity: busy ? 0.5 : 1,
        }}
      >
        Cancelar
      </button>
      {copy.footer ? (
        <div style={{
          fontSize: 12, color: color.textSoft, fontWeight: 500, textAlign: 'center',
          marginTop: 12, lineHeight: 1.4,
        }}>
          {copy.footer}
        </div>
      ) : null}
    </PhoneSheet>
  );
}

function EditPersonalPanel({ user, onSave, onClose }: { user: User; onSave: (u: User) => void; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [height, setHeight] = useState(user.height ? String(user.height) : '');
  const [weight, setWeight] = useState(user.weight ? String(user.weight) : '');
  const [dietType, setDietType] = useState(user.dietType);
  const [activityLevel, setActivityLevel] = useState(user.activityLevel);
  const [goals, setGoals] = useState<string[]>(user.goals);

  function toggleGoal(g: string) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function handleSave() {
    const w = parseFloat(weight) || 0;
    onSave({
      ...user,
      name: name.trim() || user.name,
      age: parseInt(age) || 0,
      height: parseInt(height) || 0,
      weight: w,
      targetWeight: w,
      dietType,
      activityLevel,
      goals,
    });
  }

  const fieldInput = inputStyle;
  const fieldChip = (active: boolean) => ({ ...chipStyle(active), padding: '8px 14px', fontSize: 13 });

  return (
    <PhoneSheet onClose={onClose}>
      <SheetHeader title="Datos personales" onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>Nombre</div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" style={fieldInput} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>Edad</div>
            <input type="number" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} placeholder="—" style={fieldInput} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>Altura (cm)</div>
            <input type="number" inputMode="numeric" value={height} onChange={e => setHeight(e.target.value)} placeholder="—" style={fieldInput} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 7 }}>Peso (kg)</div>
          <input type="number" inputMode="decimal" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="—" style={fieldInput} />
          <div style={{ fontSize: 11.5, color: '#b8aea2', fontWeight: 500, marginTop: 6 }}>
            Solo para calcular kcal.
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>Enfoque del plan</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {GOALS_OPTIONS.map(g => (
              <span key={g} onClick={() => toggleGoal(g)} style={fieldChip(goals.includes(g))}>
                {goals.includes(g) && '✓ '}{g}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>Tipo de dieta</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {DIET_OPTIONS.map(d => (
              <span key={d} onClick={() => setDietType(d)} style={fieldChip(dietType === d)}>
                {dietType === d && '✓ '}{d}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>Nivel de actividad</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ACTIVITY_OPTIONS.map(a => (
              <div
                key={a}
                onClick={() => setActivityLevel(a)}
                style={{
                  padding: '11px 14px', borderRadius: 14, cursor: 'pointer',
                  border: activityLevel === a ? '2px solid #ff6a3d' : '2px solid #f0e8df',
                  background: activityLevel === a ? '#fff4f0' : '#fff',
                  fontSize: 14, fontWeight: 600, color: activityLevel === a ? '#e0512c' : '#2a2520',
                }}
              >
                {activityLevel === a && '✓ '}{a}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        style={{ ...primaryBtnStyle(), marginTop: 20, width: '100%' }}
      >
        Guardar cambios
      </button>
    </PhoneSheet>
  );
}

function EditAllergiesPanel({ user, onSave, onClose }: { user: User; onSave: (u: User) => void; onClose: () => void }) {
  const [allergies, setAllergies] = useState<string[]>(user.allergies);

  function toggle(a: string) {
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  function handleSave() {
    onSave({ ...user, allergies });
  }

  return (
    <PhoneSheet onClose={onClose} maxHeight="85%">
      <SheetHeader title="Alergias e intolerancias" onClose={onClose} />
      <div style={{ fontSize: 13.5, color: '#9a9087', fontWeight: 500, marginBottom: 16 }}>
        El plan evitará estos ingredientes.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALLERGIES_OPTIONS.map(a => {
          const sel = allergies.includes(a);
          return (
            <div
              key={a}
              onClick={() => toggle(a)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                border: sel ? '2px solid #ff6a3d' : '2px solid #f0e8df',
                background: sel ? '#fff4f0' : '#fff',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: sel ? '#e0512c' : '#2a2520' }}>{a}</span>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: sel ? '#ff6a3d' : '#f0e8df',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 800,
              }}>
                {sel ? '✓' : ''}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        style={{ ...primaryBtnStyle(), marginTop: 20, width: '100%' }}
      >
        Guardar
      </button>
    </PhoneSheet>
  );
}

function EditNotificationsPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadNotificationPrefs());
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof NotificationPrefs) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    saveNotificationPrefs(prefs);
    setSaved(true);
    setTimeout(onClose, 450);
  }

  const rows: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'mealReminders', label: 'Recordatorios de comidas', desc: 'Avisos para desayuno, almuerzo y cena' },
    { key: 'weeklyPlan', label: 'Plan semanal listo', desc: 'Cuando se genere una nueva semana' },
    { key: 'sportSync', label: 'Actividad física', desc: 'Cuando se sincronice ejercicio desde apps de salud' },
    { key: 'tips', label: 'Consejos de nutrición', desc: 'Tips ocasionales para mejorar tu plan' },
  ];

  return (
    <PhoneSheet onClose={onClose} maxHeight="85%">
      <SheetHeader title="Notificaciones" onClose={onClose} />
      <div style={{ fontSize: 13.5, color: '#9a9087', fontWeight: 500, marginBottom: 16 }}>
        Elige qué avisos recibir.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(row => {
          const on = prefs[row.key];
          return (
            <div
              key={row.key}
              onClick={() => toggle(row.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                border: on ? '2px solid #ff6a3d' : '2px solid #f0e8df',
                background: on ? '#fff4f0' : '#fff',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: on ? '#e0512c' : '#2a2520' }}>
                  {row.label}
                </div>
                <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500, marginTop: 2 }}>
                  {row.desc}
                </div>
              </div>
              <div style={{
                width: 46, height: 28, borderRadius: 99, flexShrink: 0,
                background: on ? '#ff6a3d' : '#e8dcd0',
                position: 'relative', transition: 'background 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: 3,
                  width: 22, height: 22, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,.15)',
                  transform: on ? 'translate3d(18px, 0, 0)' : 'translate3d(0, 0, 0)',
                  transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        style={{ ...primaryBtnStyle(), marginTop: 20, width: '100%' }}
      >
        {saved ? 'Guardado' : 'Guardar'}
      </button>
    </PhoneSheet>
  );
}

export default function PerfilScreen({ onShowLegal }: { onShowLegal?: () => void }) {
  const { user } = useAppState();
  const { go, openHistory, updateUser, logout, generateWeek } = useAppActions();
  const shell = useShellMode();
  const assistantUi = useAssistantUi();
  const {
    catalog,
    startTutorial,
    resetTutorialProgress,
    resetAllTutorialProgress,
    isCompleted,
  } = useTutorials();
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenReason, setRegenReason] = useState<'prefs' | 'manual'>('prefs');
  const [generating, setGenerating] = useState(false);
  const [completedTutorialsOpen, setCompletedTutorialsOpen] = useState(false);

  const pendingTutorials = catalog.filter(t => !isCompleted(t.id as TutorialId));
  const completedTutorials = catalog.filter(t => isCompleted(t.id as TutorialId));

  const initial = user.name.charAt(0).toUpperCase();

  function openAssistantEntry() {
    if (shell === 'web') assistantUi.openAssistant();
    else go('asistente');
  }

  function handlePlanRelatedSave(next: User) {
    const shouldPrompt = planConfigChanged(user, next);
    void (async () => {
      await updateUser(next);
      setEditMode('none');
      if (shouldPrompt) {
        setRegenReason('prefs');
        setShowRegenModal(true);
      }
    })();
  }

  async function handleConfirmRegen() {
    if (generating) return;
    setGenerating(true);
    try {
      await generateWeek();
      setShowRegenModal(false);
      go('semana');
    } catch {
      setShowRegenModal(false);
    } finally {
      setGenerating(false);
    }
  }

  function handleGenerateFromAccount() {
    if (generating) return;
    setRegenReason('manual');
    setShowRegenModal(true);
  }

  return (
    <ScreenPage>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar initial={initial} size={70} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 800, letterSpacing: -0.4 }}>
            {user.name}
          </div>
          <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 600, marginTop: 2 }}>
            Plan del día
          </div>
        </div>
      </div>

      {/* Goals */}
      {user.goals.length > 0 && (
        <>
          <SectionTitle style={{ fontSize: 16 }}>Enfoque del plan</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {user.goals.map((g, i) => (
              <span key={i} style={{
                fontSize: 13.5, fontWeight: 700, color: color.white,
                background: goalColors[i % goalColors.length],
                padding: '9px 15px', borderRadius: radius.pill,
              }}>
                {g}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Data list */}
      <SectionTitle style={{ fontSize: 16 }}>Mis datos</SectionTitle>
      <div data-tutorial="perfil-datos" style={{ ...cardStyle, overflow: 'hidden' }}>
        {[
          { label: 'Altura', value: user.height ? `${user.height} cm` : '—' },
          { label: 'Edad', value: user.age ? `${user.age} años` : '—' },
          { label: 'Nivel de actividad', value: user.activityLevel || '—' },
          { label: 'Tipo de dieta', value: user.dietType || '—' },
        ].map((item, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? `1px solid ${color.divider}` : undefined,
          }}>
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: color.textMuted, textAlign: 'right', maxWidth: 160 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Allergies */}
      {user.allergies.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.allergies.map((a, i) => (
              <span key={i} style={{
                fontSize: 13, fontWeight: 700, color: color.primaryDeep,
                background: color.primarySoft, padding: '8px 14px', borderRadius: radius.pill,
              }}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferences menu */}
      <SectionTitle style={{ fontSize: 16 }}>Preferencias</SectionTitle>
      <div data-tutorial="perfil-preferencias" style={{ ...cardStyle, overflow: 'hidden' }}>
        {[
          { label: 'Datos personales', action: () => setEditMode('personal') },
          { label: 'Alergias e intolerancias', action: () => setEditMode('allergies') },
          { label: 'Mis recetas', action: () => go('misRecetas') },
          { label: 'Asistente', action: openAssistantEntry },
          { label: 'Sugerencias', action: () => go('sugerencias') },
          ...(user.isSuperadmin
            ? [{ label: 'Bandeja de sugerencias', action: () => go('adminSugerencias') }]
            : []),
          { label: 'Historial', action: () => openHistory(undefined, 'perfil') },
          { label: 'Lista de la compra', action: () => go('compra') },
          { label: 'Aviso legal / cookies', action: () => onShowLegal?.() },
          { label: 'Notificaciones', action: () => setEditMode('notifications') },
        ].map((item, i, arr) => (
          <div
            key={item.label}
            onClick={item.action}
            role="button"
            style={{
              display: 'flex', alignItems: 'center', padding: '15px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${color.divider}` : undefined, cursor: 'pointer',
            }}
          >
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{item.label}</span>
            <svg width="7" height="12" viewBox="0 0 8 14" aria-hidden>
              <path d="M1 1l6 6-6 6" stroke={color.chevron} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Tutorials */}
      <SectionTitle style={{ fontSize: 16 }}>Tutoriales</SectionTitle>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {pendingTutorials.length === 0 ? (
          <div style={{ padding: '16px 16px 14px', fontSize: 13.5, fontWeight: 500, color: color.textMuted }}>
            No te quedan tutoriales pendientes.
          </div>
        ) : (
          pendingTutorials.map((t, idx) => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
                borderBottom: idx < pendingTutorials.length - 1 || completedTutorials.length > 0
                  ? `1px solid ${color.divider}` : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: color.textMuted, marginTop: 2 }}>
                  Pendiente
                </div>
              </div>
              <button
                type="button"
                onClick={() => { void startTutorial(t.id, { force: true }); }}
                style={{
                  fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                  background: color.ink, color: color.white, borderRadius: radius.pill,
                  padding: '8px 12px', flexShrink: 0,
                }}
              >
                Ver
              </button>
            </div>
          ))
        )}

        {completedTutorials.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setCompletedTutorialsOpen(v => !v)}
              aria-expanded={completedTutorialsOpen}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '13px 16px', border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                borderBottom: completedTutorialsOpen ? `1px solid ${color.divider}` : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: color.textBody }}>
                  Completados
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: color.textMuted, marginTop: 2 }}>
                  {completedTutorials.length} tutorial{completedTutorials.length === 1 ? '' : 'es'}
                </div>
              </div>
              <svg
                width="12"
                height="8"
                viewBox="0 0 12 8"
                aria-hidden
                style={{
                  flexShrink: 0,
                  transform: completedTutorialsOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 180ms ease',
                }}
              >
                <path d="M1 1.5l5 5 5-5" stroke={color.chevron} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {completedTutorialsOpen && completedTutorials.map((t, idx) => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
                  borderBottom: idx < completedTutorials.length - 1
                    ? `1px solid ${color.divider}` : undefined,
                  background: color.surfaceMuted,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: color.success, marginTop: 2 }}>
                    Completado
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { void startTutorial(t.id, { force: true }); }}
                  style={{
                    fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                    background: color.ink, color: color.white, borderRadius: radius.pill,
                    padding: '8px 12px', flexShrink: 0,
                  }}
                >
                  Ver
                </button>
                <button
                  type="button"
                  onClick={() => resetTutorialProgress(t.id)}
                  style={{
                    fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: color.surface, color: color.textBody, borderRadius: radius.pill,
                    padding: '8px 10px', flexShrink: 0,
                  }}
                >
                  Reset
                </button>
              </div>
            ))}
          </>
        )}

        {(pendingTutorials.length > 0 || completedTutorials.length > 0) && (
          <div
            onClick={() => {
              if (window.confirm('¿Resetear el progreso de todos los tutoriales?')) {
                resetAllTutorialProgress();
                setCompletedTutorialsOpen(false);
              }
            }}
            role="button"
            style={{
              display: 'flex', alignItems: 'center', padding: '15px 16px', cursor: 'pointer',
              borderTop: `1px solid ${color.divider}`,
            }}
          >
            <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: color.primaryDeep }}>
              Resetear todos los tutoriales
            </span>
          </div>
        )}
      </div>

      {/* Account */}
      <SectionTitle style={{ fontSize: 16 }}>Cuenta</SectionTitle>
      <div data-tutorial="perfil-cuenta" style={{ ...cardStyle, overflow: 'hidden' }}>
        <div
          data-tutorial="perfil-generar-plan"
          onClick={() => { if (!generating) handleGenerateFromAccount(); }}
          role="button"
          aria-busy={generating}
          style={{
            display: 'flex', alignItems: 'center', padding: '15px 16px',
            borderBottom: `1px solid ${color.divider}`,
            cursor: generating ? 'wait' : 'pointer',
            opacity: generating ? 0.7 : 1,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>
              {generating ? 'Generando plan…' : 'Generar nuevo plan'}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: color.textMuted, marginTop: 2 }}>
              Recetas nuevas para la semana
            </div>
          </div>
          <svg width="7" height="12" viewBox="0 0 8 14" aria-hidden>
            <path d="M1 1l6 6-6 6" stroke={color.chevron} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          onClick={logout}
          role="button"
          style={{
            display: 'flex', alignItems: 'center', padding: '15px 16px', cursor: 'pointer',
          }}
        >
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: color.primaryDeep }}>
            Cerrar sesión
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke={color.primaryDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Edit sheets — portaled into phone frame */}
      {editMode === 'personal' && (
        <EditPersonalPanel
          user={user}
          onSave={handlePlanRelatedSave}
          onClose={() => setEditMode('none')}
        />
      )}
      {editMode === 'allergies' && (
        <EditAllergiesPanel
          user={user}
          onSave={handlePlanRelatedSave}
          onClose={() => setEditMode('none')}
        />
      )}
      {editMode === 'notifications' && (
        <EditNotificationsPanel onClose={() => setEditMode('none')} />
      )}

      {showRegenModal && (
        <RegeneratePlanModal
          reason={regenReason}
          busy={generating}
          onConfirm={() => { void handleConfirmRegen(); }}
          onCancel={() => setShowRegenModal(false)}
        />
      )}
    </ScreenPage>
  );
}
