import { useEffect, useState } from 'react';
import { useAppState, useAppActions } from '../store';
import { MEAL_ALTERNATIVES, WEEK_MEAL_SLOTS } from '../data';
import { mealBgStyle } from '../mealVisual';
import { withMealImage, resolveMealImage } from '../mealImages';
import MealThumb from './MealThumb';
import { n } from '../format';
import { fetchMyRecipes, type UserRecipeApi } from '../api';
import { color, font, cardStyle, radius } from '../theme';
import { EmptyState, Notice, ScreenHeader, ScreenPage, SectionTitle } from './ui';
import type { Meal } from '../types';

function MealPreview({
  meal,
  currentMeal,
  onConfirm,
  onBack,
}: {
  meal: Meal;
  currentMeal: Meal | null;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const kcalDiff = currentMeal ? n(meal.kcal - currentMeal.kcal) : 0;
  const photo = resolveMealImage(meal.name, meal.slot, meal.image);
  const [imgFailed, setImgFailed] = useState(false);
  const hasPhoto = Boolean(photo) && !imgFailed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', height: 200,
        ...mealBgStyle({ swatch: meal.swatch, image: null }),
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {hasPhoto && (
          <img
            src={photo}
            alt={meal.name}
            onError={() => setImgFailed(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        )}
        {hasPhoto && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.4) 100%)',
          }} />
        )}
        <div
          onClick={onBack}
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
          <div style={{ position: 'absolute', top: 58, right: 18, fontSize: 42, zIndex: 1 }}>{meal.emoji}</div>
        )}
        <div style={{
          position: 'absolute', bottom: 16, left: 18, display: 'flex', gap: 8, zIndex: 1,
        }}>
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

      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Name + kcal diff badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#e0512c', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {meal.slot}
            </div>
            <div style={{
              fontFamily: "'Nunito'", fontSize: 22, fontWeight: 800,
              lineHeight: 1.15, marginTop: 4, letterSpacing: -0.4,
            }}>
              {meal.name}
            </div>
          </div>
          {currentMeal && (
            <div style={{
              fontSize: 13, fontWeight: 800, marginTop: 4, flexShrink: 0,
              color: kcalDiff > 30 ? '#ef6f24' : kcalDiff < -30 ? '#18bd73' : '#9a9087',
              background: kcalDiff > 30 ? '#fff1e8' : kcalDiff < -30 ? '#edf9f3' : '#f6ece0',
              padding: '5px 12px', borderRadius: 99,
            }}>
              {kcalDiff >= 0 ? '+' : ''}{kcalDiff} kcal
            </div>
          )}
        </div>

        {/* Macros */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[
            { val: n(meal.kcal), label: 'kcal', border: undefined as string | undefined },
            { val: n(meal.p), label: 'Prot', border: '#ff6a3d' },
            { val: n(meal.c), label: 'Carb', border: '#ffb02e' },
            { val: n(meal.f), label: 'Gras', border: '#18bd73' },
          ].map((m, i) => (
            <div key={i} style={{
              flex: 1, background: '#fff', borderRadius: 16,
              padding: '12px 8px', textAlign: 'center',
              boxShadow: '0 3px 10px rgba(80,60,40,.05)',
              borderBottom: m.border ? `3px solid ${m.border}` : undefined,
            }}>
              <div style={{ fontFamily: "'Nunito'", fontSize: 18, fontWeight: 800 }}>
                {m.val}{m.label !== 'kcal' ? 'g' : ''}
              </div>
              <div style={{ fontSize: 10.5, color: '#9a9087', fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Ingredients */}
        <div style={{ fontFamily: "'Nunito'", fontSize: 16, fontWeight: 800, margin: '22px 2px 10px' }}>
          Ingredientes
        </div>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 3px 12px rgba(80,60,40,.05)' }}>
          {meal.ingredients.map((ing, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              borderBottom: i < meal.ingredients.length - 1 ? '1px solid #f6ece0' : undefined,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{ing.n}</div>
                <div style={{ fontSize: 11.5, color: '#9a9087', fontWeight: 500, marginTop: 1 }}>
                  {n(ing.kcal)} kcal · P{n(ing.p)} C{n(ing.c)} G{n(ing.f)}
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 800, color: '#e0512c',
                background: '#ffece4', padding: '3px 10px', borderRadius: 99,
              }}>
                {n(ing.g)}g
              </div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ fontFamily: "'Nunito'", fontSize: 16, fontWeight: 800, margin: '22px 2px 10px' }}>
          Preparación
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meal.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: '#ff6a3d',
                color: '#fff', fontFamily: "'Nunito'", fontWeight: 800, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 500, color: '#4a4038', paddingTop: 2 }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons — inline at bottom, above BottomNav */}
      <div style={{
        padding: '16px 20px 90px',
        background: '#faf6f1',
        borderTop: '1px solid #efe8df',
        display: 'flex', gap: 10,
      }}>
        <div
          onClick={onBack}
          style={{
            flex: 1, background: '#f0e8df', color: '#4a4038',
            borderRadius: 18, padding: '15px 0', textAlign: 'center',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}
        >
          Volver
        </div>
        <div
          onClick={onConfirm}
          style={{
            flex: 2, background: 'linear-gradient(120deg,#ff6a3d,#ffb02e)',
            color: '#fff', borderRadius: 18, padding: '15px 0', textAlign: 'center',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(224,122,77,.32)',
          }}
        >
          Intercambiar
        </div>
      </div>
    </div>
  );
}

