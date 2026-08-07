import { useState } from 'react';
import { chipStyle, inputStyle, color, font, gradient, radius, primaryBtnStyle, secondaryBtnStyle } from '../theme';
import { IconLeaf } from './ui';
import { useShellMode } from '../shellContext';
import {
  DEFAULT_MEAL_REPEAT_POLICY,
  MEAL_REPEAT_OPTIONS,
  type MealRepeatPolicy,
} from '../mealRepeat';

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
  mealRepeatPolicy: MealRepeatPolicy;
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

const TOTAL_STEPS = 4;

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
  const [mealRepeatPolicy, setMealRepeatPolicy] = useState<MealRepeatPolicy>(DEFAULT_MEAL_REPEAT_POLICY);
  const [activityLevel, setActivityLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  function canAdvance() {
    if (step === 1) return age && sex && height && weight;
    if (step === 2) return goals.length > 0 && dietType;
    if (step === 3) return activityLevel;
    return true;
  }

  /** Accept cm (100–250) or meters (1.0–2.5) typed by mistake. */
  function parseHeightCm(raw: string): number | null {
    const cleaned = raw.trim().replace(',', '.');
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (n >= 100 && n <= 250) return Math.round(n);
    if (n >= 1 && n <= 2.5) return Math.round(n * 100);
    return null;
  }

  function parseWeightKg(raw: string): number | null {
    const cleaned = raw.trim().replace(',', '.');
    const n = Number(cleaned);
    if (!Number.isFinite(n) || n < 30 || n > 300) return null;
    return Math.round(n * 10) / 10;
  }

  function validatePhysical(): string | null {
    const ageN = parseInt(age, 10);
    if (!Number.isFinite(ageN) || ageN < 10 || ageN > 120) {
      return 'La edad debe estar entre 10 y 120 años.';
    }
    if (!sex) return 'Selecciona el sexo biológico.';
    if (parseHeightCm(height) == null) {
      return 'La altura debe estar entre 100 y 250 cm (ej. 175).';
    }
    if (parseWeightKg(weight) == null) {
      return 'El peso debe estar entre 30 y 300 kg (ej. 72.5).';
    }
    return null;
  }

  function advance() {
    setLocalError('');
    if (step === 1) {
      const err = validatePhysical();
      if (err) {
        setLocalError(err);
        return;
      }
    }
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
    else void finish();
  }

  async function finish() {
    const physicalErr = validatePhysical();
    if (physicalErr) {
      setLocalError(physicalErr);
      setStep(1);
      return;
    }
    if (goals.length === 0 || !dietType) {
      setLocalError('Elige al menos un objetivo y un tipo de dieta.');
      setStep(2);
      return;
    }
    if (!activityLevel) {
      setLocalError('Selecciona tu nivel de actividad.');
      setStep(3);
      return;
    }

    const heightCm = parseHeightCm(height)!;
    const currentWeight = parseWeightKg(weight)!;
    setLoading(true);
    setLocalError('');
    try {
      await onComplete({
        name, email,
        age: parseInt(age, 10),
        sex: sex || 'female',
        height: heightCm,
        weight: currentWeight,
        targetWeight: currentWeight,
        goals,
        dietType: dietType || 'Omnívora',
        allergies,
        activityLevel: activityLevel || 'Moderadamente activo',
        mealRepeatPolicy,
        healthProviders: {},
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
            Vamos a configurar tu plan personalizado en 3 pasos rápidos.
          </div>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {['Tus datos físicos', 'Objetivos y tipo de dieta', 'Nivel de actividad'].map((t, i) => (
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
                <input type="number" inputMode="numeric" min={10} max={120} value={age}
                  onChange={e => { setAge(e.target.value); setLocalError(''); }}
                  placeholder="31" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4038', marginBottom: 7 }}>Altura (cm)</div>
                <input type="number" inputMode="decimal" min={100} max={250} step={1} value={height}
                  onChange={e => { setHeight(e.target.value); setLocalError(''); }}
                  placeholder="175" style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4a4038', marginBottom: 7 }}>Peso actual (kg)</div>
              <input type="number" inputMode="decimal" min={30} max={300} step="0.1" value={weight}
                onChange={e => { setWeight(e.target.value); setLocalError(''); }}
                placeholder="82" style={inputStyle} />
            </div>
          </div>
        </div>
      )}

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

          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a9087', textTransform: 'uppercase', letterSpacing: 0.4, margin: '24px 0 10px' }}>
            ¿Repetir comidas en la semana?
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MEAL_REPEAT_OPTIONS.map(opt => {
              const sel = mealRepeatPolicy === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setMealRepeatPolicy(opt.id)}
                  style={{
                    background: sel ? '#fff4f0' : '#fff', borderRadius: 18,
                    padding: '14px 16px', cursor: 'pointer',
                    border: sel ? '2px solid #ff6a3d' : '2px solid #f0e8df',
                  }}
                >
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: sel ? '#e0512c' : '#2a2520' }}>
                    {sel && '✓ '}{opt.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500, marginTop: 2, lineHeight: 1.4 }}>
                    {opt.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      <div style={{ flex: 1 }} />

      {(localError || externalError) && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#e0512c', fontWeight: 600 }}>
          {localError || externalError}
        </div>
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
