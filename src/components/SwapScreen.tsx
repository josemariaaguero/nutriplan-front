import { useEffect, useState } from 'react';
import { fetchIngredientSubstitutes, fetchIngredientSwaps } from '../api';
import { useAppState, useAppActions } from '../store';
import { n } from '../format';
import type { Ingredient } from '../types';
import { SWAPS } from '../data';

export default function SwapScreen() {
  const { openMeal, openSwapIng, currentMeals, viewingMeal, recipeBack, swapMealCtx } = useAppState();
  const { go, openSwapMeal, applyIngredientSwap } = useAppActions();

  const fromWeek = recipeBack === 'semana';
  const meal = (fromWeek && viewingMeal) ? viewingMeal : currentMeals[openMeal];
  const ing = meal?.ingredients[openSwapIng] || meal?.ingredients[0];

  const [alts, setAlts] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meal || !ing) {
      setLoading(false);
      setError('No hay ingrediente seleccionado.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setAlts([]);

    const localFallback = (): Ingredient[] =>
      (SWAPS[ing.n] || []).map(s => ({ n: s.n, g: s.g, kcal: s.kcal, p: s.p, c: s.c, f: s.f }));

    const load = fromWeek
      ? fetchIngredientSubstitutes(ing)
      : fetchIngredientSwaps(openMeal, openSwapIng);

    load
      .then(res => {
        if (cancelled) return;
        const list = res.alternatives?.length ? res.alternatives : localFallback();
        setAlts(list);
      })
      .catch(() => {
        if (cancelled) return;
        const local = localFallback();
        if (local.length) {
          setAlts(local);
        } else {
          setError('No se pudieron cargar las alternativas.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [openMeal, openSwapIng, fromWeek, meal?.name, ing?.n]);

  function handleSwapMeal() {
    if (swapMealCtx) {
      openSwapMeal(swapMealCtx);
      return;
    }
    openSwapMeal({ source: 'hoy', slotIdx: openMeal, dayIdx: 2 });
  }

  if (!meal || !ing) {
    return (
      <div style={{ padding: '64px 20px', color: '#9a9087', fontWeight: 600 }}>
        No se encontró la receta.
      </div>
    );
  }

  return (
    <div style={{ padding: '64px 20px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div
          onClick={() => go('receta')}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(80,60,40,.08)',
          }}
        >
          <svg width="11" height="18" viewBox="0 0 12 20">
            <path d="M10 2L2 10l8 8" stroke="#2a2520" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontFamily: "'Nunito'", fontSize: 24, fontWeight: 800, letterSpacing: -0.4 }}>
          Cambiar ingrediente
        </div>
      </div>

      <div
        onClick={handleSwapMeal}
        role="button"
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(120deg,#2a2520,#3d342c)',
          borderRadius: 20, padding: '14px 16px', marginBottom: 22, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 20,
        }}>
          🔄
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Cambiar comida completa</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontWeight: 500, marginTop: 1 }}>
            Ver alternativas para {meal.slot.toLowerCase()}
          </div>
        </div>
        <svg width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1l6 6-6 6" stroke="rgba(255,255,255,.4)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{
        fontSize: 12, fontWeight: 700, color: '#9a9087',
        textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 2px 8px',
      }}>
        Ingrediente actual
      </div>
      <div
        data-tutorial="swap-ing-actual"
        style={{
          background: '#2a2520', color: '#fff', borderRadius: 22,
          padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{ing.n}</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 500, marginTop: 2 }}>
            {n(ing.kcal)} kcal · P{n(ing.p)} C{n(ing.c)} G{n(ing.f)}
          </div>
        </div>
        <div style={{
          fontFamily: "'Nunito'", fontSize: 20, fontWeight: 800,
          background: 'rgba(255,255,255,.1)', padding: '6px 13px', borderRadius: 99,
        }}>
          {n(ing.g)}g
        </div>
      </div>

      <div data-tutorial="swap-ing-alternativas">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 2px 12px' }}>
          <div style={{ fontFamily: "'Nunito'", fontSize: 16, fontWeight: 800 }}>
            Alternativas equivalentes
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500, margin: '-6px 2px 14px' }}>
          Porciones ya ajustadas para aportar lo mismo. Compara el efecto en calorías.
        </div>

        {loading ? (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '24px 16px',
            textAlign: 'center', color: '#9a9087', fontSize: 14, fontWeight: 500,
          }}>
            Buscando equivalencias…
          </div>
        ) : error ? (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '24px 16px',
            textAlign: 'center', color: '#ef6f24', fontSize: 14, fontWeight: 500,
          }}>
            {error}
          </div>
        ) : alts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {alts.map((alt, i) => {
              const diff = n(alt.kcal - ing.kcal);
              return (
                <div key={i}
                  onClick={() => applyIngredientSwap(alt)}
                  role="button"
                  style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#fff', borderRadius: 20, padding: '14px 16px',
                  boxShadow: '0 4px 14px rgba(80,60,40,.05)', cursor: 'pointer',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{alt.n}</div>
                    <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500, marginTop: 2 }}>
                      {n(alt.kcal)} kcal · P{n(alt.p)} C{n(alt.c)} G{n(alt.f)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 800, color: '#e0512c',
                      background: '#ffece4', padding: '4px 11px', borderRadius: 99,
                      display: 'inline-block',
                    }}>
                      {n(alt.g)}g
                    </div>
                    <div style={{
                      fontSize: 11.5, fontWeight: 700, marginTop: 5,
                      color: diff > 0 ? '#ef6f24' : '#18bd73',
                    }}>
                      {diff >= 0 ? '+' : ''}{diff} kcal
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            background: '#fff', borderRadius: 20, padding: '24px 16px',
            textAlign: 'center', color: '#9a9087', fontSize: 14, fontWeight: 500,
          }}>
            No hay alternativas disponibles para este ingrediente.
          </div>
        )}
      </div>
    </div>
  );
}