export default function SwapMealScreen() {
  const { swapMealCtx, currentMeals } = useAppState();
  const { go, applyMealSwap, applyUserRecipeSwap } = useAppActions();
  const [previewMeal, setPreviewMeal] = useState<Meal | null>(null);
  const [myRecipes, setMyRecipes] = useState<UserRecipeApi[]>([]);
  const [pendingRecipeId, setPendingRecipeId] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchMyRecipes().then(setMyRecipes).catch(() => setMyRecipes([]));
  }, []);

  if (!swapMealCtx) return null;

  const { slotIdx, source } = swapMealCtx;
  const slotName = WEEK_MEAL_SLOTS[slotIdx];
  const alternatives = (MEAL_ALTERNATIVES[slotName] || []).map(withMealImage);
  const currentMeal = source === 'hoy' ? currentMeals[slotIdx] : null;
  const slotRecipes = [...myRecipes].sort((a, b) => {
    const aMatch = a.preferred_slot === slotName ? 0 : 1;
    const bMatch = b.preferred_slot === slotName ? 0 : 1;
    return aMatch - bMatch;
  });

  function recipeToMeal(r: UserRecipeApi): Meal {
    return {
      slot: slotName,
      name: r.name,
      kcal: r.kcal,
      p: r.p,
      c: r.c,
      f: r.f,
      emoji: r.emoji || '🍽️',
      time: currentMeal?.time || '30 min',
      diff: currentMeal?.diff || 'Media',
      swatch: currentMeal?.swatch || 'linear-gradient(135deg,#7ec8a3,#3d8b6e)',
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      recipe_source: 'user',
      external_recipe_id: String(r.id),
    };
  }

  function handleConfirm() {
    if (!previewMeal) return;
    if (pendingRecipeId != null && source === 'hoy') {
      setBusy(true);
      void applyUserRecipeSwap(pendingRecipeId)
        .then(w => {
          setWarning(w);
          go('hoy');
        })
        .finally(() => setBusy(false));
      return;
    }
    applyMealSwap(withMealImage(previewMeal), previewMeal.name);
    go(source === 'hoy' ? 'hoy' : 'semana');
  }

  if (previewMeal) {
    return (
      <MealPreview
        meal={withMealImage(previewMeal)}
        currentMeal={currentMeal}
        onConfirm={handleConfirm}
        onBack={() => {
          setPreviewMeal(null);
          setPendingRecipeId(null);
        }}
      />
    );
  }

  return (
    <ScreenPage>
      <div data-tutorial={!currentMeal ? 'swap-meal-actual' : undefined}>
      <ScreenHeader
        title={`Cambiar ${slotName.toLowerCase()}`}
        subtitle="Elige y confirma"
        onBack={() => go(source === 'hoy' ? 'hoy' : 'semana')}
      />
      </div>

      {warning && (
        <Notice tone="warm" style={{ color: color.primaryDeep, fontWeight: 600 }}>
          {warning}
        </Notice>
      )}

      {/* Current meal */}
      {currentMeal && (
        <>
          <div style={{
            fontSize: 12, fontWeight: 700, color: color.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.4, margin: '4px 2px 8px',
          }}>
            Actual
          </div>
          <div
            data-tutorial="swap-meal-actual"
            style={{
              background: color.ink, color: color.white, borderRadius: radius.xl,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <MealThumb meal={currentMeal} size={52} radius={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 800,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {currentMeal.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                {n(currentMeal.kcal)} kcal · P{n(currentMeal.p)} C{n(currentMeal.c)} G{n(currentMeal.f)}
              </div>
            </div>
          </div>
        </>
      )}

      <SectionTitle style={{ marginTop: 22 }}>Mis recetas</SectionTitle>
      <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 500, margin: '-4px 2px 14px' }}>
        {source === 'hoy' ? 'Tu receta; el día se ajusta.' : 'Usa una receta tuya.'}
      </div>
      {slotRecipes.length === 0 ? (
        <EmptyState
          title="Sin recetas"
          body="Créalas en Perfil."
          action={(
            <button
              type="button"
              onClick={() => go('misRecetas')}
              style={{
                border: 'none', background: 'none', color: color.primaryDeep,
                fontWeight: 800, fontSize: 13, cursor: 'pointer', padding: 0,
              }}
            >
              Ir a Mis recetas →
            </button>
          )}
          style={{ marginBottom: 8 }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          {slotRecipes.map(r => (
            <div
              key={r.id}
              onClick={() => {
                if (busy) return;
                setPendingRecipeId(source === 'hoy' ? r.id : null);
                setPreviewMeal(recipeToMeal(r));
              }}
              style={{
                ...cardStyle,
                padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                border: r.preferred_slot === slotName ? `1.5px solid ${color.primary}` : '1.5px solid transparent',
                transition: 'border-color .2s ease',
              }}
            >
              <div style={{ fontSize: 22 }}>{r.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: color.textMuted }}>
                  {r.preferred_slot} · {Math.round(r.kcal)} kcal · Prot {Math.round(r.p)} · Carb {Math.round(r.c)} · Gras {Math.round(r.f)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div data-tutorial="swap-meal-alternativas">
      <SectionTitle>Alternativas</SectionTitle>
      <div style={{ fontSize: 12.5, color: color.textMuted, fontWeight: 500, margin: '-4px 2px 14px' }}>
        Toca para ver detalle.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alternatives.map((alt, i) => {
          const kcalDiff = currentMeal ? n(alt.kcal - currentMeal.kcal) : 0;
          return (
            <div
              key={i}
              onClick={() => {
                setPendingRecipeId(null);
                setPreviewMeal(alt);
              }}
              style={{
                ...cardStyle,
                overflow: 'hidden', cursor: 'pointer',
              }}
            >
              {/* Image / swatch banner */}
              <div style={{
                height: 80, backgroundImage: alt.swatch, backgroundSize: 'cover',
                position: 'relative', display: 'flex', alignItems: 'flex-end',
                padding: '0 14px 10px', overflow: 'hidden',
              }}>
                <img
                  src={resolveMealImage(alt.name, alt.slot, alt.image)}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 20%, rgba(0,0,0,.35) 100%)',
                }} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, position: 'relative' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: color.ink,
                    background: 'rgba(255,255,255,.9)', padding: '3px 9px', borderRadius: radius.pill,
                  }}>
                    {alt.time}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: color.ink,
                    background: 'rgba(255,255,255,.9)', padding: '3px 9px', borderRadius: radius.pill,
                  }}>
                    {alt.diff}
                  </span>
                </div>
              </div>
              {/* Info row */}
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {alt.name}
                  </div>
                  <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 500, marginTop: 3 }}>
                    P {n(alt.p)}g · C {n(alt.c)}g · G {n(alt.f)}g
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 900 }}>{n(alt.kcal)}</div>
                  <div style={{ fontSize: 10.5, color: color.textSoft, fontWeight: 600 }}>kcal</div>
                  {currentMeal && (
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginTop: 3,
                      color: kcalDiff > 30 ? '#ef6f24' : kcalDiff < -30 ? color.success : color.textMuted,
                    }}>
                      {kcalDiff >= 0 ? '+' : ''}{kcalDiff}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </ScreenPage>
  );
}
