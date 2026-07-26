import { useState } from 'react';
import type { ReactNode } from 'react';
import { ONBOARDING_HEALTH_ID } from '../healthProviders';
import { chipStyle, inputStyle, color, font, gradient, radius, primaryBtnStyle, secondaryBtnStyle } from '../theme';
import {
  IconApple, IconLeaf, IconRun, IconWatch, IconActivity, IconWave, IconHeartPulse,
} from './ui';
import { useShellMode } from '../shellContext';

interface OnboardingResult {
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
}

interface Props {
  name: string;
  email: string;
  onComplete: (payload: OnboardingResult) => void | Promise<void>;
  error?: string;
}

const GOALS = ['Perder grasa', 'Ganar músculo', 'Mejorar resistencia', 'Tonificar', 'Mantenimiento'];
const DIETS = ['Omnívora', 'Vegetariana', 'Vegana', 'Flexitariana', 'Sin gluten', 'Sin lácteos'];
const ALLERGIES = ['Gluten', 'Lactosa', 'Frutos secos', 'Huevo', 'Soja', 'Marisco', 'Cacahuetes'];
const ACTIVITY = [
  { label: 'Sedentario', desc: 'Trabajo de escritorio, poca actividad' },
  { label: 'Ligeramente activo', desc: 'Camino algo, 1-2 días de ejercicio' },
  { label: 'Moderadamente activo', desc: 'Ejercicio 3-4 días por semana' },
  { label: 'Muy activo', desc: 'Actividad física intensa 5+ días por semana' },
];
const HEALTH_APPS = Object.keys(ONBOARDING_HEALTH_ID);

const TOTAL_STEPS = 5;

