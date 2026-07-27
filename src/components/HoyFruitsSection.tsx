import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import PhoneSheet from './PhoneSheet';
import { lookupIngredientNutrition } from '../api';
import {
  createLoggedFruit,
  createLoggedFruitFromLookup,
  fruitQuickPicks,
  scaleFruitMacros,
  searchFruitCatalog,
  type FruitKind,
  type LoggedFruit,
} from '../fruits';
import { color, font, radius, cardStyle, primaryBtnStyle, secondaryBtnStyle } from '../theme';
import { IconLeaf, IconSpinner } from './ui';

type Props = {
  fruits: LoggedFruit[];
  onChange: (next: LoggedFruit[]) => void;
};

function FruitResultButton({
  title,
  subtitle,
  kcal,
  onSelect,
}: {
  title: string;
  subtitle: string;
  kcal: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        border: `1.5px solid ${color.border}`,
        background: color.surface,
        borderRadius: radius.xl,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'background 180ms ease, border-color 180ms ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: color.text }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: color.textMuted, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 800, color: color.primaryDeep,
        background: color.primarySoft,
        padding: '5px 10px', borderRadius: radius.pill, flexShrink: 0,
      }}>
        {kcal} kcal
      </div>
    </button>
  );
}

export default function HoyFruitsSection({ fruits, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupHit, setLookupHit] = useState<{
    name: string;
    per100: { kcal: number; p: number; c: number; f: number };
    defaultG: number;
  } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const total = useMemo(
    () => fruits.reduce((a, f) => a + scaleFruitMacros(f.per100, f.g).kcal, 0),
    [fruits],
  );

  const quickPicks = useMemo(() => fruitQuickPicks(), []);
  const results = useMemo(
    () => searchFruitCatalog(deferredQuery, 10),
    [deferredQuery],
  );

  useEffect(() => {
    if (!pickerOpen) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [pickerOpen]);

  useEffect(() => {
    setLookupHit(null);
    setLookupError(null);
  }, [deferredQuery]);

  function closePicker() {
    setPickerOpen(false);
    setQuery('');
    setLookupHit(null);
    setLookupError(null);
    setLookupBusy(false);
  }

  function addKind(kind: FruitKind) {
    onChange([...fruits, createLoggedFruit(kind)]);
    closePicker();
  }

  function addLookup() {
    if (!lookupHit) return;
    onChange([
      ...fruits,
      createLoggedFruitFromLookup(lookupHit.name, lookupHit.per100, lookupHit.defaultG),
    ]);
    closePicker();
  }

  async function searchNutrition() {
    const q = deferredQuery.trim();
    if (q.length < 2) return;
    setLookupBusy(true);
    setLookupError(null);
    setLookupHit(null);
    try {
      const data = await lookupIngredientNutrition(q, 100);
      const per = data.per_100g;
      setLookupHit({
        name: data.name || q,
        per100: {
          kcal: Number(per?.kcal ?? data.kcal) || 0,
          p: Number(per?.p ?? data.p) || 0,
          c: Number(per?.c ?? data.c) || 0,
          f: Number(per?.f ?? data.f) || 0,
        },
        defaultG: 150,
      });
    } catch {
      setLookupError('No encontramos esa fruta. Prueba otro nombre.');
    } finally {
      setLookupBusy(false);
    }
  }

  function updateGrams(id: string, raw: string) {
    const parsed = raw === '' ? 0 : Number(raw);
    if (Number.isNaN(parsed)) return;
    const g = Math.max(0, Math.min(2000, parsed));
    onChange(fruits.map(f => (f.id === id ? { ...f, g } : f)));
  }

  function removeFruit(id: string) {
    onChange(fruits.filter(f => f.id !== id));
  }

  const showSearchResults = deferredQuery.trim().length > 0;

  return (
    <section style={{ marginTop: 28 }} aria-labelledby="hoy-frutas-title">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, margin: '0 4px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ color: color.success, display: 'flex' }} aria-hidden>
            <IconLeaf />
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              id="hoy-frutas-title"
              style={{ fontFamily: font.display, fontSize: 19, fontWeight: 800 }}
            >
              Frutas
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: color.textMuted, marginTop: 2 }}>
              {fruits.length === 0
                ? 'Añade piezas al registro de hoy'
                : `${fruits.length} · ${total} kcal`}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={{
            ...primaryBtnStyle({ padding: '10px 14px' }),
            fontSize: 13,
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          + Añadir
        </button>
      </div>

      {fruits.length === 0 ? (
        <div style={{
          ...cardStyle,
          padding: '18px 16px',
          color: color.textMuted,
          fontSize: 13.5,
          fontWeight: 500,
          lineHeight: 1.45,
        }}>
          Puedes registrar tantas piezas como quieras. Cada una trae un peso aproximado que puedes ajustar; las macros se recalculan solas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fruits.map(fruit => {
            const macros = scaleFruitMacros(fruit.per100, fruit.g);
            return (
              <div
                key={fruit.id}
                style={{
                  ...cardStyle,
                  padding: '14px 14px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: color.text }}>{fruit.name}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: color.textMuted, marginTop: 3,
                    }}>
                      {macros.kcal} kcal · P {macros.p} · C {macros.c} · G {macros.f}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFruit(fruit.id)}
                    aria-label={`Quitar ${fruit.name}`}
                    style={{
                      border: 'none',
                      background: color.surfaceMuted,
                      color: color.textBody,
                      width: 32,
                      height: 32,
                      borderRadius: radius.pill,
                      cursor: 'pointer',
                      fontSize: 18,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${color.divider}`,
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: color.textMuted,
                    textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0,
                  }}>
                    Peso
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={2000}
                    step={1}
                    value={fruit.g || ''}
                    onChange={e => updateGrams(fruit.id, e.target.value)}
                    aria-label={`Peso de ${fruit.name} en gramos`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: `1.5px solid ${color.border}`,
                      background: color.surfaceMuted,
                      borderRadius: radius.md,
                      padding: '10px 12px',
                      fontSize: 15,
                      fontWeight: 700,
                      color: color.text,
                      fontFamily: font.body,
                      outline: 'none',
                    }}
                  />
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: color.textMuted, flexShrink: 0,
                  }}>
                    g
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <PhoneSheet onClose={closePicker} maxHeight="85%">
          <div style={{
            fontFamily: font.display, fontSize: 20, fontWeight: 800, marginBottom: 6,
          }}>
            Añadir fruta
          </div>
          <div style={{
            fontSize: 13, fontWeight: 500, color: color.textMuted, marginBottom: 14, lineHeight: 1.4,
          }}>
            Busca por nombre. Se añade con el peso típico de una pieza.
          </div>

          <label
            htmlFor="hoy-fruta-search"
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: color.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              marginBottom: 8,
            }}
          >
            Buscar
          </label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              ref={searchRef}
              id="hoy-fruta-search"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (results[0]) addKind(results[0]);
                  else if (deferredQuery.trim().length >= 2) void searchNutrition();
                }
              }}
              placeholder="Ej. mango, cereza, pomelo…"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: `1.5px solid ${color.border}`,
                background: color.surfaceMuted,
                borderRadius: radius.lg,
                padding: '14px 44px 14px 14px',
                fontSize: 16,
                fontWeight: 600,
                color: color.text,
                fontFamily: font.body,
                outline: 'none',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 32,
                  height: 32,
                  border: 'none',
                  borderRadius: radius.pill,
                  background: color.border,
                  color: color.textBody,
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120, paddingBottom: 8 }}>
            {!showSearchResults && (
              <>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: color.textMuted,
                  textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2,
                }}>
                  Frecuentes
                </div>
                {quickPicks.map(kind => (
                  <FruitResultButton
                    key={kind.id}
                    title={kind.name}
                    subtitle={`${kind.pieceLabel} · ~${kind.defaultG} g`}
                    kcal={scaleFruitMacros(kind.per100, kind.defaultG).kcal}
                    onSelect={() => addKind(kind)}
                  />
                ))}
              </>
            )}

            {showSearchResults && results.length > 0 && results.map(kind => (
              <FruitResultButton
                key={kind.id}
                title={kind.name}
                subtitle={`${kind.pieceLabel} · ~${kind.defaultG} g`}
                kcal={scaleFruitMacros(kind.per100, kind.defaultG).kcal}
                onSelect={() => addKind(kind)}
              />
            ))}

            {showSearchResults && results.length === 0 && !lookupHit && !lookupBusy && (
              <div style={{
                ...cardStyle,
                padding: '18px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: color.textBody }}>
                  Sin coincidencias en el catálogo
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 500, color: color.textMuted, marginTop: 6, lineHeight: 1.4,
                }}>
                  Prueba otro nombre o busca en la base nutricional.
                </div>
                <button
                  type="button"
                  onClick={() => void searchNutrition()}
                  style={{
                    ...primaryBtnStyle({ padding: '12px 14px' }),
                    width: '100%',
                    marginTop: 14,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Buscar «{deferredQuery.trim()}»
                </button>
              </div>
            )}

            {lookupBusy && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '20px 12px', color: color.textMuted, fontWeight: 600,
              }}>
                <IconSpinner />
                Buscando…
              </div>
            )}

            {lookupError && (
              <div style={{
                padding: '14px 16px',
                borderRadius: radius.xl,
                background: color.primarySoft,
                color: color.primaryDeep,
                fontSize: 13.5,
                fontWeight: 600,
                lineHeight: 1.4,
              }}>
                {lookupError}
              </div>
            )}

            {lookupHit && (
              <FruitResultButton
                title={lookupHit.name}
                subtitle={`~${lookupHit.defaultG} g · desde base nutricional`}
                kcal={scaleFruitMacros(lookupHit.per100, lookupHit.defaultG).kcal}
                onSelect={addLookup}
              />
            )}
          </div>

          <button
            type="button"
            onClick={closePicker}
            style={{
              ...secondaryBtnStyle(),
              width: '100%',
              marginTop: 8,
              marginBottom: 8,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </PhoneSheet>
      )}
    </section>
  );
}
