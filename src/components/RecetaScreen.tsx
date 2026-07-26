import { useEffect, useState } from 'react';
import { useAppState, useAppActions } from '../store';
import { mealBgStyle } from '../mealVisual';
import { resolveMealImage, fetchRecipeMealImage } from '../mealImages';
import { n, nOrDash } from '../format';

export default function RecetaScreen() {
  const { openMeal, currentMeals, viewingMeal, recipeBack, swapMealCtx } = useAppState();
  const { go, openSwap, openSwapMeal } = useAppActions();

  const baseMeal = viewingMeal ?? currentMeals[openMeal];
  const [photoUrl, setPhotoUrl] = useState(() =>
    resolveMealImage(baseMeal.name, baseMeal.slot, baseMeal.image),
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const initial = resolveMealImage(baseMeal.name, baseMeal.slot, baseMeal.image);
    setPhotoUrl(initial);
    setImgFailed(false);

    let cancelled = false;
    fetchRecipeMealImage(baseMeal.name)
      .then(url => {
        if (!cancelled && url) {
          setPhotoUrl(url);
          setImgFailed(false);
        }
      })
      .catch(() => { /* keep Unsplash / existing */ });

    return () => { cancelled = true; };
  }, [baseMeal.name, baseMeal.slot, baseMeal.image]);

  const meal = baseMeal;
  const fromWeek = recipeBack === 'semana';
  const fromHistory = recipeBack === 'historial';
  const readOnly = fromHistory;
  const hasPhoto = Boolean(photoUrl) && !imgFailed;
  const canSwapIngredients = !readOnly && meal.ingredients.length > 0;

  function handleBack() {
    go(recipeBack);
  }

  function handleChangeMeal() {
    if (fromWeek && swapMealCtx) {
      openSwapMeal(swapMealCtx);
      return;
    }
    openSwapMeal({ source: 'hoy', slotIdx: openMeal, dayIdx: 2 });
  }

  return (
    <div style={{ padding: '0 0 120px' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', height: 230,
        ...mealBgStyle({ swatch: meal.swatch, image: null }),
        display: 'flex', alignItems: 'flex-end', padding: 20,
        overflow: 'hidden',
      }}>
        {hasPhoto && (
          <img
            src={photoUrl}
            alt={meal.name}
            onError={() => setImgFailed(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
            }}
          />
        )}
        {hasPhoto && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.5) 100%)',
          }} />
        )}
        <div
          onClick={handleBack}
          className="np-hero-back"
          style={{
            position: 'absolute', top: 58, left: 18, zIndex: 1,
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(255,255,255,.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.12)',
          }}
        >
          <svg width="11" height="18" viewBox="0 0 12 20">
            <path d="M10 2L2 10l8 8" stroke="#2a2520" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!hasPhoto && (
          <div style={{ position: 'absolute', top: 64, right: 18, fontSize: 46, zIndex: 1 }}>{meal.emoji}</div>
        )}
        <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#2a2520',
            background: 'rgba(255,255,255,.92)', padding: '5px 12px', borderRadius: 99,
          }}>
            ⏱ {meal.time}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#2a2520',
            background: 'rgba(255,255,255,.92)', padding: '5px 12px', borderRadius: 99,
          }}>
            📊 {meal.diff}
          </span>
        </div>
      </div>

      <div style={{ padding: '22px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0512c', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {meal.slot}
        </div>
        <div style={{
          fontFamily: "'Nunito'", fontSize: 25, fontWeight: 800,
          lineHeight: 1.15, marginTop: 4, letterSpacing: -0.4,
        }}>
          {meal.name}
        </div>
        <div style={{ fontSize: 12.5, color: '#9a9087', fontWeight: 500, marginTop: 6 }}>
          {fromHistory ? 'Historial' : fromWeek ? 'Plan semanal' : 'Receta del día'} · {meal.diff}
        </div>

        {/* Macros */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {[
            { val: nOrDash(meal.kcal, true), label: 'kcal', unit: '', border: undefined as string | undefined },
            { val: nOrDash(meal.p, true), label: 'Proteína', unit: meal.p ? 'g' : '', border: '#ff6a3d' },
            { val: nOrDash(meal.c, true), label: 'Carbos', unit: meal.c ? 'g' : '', border: '#ffb02e' },
            { val: nOrDash(meal.f, true), label: 'Grasas', unit: meal.f ? 'g' : '', border: '#18bd73' },
          ].map((m, i) => (
            <div key={i} style={{
              flex: 1, background: '#fff', borderRadius: 18,
              padding: '14px 10px', textAlign: 'center',
              boxShadow: '0 4px 14px rgba(80,60,40,.05)',
              borderBottom: m.border ? `3px solid ${m.border}` : undefined,
            }}>
              <div style={{ fontFamily: "'Nunito'", fontSize: 21, fontWeight: 800 }}>
                {m.val}{m.unit}
              </div>
              <div style={{ fontSize: 11, color: '#9a9087', fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {fromWeek && !readOnly && (
          <div
            onClick={handleChangeMeal}
            style={{
              marginTop: 18, display: 'flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(120deg,#2a2520,#3d342c)',
              borderRadius: 18, padding: '13px 16px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>🔄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Cambiar este plato</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontWeight: 500, marginTop: 1 }}>
                Ver alternativas para {meal.slot.toLowerCase()}
              </div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14">
              <path d="M1 1l6 6-6 6" stroke="rgba(255,255,255,.4)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Ingredients */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '26px 2px 12px' }}>
          <div style={{ fontFamily: "'Nunito'", fontSize: 18, fontWeight: 800 }}>Ingredientes</div>
          {canSwapIngredients && (
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9a9087' }}>toca para cambiar →</div>
          )}
        </div>
        {meal.ingredients.length > 0 ? (
          <div
            data-tutorial="receta-ingredientes"
            style={{
              background: '#fff', borderRadius: 22, overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(80,60,40,.05)',
            }}
          >
            {meal.ingredients.map((ing, i) => (
              <div
                key={i}
                onClick={canSwapIngredients ? () => openSwap(openMeal, i) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px', borderBottom: '1px solid #f6ece0',
                  cursor: canSwapIngredients ? 'pointer' : 'default',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{ing.n}</div>
                  <div style={{ fontSize: 12, color: '#9a9087', fontWeight: 500, marginTop: 1 }}>
                    {n(ing.kcal)} kcal · P{n(ing.p)} C{n(ing.c)} G{n(ing.f)}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: '#e0512c',
                  background: '#ffece4', padding: '4px 11px', borderRadius: 99,
                }}>
                  {n(ing.g)}g
                </div>
                {canSwapIngredients && (
                  <svg width="7" height="12" viewBox="0 0 8 14">
                    <path d="M1 1l6 6-6 6" stroke="#cdbfae" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            data-tutorial="receta-ingredientes"
            style={{
              background: '#fff', borderRadius: 22, padding: '18px 16px',
              boxShadow: '0 4px 16px rgba(80,60,40,.05)',
              fontSize: 14, color: '#9a9087', fontWeight: 500, lineHeight: 1.45,
            }}
          >
            Sin ficha de ingredientes para este plato. Usa «Cambiar este plato» para una alternativa con detalle completo.
          </div>
        )}

        {/* Steps */}
        <div style={{ fontFamily: "'Nunito'", fontSize: 18, fontWeight: 800, margin: '26px 2px 12px' }}>
          Preparación
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {meal.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: '#ff6a3d',
                color: '#fff', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{
                fontSize: 14.5, lineHeight: 1.45, fontWeight: 500,
                color: '#4a4038', paddingTop: 2,
              }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
