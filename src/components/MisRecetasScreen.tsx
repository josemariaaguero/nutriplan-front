import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createMyRecipe,
  deleteMyRecipe,
  fetchMyRecipes,
  lookupIngredientNutrition,
  updateMyRecipe,
  type UserRecipeApi,
} from '../api';
import { useAppActions } from '../store';
import { color, cardStyle, chipStyle, inputStyle, radius } from '../theme';
import { Btn, EmptyState, FieldLabel, Notice, ScreenHeader, ScreenPage, SectionTitle } from './ui';
import type { Ingredient } from '../types';

const SLOTS = ['Desayuno', 'Almuerzo', 'Snack', 'Cena'];
const EMOJIS = ['🍽️', '🥗', '🍲', '🍳', '🥑', '🥩', '🐟', '🍜', '🥪', '🥣'];

/** Form row: macros are entered per 100 g (as on packaging), then scaled by grams. */
type IngForm = {
  n: string;
  g: number;
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
};

const MACRO_100_FIELDS: { key: keyof Pick<IngForm, 'kcal100' | 'p100' | 'c100' | 'f100'>; label: string }[] = [
  { key: 'kcal100', label: 'kcal/100g' },
  { key: 'p100', label: 'Prot/100g' },
  { key: 'c100', label: 'Carb/100g' },
  { key: 'f100', label: 'Gras/100g' },
];

function round1(n: number) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

/** Controlled number input: keep legitimate zeros visible (e.g. carbs in chicken). */
function numInputValue(n: number) {
  return Number.isFinite(n) ? String(n) : '';
}

function scaleFrom100(per100: number, grams: number) {
  const g = Number(grams) || 0;
  return (Number(per100) || 0) * (g / 100);
}

function emptyIng(): IngForm {
  return { n: '', g: 100, kcal100: 0, p100: 0, c100: 0, f100: 0 };
}

/** Reverse absolute stored macros → per-100g for editing. */
function fromStoredIngredient(ing: Ingredient): IngForm {
  const g = Number(ing.g) || 100;
  const factor = g > 0 ? 100 / g : 1;
  return {
    n: ing.n || '',
    g,
    kcal100: round1((Number(ing.kcal) || 0) * factor),
    p100: round1((Number(ing.p) || 0) * factor),
    c100: round1((Number(ing.c) || 0) * factor),
    f100: round1((Number(ing.f) || 0) * factor),
  };
}

function toStoredIngredient(ing: IngForm): Ingredient {
  const g = Number(ing.g) || 0;
  return {
    n: ing.n.trim(),
    g,
    kcal: Math.round(scaleFrom100(ing.kcal100, g)),
    p: round1(scaleFrom100(ing.p100, g)),
    c: round1(scaleFrom100(ing.c100, g)),
    f: round1(scaleFrom100(ing.f100, g)),
  };
}

function scaledPreview(ing: IngForm) {
  const g = Number(ing.g) || 0;
  return {
    kcal: Math.round(scaleFrom100(ing.kcal100, g)),
    p: round1(scaleFrom100(ing.p100, g)),
    c: round1(scaleFrom100(ing.c100, g)),
    f: round1(scaleFrom100(ing.f100, g)),
  };
}

function totals(ings: IngForm[]) {
  const scaled = ings.map(scaledPreview);
  return {
    kcal: Math.round(scaled.reduce((a, i) => a + i.kcal, 0)),
    p: round1(scaled.reduce((a, i) => a + i.p, 0)),
    c: round1(scaled.reduce((a, i) => a + i.c, 0)),
    f: round1(scaled.reduce((a, i) => a + i.f, 0)),
  };
}