export default function OnboardingScreen({ name, email, onComplete, error: externalError }: Props) {
  const shell = useShellMode();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [dietType, setDietType] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState('');
  const [healthApps, setHealthApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  function canAdvance() {
    if (step === 1) return age && sex && height && weight;
    if (step === 2) return goals.length > 0 && dietType;
    if (step === 3) return activityLevel;
    return true;
  }

  function advance() {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else void finish();
  }

  async function finish() {
    const currentWeight = parseFloat(weight) || 70;
    const healthProviders: Record<string, boolean> = {};
    for (const app of healthApps) {
      const id = ONBOARDING_HEALTH_ID[app];
      if (id) healthProviders[id] = true;
    }
    setLoading(true);
    try {
      await onComplete({
        name, email,
        age: parseInt(age) || 30,
        sex: sex || 'female',
        height: parseInt(height) || 170,
        weight: currentWeight,
        targetWeight: currentWeight,
        goals,
        dietType: dietType || 'Omnívora',
        allergies,
        activityLevel: activityLevel || 'Moderadamente activo',
        healthProviders,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      padding: shell === 'web' ? '36px 24px 40px' : '52px 24px 100px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
    }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 5, borderRadius: radius.pill,
              background: i <= step ? color.primary : color.border,
              transition: 'background .3s',
            }}
          />
        ))}
      </div>

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 16px',
            background: gradient.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color.white,
          }}>
            <IconLeaf />
          </div>
          <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
            ¡Hola, {name}!
          </div>
          <div style={{ fontSize: 16, color: color.textMuted, fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>
            Vamos a configurar tu plan personalizado en 4 pasos rápidos.
          </div>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {['Tus datos físicos', 'Objetivos y tipo de dieta', 'Nivel de actividad', 'Apps de salud (opcional)'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: gradient.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: color.white, fontWeight: 800, fontSize: 14, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Datos físicos */}
      {step === 1 && (
        <div>
          <div style={{ fontFamily: "'Nunito'", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Tus datos físicos
          </div>
          <div style={{ fontSize: 13.5, color: '#9a9087', fontWeight: 500, marginBottom: 24 }}>
            Necesarios para calcular tus necesidades calóricas exactas.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4038', marginBottom: 7 }}>Sexo biológico</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { id: 'female' as const, label: 'Mujer' },
                  { id: 'male' as const, label: 'Hombre' },
                ]).map(opt => (
                  <span key={opt.id} onClick={() => setSex(opt.id)} style={{ ...chipStyle(sex === opt.id), flex: 1, justifyContent: 'center' }}>
                    {sex === opt.id && '✓ '}{opt.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4038', marginBottom: 7 }}>Edad</div>
                <input type="number" value={age} onChange={e => setAge(e.target.value)}
                  placeholder="31" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4038', marginBottom: 7 }}>Altura (cm)</div>
                <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                  placeholder="175" style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4038', marginBottom: 7 }}>Peso actual (kg)</div>
              <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="82" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Objetivos y dieta */}
      {step === 2 && (
        <div>
          <div style={{ fontFamily: "'Nunito'", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Objetivos y dieta
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.4, margin: '18px 0 10px' }}>
            ¿Qué quieres conseguir?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map(g => (
              <span key={g} onClick={() => toggleItem(goals, setGoals, g)} style={chipStyle(goals.includes(g))}>
                {goals.includes(g) && '✓ '}{g}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.4, margin: '24px 0 10px' }}>
            Tipo de alimentación
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DIETS.map(d => (
              <span key={d} onClick={() => setDietType(d)} style={chipStyle(dietType === d)}>
                {dietType === d && '✓ '}{d}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.4, margin: '24px 0 10px' }}>
            Alergias e intolerancias
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALLERGIES.map(a => (
              <span key={a} onClick={() => toggleItem(allergies, setAllergies, a)} style={chipStyle(allergies.includes(a))}>
                {allergies.includes(a) && '✓ '}{a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Nivel de actividad */}
      {step === 3 && (
        <div>
          <div style={{ fontFamily: "'Nunito'", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Nivel de actividad
          </div>
          <div style={{ fontSize: 13.5, color: '#9a9087', fontWeight: 500, marginBottom: 20 }}>
            Selecciona el que mejor describe tu día a día.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {ACTIVITY.map(a => {
              const sel = activityLevel === a.label;
              return (
                <div
                  key={a.label}
                  onClick={() => setActivityLevel(a.label)}
                  style={{
                    background: sel ? '#fff4f0' : '#fff', borderRadius: 20,
                    padding: '16px 18px', cursor: 'pointer',
                    border: sel ? '2px solid #ff6a3d' : '2px solid #f0e8df',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: sel ? '#e0512c' : '#2a2520' }}>
                    {sel && '✓ '}{a.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500, marginTop: 2 }}>
                    {a.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Apps de salud (opcional) */}
      {step === 4 && (
        <div>
          <div style={{ fontFamily: "'Nunito'", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Apps de salud
          </div>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 800,
            background: '#f0e8df', color: '#9a7a63', padding: '4px 12px',
            borderRadius: 99, marginBottom: 14,
          }}>
            OPCIONAL
          </div>
          <div style={{ fontSize: 13.5, color: '#9a9087', fontWeight: 500, marginBottom: 20 }}>
            Elige las apps que te interesan. No se conectan aún: podrás autorizarlas después en Salud.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {HEALTH_APPS.map(app => {
              const icons: Record<string, ReactNode> = {
                'Apple Health': <IconApple />,
                'Google Fit': <IconRun />,
                'Garmin Connect': <IconWatch />,
                'Strava': <IconActivity />,
                'Fitbit': <IconWave />,
                'Samsung Health': <IconHeartPulse />,
              };
              const sel = healthApps.includes(app);
              return (
                <div
                  key={app}
                  onClick={() => toggleItem(healthApps, setHealthApps, app)}
                  role="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: sel ? color.chipActiveBg : color.surface, borderRadius: radius.lg,
                    padding: '14px 16px', cursor: 'pointer',
                    border: sel ? `2px solid ${color.primary}` : `2px solid ${color.border}`,
                    transition: 'background .2s ease, border-color .2s ease',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: sel ? color.primarySoft : color.surfaceMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sel ? color.primary : color.textMuted,
                  }}>
                    {icons[app]}
                  </div>
                  <div style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: sel ? color.primaryDeep : color.text }}>
                    {app}
                  </div>
                  {sel && <div style={{ fontSize: 16, fontWeight: 800, color: color.primary }}>✓</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Navigation */}
      {externalError && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#e0512c', fontWeight: 600 }}>{externalError}</div>
      )}
      <div style={{ marginTop: 32, display: 'flex', gap: 10 }}>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            style={{ ...secondaryBtnStyle(), flex: 1, borderRadius: 20, padding: 17, fontSize: 16 }}
          >
            Atrás
          </button>
        )}
        <button
          type="button"
          onClick={canAdvance() && !loading ? advance : undefined}
          disabled={!canAdvance() || loading}
          style={{
            ...primaryBtnStyle({ disabled: !canAdvance() || loading, padding: 17 }),
            flex: 2, borderRadius: 20,
          }}
        >
          {loading ? 'Guardando…' : step === TOTAL_STEPS - 1 ? 'Empezar mi plan' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
