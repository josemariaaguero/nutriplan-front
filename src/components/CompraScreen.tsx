import { useMemo, useState } from 'react';
import { useAppActions, useAppState } from '../store';
import {
  buildShoppingList,
  clearShoppingChecked,
  clearShoppingRemoved,
  formatGrams,
  loadShoppingChecked,
  loadShoppingRemoved,
  storeShoppingChecked,
  storeShoppingRemoved,
  type ShoppingItem,
} from '../shoppingList';
import { color, font, radius, cardStyle, secondaryBtnStyle } from '../theme';
import { BackButton, Eyebrow, ScreenPage, ScreenTitle } from './ui';

function ShoppingRow({
  item,
  checked,
  expanded,
  onToggleCheck,
  onToggleExpand,
  onRemove,
}: {
  item: ShoppingItem;
  checked: boolean;
  expanded: boolean;
  onToggleCheck: () => void;
  onToggleExpand: () => void;
  onRemove: () => void;
}) {
  const usageCount = item.usages.length;

  return (
    <div style={{
      ...cardStyle,
      borderRadius: 16,
      overflow: 'hidden',
      background: checked ? color.surfaceMuted : color.surface,
      opacity: checked ? 0.78 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <button
          type="button"
          onClick={onToggleCheck}
          aria-label={checked ? 'Marcar pendiente' : 'Marcar comprado'}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            flex: 1, minWidth: 0, padding: '13px 8px 13px 14px',
            border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{
            width: 24, height: 24, borderRadius: 8, flexShrink: 0,
            border: checked ? 'none' : `2px solid ${color.border}`,
            background: checked ? color.success : color.surfaceMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color.white, fontSize: 13, fontWeight: 900,
          }}>
            {checked ? '✓' : null}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15, fontWeight: 700,
              textDecoration: checked ? 'line-through' : undefined,
              color: checked ? color.textMuted : color.ink,
            }}>
              {item.name}
            </div>
            <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 600, marginTop: 2 }}>
              {formatGrams(item.grams)}
              {usageCount > 0 ? ` · ${usageCount} ${usageCount === 1 ? 'receta' : 'recetas'}` : ''}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={expanded ? 'Ocultar recetas' : 'Ver recetas'}
          style={{
            width: 40, border: 'none', background: 'none', cursor: 'pointer',
            color: color.textMuted, fontSize: 14, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {expanded ? '▴' : '▾'}
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Eliminar ${item.name}`}
          style={{
            width: 40, border: 'none', background: 'none', cursor: 'pointer',
            color: color.textSoft, fontSize: 18, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingRight: 6,
          }}
        >
          ×
        </button>
      </div>

      {expanded && (
        <div style={{
          borderTop: `1px solid ${color.divider}`,
          padding: '10px 14px 12px',
          background: checked ? 'transparent' : color.surfaceMuted,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: color.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8,
          }}>
            Se usa en
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {item.usages.map((u, i) => (
              <div key={`${u.recipe}-${u.dayLabel}-${u.slot}-${i}`} style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: color.ink }}>{u.recipe}</div>
                  <div style={{ fontSize: 11.5, color: color.textMuted, fontWeight: 600, marginTop: 1 }}>
                    {u.dayLabel} · {u.slot}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: color.textMuted, flexShrink: 0 }}>
                  {formatGrams(u.grams)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompraScreen() {
  const { weekMeals } = useAppState();
  const { go } = useAppActions();
  const [checked, setChecked] = useState<Record<string, boolean>>(() => loadShoppingChecked());
  const [removed, setRemoved] = useState<string[]>(() => loadShoppingRemoved());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const allItems = useMemo(() => buildShoppingList(weekMeals), [weekMeals]);
  const removedSet = useMemo(() => new Set(removed), [removed]);
  const items = useMemo(() => allItems.filter(i => !removedSet.has(i.key)), [allItems, removedSet]);
  const pending = items.filter(i => !checked[i.key]);
  const done = items.filter(i => checked[i.key]);

  function toggle(key: string) {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      storeShoppingChecked(next);
      return next;
    });
  }

  function toggleExpand(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function removeItem(key: string) {
    setRemoved(prev => {
      const next = prev.includes(key) ? prev : [...prev, key];
      storeShoppingRemoved(next);
      return next;
    });
    setExpanded(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function resetChecks() {
    clearShoppingChecked();
    setChecked({});
  }

  function restoreRemoved() {
    clearShoppingRemoved();
    setRemoved([]);
  }

  return (
    <ScreenPage>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <BackButton onClick={() => go('semana')} />
        <div style={{ flex: 1 }}>
          <Eyebrow style={{ fontSize: 13, fontWeight: 600 }}>SEMANA</Eyebrow>
          <ScreenTitle style={{ margin: 0 }}>Lista de la compra</ScreenTitle>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 500, margin: '4px 0 8px 52px' }}>
        Del plan. Despliega para ver recetas.
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '8px 0 14px',
      }}>
      <div
        data-tutorial="compra-lista"
        style={{
          flex: 1, ...cardStyle, borderRadius: radius.lg, padding: '11px 14px',
          fontSize: 13, fontWeight: 700, color: color.textBody,
        }}
      >
          {pending.length} pendientes · {done.length} hechos
        </div>
        {(done.length > 0 || removed.length > 0) && (
          <button
            type="button"
            onClick={() => {
              if (done.length > 0) resetChecks();
              if (removed.length > 0) restoreRemoved();
            }}
            style={{
              ...secondaryBtnStyle(),
              padding: '11px 14px',
              fontSize: 12.5,
              borderRadius: radius.lg,
              flexShrink: 0,
            }}
          >
            Restablecer
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div style={{ ...cardStyle, borderRadius: radius.xl, padding: 22, textAlign: 'center' }}>
          <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 800 }}>
            {allItems.length === 0 ? 'Lista vacía' : 'Todo eliminado'}
          </div>
          <div style={{ fontSize: 13.5, color: color.textMuted, marginTop: 8, lineHeight: 1.4 }}>
            {allItems.length === 0
              ? 'Genera el plan semanal primero.'
              : 'Pulsa Restablecer para recuperar.'}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {pending.map(item => (
            <ShoppingRow
              key={item.key}
              item={item}
              checked={false}
              expanded={!!expanded[item.key]}
              onToggleCheck={() => toggle(item.key)}
              onToggleExpand={() => toggleExpand(item.key)}
              onRemove={() => removeItem(item.key)}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <>
          <div style={{
            fontSize: 12, fontWeight: 800, color: color.textMuted,
            textTransform: 'uppercase', letterSpacing: 0.4, margin: '4px 2px 10px',
          }}>
            Comprado
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.map(item => (
              <ShoppingRow
                key={item.key}
                item={item}
                checked
                expanded={!!expanded[item.key]}
                onToggleCheck={() => toggle(item.key)}
                onToggleExpand={() => toggleExpand(item.key)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
          </div>
        </>
      )}
    </ScreenPage>
  );
}