export default function MisRecetasScreen() {
  const { go } = useAppActions();
  const [recipes, setRecipes] = useState<UserRecipeApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [slot, setSlot] = useState('Almuerzo');
  const [emoji, setEmoji] = useState('🍽️');
  const [ingredients, setIngredients] = useState<IngForm[]>([emptyIng()]);
  const [stepsText, setStepsText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lookupIdx, setLookupIdx] = useState<number | null>(null);
  const [lookupHint, setLookupHint] = useState('');
  const ingredientsRef = useRef(ingredients);
  ingredientsRef.current = ingredients;

  const preview = useMemo(() => totals(ingredients), [ingredients]);

  function patchIngredient(idx: number, patch: Partial<IngForm>) {
    setIngredients(prev => {
      const next = [...prev];
      next[idx] = { ...(next[idx] || emptyIng()), ...patch };
      return next;
    });
  }

  async function fillMacros(idx: number, nameOverride?: string) {
    const name = (nameOverride ?? ingredientsRef.current[idx]?.n ?? '').trim();
    if (!name) {
      setLookupHint('Escribe el nombre del alimento primero');
      return;
    }
    setLookupIdx(idx);
    setLookupHint('');
    setError('');
    try {
      const data = await lookupIngredientNutrition(name, 100);
      const per = data.per_100g;
      const label = data.name || name;
      setIngredients(prev => {
        const next = [...prev];
        const current = next[idx] || emptyIng();
        next[idx] = {
          ...current,
          n: label,
          kcal100: round1(per?.kcal ?? data.kcal),
          p100: round1(per?.p ?? data.p),
          c100: round1(per?.c ?? data.c),
          f100: round1(per?.f ?? data.f),
        };
        return next;
      });
      const src = data.source === 'local' ? 'catálogo' : data.source;
      setLookupHint(`Macros de «${label}» (${src})`);
    } catch {
      setLookupHint('No encontramos macros. Introdúcelas a mano.');
    } finally {
      setLookupIdx(null);
    }
  }

  async function reload() {
    setLoading(true);
    try {
      setRecipes(await fetchMyRecipes());
    } catch {
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    const id = window.setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', close);
    };
  }, [menuOpenId]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setSlot('Almuerzo');
    setEmoji('🍽️');
    setIngredients([emptyIng()]);
    setStepsText('');
    setError('');
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(r: UserRecipeApi) {
    setEditingId(r.id);
    setName(r.name);
    setSlot(r.preferred_slot || 'Almuerzo');
    setEmoji(r.emoji || '🍽️');
    setIngredients(
      r.ingredients?.length ? r.ingredients.map(fromStoredIngredient) : [emptyIng()],
    );
    setStepsText((r.steps || []).join('\n'));
    setError('');
    setShowForm(true);
    setMenuOpenId(null);
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Pon un nombre a la receta');
      return;
    }
    const ings = ingredients.filter(i => i.n.trim()).map(toStoredIngredient);
    if (!ings.length) {
      setError('Añade al menos un ingrediente');
      return;
    }
    const savedTotals = {
      kcal: Math.round(ings.reduce((a, i) => a + (Number(i.kcal) || 0), 0)),
      p: round1(ings.reduce((a, i) => a + (Number(i.p) || 0), 0)),
      c: round1(ings.reduce((a, i) => a + (Number(i.c) || 0), 0)),
      f: round1(ings.reduce((a, i) => a + (Number(i.f) || 0), 0)),
    };
    setSaving(true);
    setError('');
    try {
      const steps = stepsText.split('\n').map(s => s.trim()).filter(Boolean);
      const body = {
        name: trimmed,
        preferred_slot: slot,
        emoji,
        ingredients: ings,
        steps,
        ...savedTotals,
      };
      if (editingId != null) {
        await updateMyRecipe(editingId, body);
      } else {
        await createMyRecipe(body);
      }
      setShowForm(false);
      resetForm();
      await reload();
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setMenuOpenId(null);
    try {
      await deleteMyRecipe(id);
      await reload();
    } catch {
      /* ignore */
    }
  }

  return (
    <ScreenPage>
      <div data-tutorial="mis-recetas-lista">
      <ScreenHeader title="Mis recetas" subtitle="Tus platos para el menú" onBack={() => go('perfil')} />

      {!showForm && (
        <Btn onClick={startCreate} style={{ margin: '0 0 18px' }}>
          Nueva receta
        </Btn>
      )}

      {showForm && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 18 }}>
          <SectionTitle style={{ fontSize: 15, marginTop: 0 }}>
            {editingId != null ? 'Editar' : 'Nueva'}
          </SectionTitle>
          <FieldLabel>Nombre</FieldLabel>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 12 }} />

          <FieldLabel>Icono</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  width: 40, height: 40, borderRadius: radius.sm,
                  border: emoji === e ? `2px solid ${color.primary}` : `2px solid ${color.border}`,
                  background: emoji === e ? color.primarySoft : color.surfaceMuted, cursor: 'pointer', fontSize: 18,
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <FieldLabel>Comida</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {SLOTS.map(s => (
              <button key={s} type="button" onClick={() => setSlot(s)} style={chipStyle(slot === s)}>
                {s}
              </button>
            ))}
          </div>

          <FieldLabel>Ingredientes</FieldLabel>
          <Notice>
            Macros <strong style={{ color: color.ink }}>por 100 g</strong>.
            Usa «Rellenar» para verdura, carne y alimentos comunes.
          </Notice>
          {lookupHint && (
            <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 600, marginBottom: 8 }}>
              {lookupHint}
            </div>
          )}
          {ingredients.map((ing, idx) => {
            const scaled = scaledPreview(ing);
            const looking = lookupIdx === idx;
            return (
            <div
              key={idx}
              style={{
                border: `1px solid ${color.borderWarm}`,
                borderRadius: radius.sm,
                padding: 10,
                marginBottom: 10,
                background: color.surfaceMuted,
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr', gap: 6, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: color.textMuted, marginBottom: 3 }}>Nombre</div>
                  <input
                    value={ing.n}
                    onChange={e => {
                      patchIngredient(idx, { n: e.target.value });
                      setLookupHint('');
                    }}
                    onBlur={e => {
                      const typed = e.currentTarget.value.trim();
                      const row = ingredientsRef.current[idx];
                      if (typed && !row?.kcal100 && !row?.p100) {
                        void fillMacros(idx, typed);
                      }
                    }}
                    placeholder="Ej. brócoli, pollo…"
                    style={{ ...inputStyle, width: '100%', padding: '8px 8px', fontSize: 13 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: color.textMuted, marginBottom: 3 }}>g en receta</div>
                  <input
                    value={numInputValue(ing.g)}
                    onChange={e => {
                      patchIngredient(idx, { g: Number(e.target.value) || 0 });
                    }}
                    inputMode="decimal"
                    style={{ ...inputStyle, width: '100%', padding: '8px 8px', fontSize: 13 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                {MACRO_100_FIELDS.map(field => (
                  <div key={field.key}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: color.textMuted, marginBottom: 3 }}>{field.label}</div>
                    <input
                      value={numInputValue(ing[field.key])}
                      onChange={e => {
                        patchIngredient(idx, { [field.key]: Number(e.target.value) || 0 });
                      }}
                      inputMode="decimal"
                      style={{ ...inputStyle, width: '100%', padding: '8px 6px', fontSize: 12.5 }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: color.textMuted, marginBottom: 8 }}>
                En la receta ({ing.g || 0} g): {scaled.kcal} kcal · P{scaled.p} C{scaled.c} G{scaled.f}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={looking || lookupIdx != null}
                  onClick={() => void fillMacros(idx)}
                  style={{
                    border: 'none', background: 'transparent', color: color.primaryDeep,
                    fontWeight: 800, fontSize: 12.5, cursor: looking ? 'wait' : 'pointer', padding: 0,
                    opacity: looking ? 0.7 : 1,
                  }}
                >
                  {looking ? 'Buscando…' : 'Rellenar macros'}
                </button>
                <button
                  type="button"
                  onClick={() => setIngredients(prev => prev.filter((_, i) => i !== idx))}
                  style={{
                    border: 'none', background: 'transparent', color: color.textMuted,
                    fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: 0,
                  }}
                >
                  Quitar
                </button>
              </div>
            </div>
            );
          })}
          <Btn
            variant="secondary"
            onClick={() => setIngredients(prev => [...prev, emptyIng()])}
            style={{ marginBottom: 12, padding: '10px 12px' }}
          >
            + Ingrediente
          </Btn>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: color.ink }}>
            Totales ≈ {preview.kcal} kcal · P {preview.p} · C {preview.c} · G {preview.f}
          </div>

          <FieldLabel>Pasos</FieldLabel>
          <textarea
            value={stepsText}
            onChange={e => setStepsText(e.target.value)}
            rows={3}
            placeholder="Uno por línea"
            style={{ ...inputStyle, width: '100%', marginBottom: 12, resize: 'vertical' }}
          />

          {error && <div style={{ color: color.primaryDeep, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => { setShowForm(false); resetForm(); }} style={{ flex: 1 }}>
              Cancelar
            </Btn>
            <Btn busy={saving} onClick={() => void handleSave()} style={{ flex: 1 }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Btn>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: color.textMuted, fontWeight: 600 }}>Cargando…</div>
      ) : recipes.length === 0 && !showForm ? (
        <EmptyState title="Sin recetas" body="Crea la primera para el menú." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipes.map(r => (
            <div key={r.id} style={{ ...cardStyle, padding: '14px 16px', position: 'relative', overflow: menuOpenId === r.id ? 'visible' : 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 24 }}>{r.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 500 }}>
                    {r.preferred_slot} · {Math.round(r.kcal)} kcal · Prot {Math.round(r.p)} · Carb {Math.round(r.c)} · Gras {Math.round(r.f)}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    aria-label={`Opciones de ${r.name}`}
                    onClick={e => {
                      e.stopPropagation();
                      setMenuOpenId(prev => (prev === r.id ? null : r.id));
                    }}
                    style={{
                      width: 32, height: 32, border: 'none', background: 'transparent',
                      color: color.textMuted, cursor: 'pointer',
                    }}
                  >
                    ⋮
                  </button>
                  {menuOpenId === r.id && (
                    <div
                      role="menu"
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 130,
                        background: color.surface, borderRadius: 14, border: `1px solid ${color.borderWarm}`,
                        boxShadow: '0 8px 24px rgba(80,60,40,.16)', padding: 6, zIndex: 20,
                      }}
                    >
                      <button type="button" role="menuitem" onClick={() => startEdit(r)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }}>
                        Editar
                      </button>
                      <button type="button" role="menuitem" onClick={() => void handleDelete(r.id)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '10px 12px', fontWeight: 700, color: color.primaryDeep, cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </ScreenPage>
  );
}
