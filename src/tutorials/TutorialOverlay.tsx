import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { getAppOverlayRoot, isPhoneOverlayRoot } from '../shell';
import { color, font, primaryBtnStyle, radius, secondaryBtnStyle, shadow } from '../theme';
import type { TutorialPlacement, TutorialStep } from './types';

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 10;
const RING_RX = 16;
/** Estimated card height for placement (title + body + actions). */
const CARD_EST_H = 200;
const GAP = 14;

function measure(el: Element, root: Element): Rect {
  const er = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  return {
    top: er.top - rr.top,
    left: er.left - rr.left,
    width: er.width,
    height: er.height,
  };
}

/** Keep spotlight hole inside the overlay root (overflow clips shadows otherwise). */
function clampHole(rect: Rect, rootW: number, rootH: number): Rect {
  const top = Math.max(0, rect.top - PAD);
  const left = Math.max(0, rect.left - PAD);
  const right = Math.min(rootW, rect.left + rect.width + PAD);
  const bottom = Math.min(rootH, rect.top + rect.height + PAD);
  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function pickPlacement(
  placement: TutorialPlacement | undefined,
  hole: Rect,
  rootH: number,
  safeTop: number,
  safeBottom: number,
): 'top' | 'bottom' {
  if (placement === 'top' || placement === 'bottom') return placement;
  const spaceBelow = rootH - safeBottom - (hole.top + hole.height);
  const spaceAbove = hole.top - safeTop;
  if (spaceBelow >= CARD_EST_H + GAP) return 'bottom';
  if (spaceAbove >= CARD_EST_H + GAP) return 'top';
  return spaceBelow >= spaceAbove ? 'bottom' : 'top';
}

function cardTopFor(
  placement: 'top' | 'bottom',
  hole: Rect,
  rootH: number,
  safeTop: number,
  safeBottom: number,
): number {
  const maxTop = Math.max(safeTop, rootH - safeBottom - CARD_EST_H);
  if (placement === 'bottom') {
    const preferred = hole.top + hole.height + GAP;
    return Math.min(Math.max(preferred, safeTop), maxTop);
  }
  const preferred = hole.top - GAP - CARD_EST_H;
  return Math.min(Math.max(preferred, safeTop), maxTop);
}

type Props = {
  steps: TutorialStep[];
  stepIndex: number;
  title: string;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
};

export default function TutorialOverlay({
  steps,
  stepIndex,
  title,
  onNext,
  onSkip,
  onClose,
}: Props) {
  const step = steps[stepIndex];
  const root = getAppOverlayRoot();
  const phone = isPhoneOverlayRoot(root);
  const [rect, setRect] = useState<Rect | null>(null);
  const [rootSize, setRootSize] = useState(() => {
    const r = getAppOverlayRoot();
    return r ? { w: r.clientWidth, h: r.clientHeight } : { w: 0, h: 0 };
  });

  // Phone notch + bottom nav; web has sidebar but full-bleed overlay.
  const safeTop = phone ? 40 : 16;
  const safeBottom = phone ? 92 : 24;

  useLayoutEffect(() => {
    if (!root || !step) return;

    function update() {
      if (!root || !step) return;
      const el = document.querySelector(step.target);
      if (!el) {
        setRect(null);
        setRootSize({ w: root.clientWidth, h: root.clientHeight });
        return;
      }
      // Fixed FAB / overlays shouldn't trigger scroll jumps.
      const pos = window.getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
      setRect(measure(el, root));
      setRootSize({ w: root.clientWidth, h: root.clientHeight });
    }

    update();
    const t1 = window.setTimeout(update, 50);
    const t2 = window.setTimeout(update, 180);
    window.addEventListener('resize', update);
    const scroll = document.querySelector('.np-scroll');
    scroll?.addEventListener('scroll', update, { passive: true });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener('resize', update);
      scroll?.removeEventListener('scroll', update);
    };
  }, [root, step, stepIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' || e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNext]);

  const hole = useMemo(() => {
    if (!rect || rootSize.w <= 0 || rootSize.h <= 0) return null;
    return clampHole(rect, rootSize.w, rootSize.h);
  }, [rect, rootSize]);

  const placement = useMemo(
    () => (hole ? pickPlacement(step?.placement, hole, rootSize.h, safeTop, safeBottom) : 'bottom'),
    [hole, step?.placement, rootSize.h, safeTop, safeBottom],
  );

  const cardTop = useMemo(
    () => (hole ? cardTopFor(placement, hole, rootSize.h, safeTop, safeBottom) : safeTop),
    [hole, placement, rootSize.h, safeTop, safeBottom],
  );

  if (!root || !step) return null;

  const isLast = stepIndex >= steps.length - 1;
  const maskId = `np-tour-mask-${stepIndex}`;
  const holeRx = hole
    ? Math.min(RING_RX, Math.round(Math.min(hole.width, hole.height) / 2))
    : RING_RX;

  const cardStyle: CSSProperties = {
    position: 'absolute',
    left: 16,
    right: 16,
    top: cardTop,
    zIndex: 2,
    maxHeight: Math.max(140, rootSize.h - safeTop - safeBottom),
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  };

  return createPortal(
    <div
      className="np-tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="np-tour-title"
      style={{
        // Always absolute inside positioned root — avoids fixed/viewport mismatch on both shells.
        position: 'absolute',
        inset: 0,
        zIndex: 1200,
        pointerEvents: 'auto',
        isolation: 'isolate',
      }}
    >
      {/* Full-bleed dim with SVG cutout (not box-shadow — clipped by overflow:hidden). */}
      <svg
        aria-hidden
        width={rootSize.w || '100%'}
        height={rootSize.h || '100%'}
        viewBox={`0 0 ${Math.max(rootSize.w, 1)} ${Math.max(rootSize.h, 1)}`}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto',
          display: 'block',
        }}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x={0} y={0} width={rootSize.w} height={rootSize.h} fill="#fff" />
            {hole && hole.width > 0 && hole.height > 0 && (
              <rect
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx={holeRx}
                ry={holeRx}
                fill="#000"
              />
            )}
          </mask>
        </defs>
        <rect
          x={0}
          y={0}
          width={rootSize.w}
          height={rootSize.h}
          fill="rgba(20, 16, 12, 0.58)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Spotlight frame — clear border that stays inside the root */}
      {hole && hole.width > 0 && hole.height > 0 && (
        <div
          aria-hidden
          className="np-tutorial-spotlight"
          style={{
            position: 'absolute',
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: holeRx,
            boxSizing: 'border-box',
            border: `2.5px solid ${color.primary}`,
            boxShadow: `
              0 0 0 3px rgba(255, 255, 255, 0.92),
              0 8px 28px rgba(20, 16, 12, 0.28)
            `,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      <div
        className="np-tutorial-card"
        style={{
          ...cardStyle,
          background: color.surface,
          borderRadius: radius['2xl'],
          padding: '18px 18px 16px',
          boxShadow: shadow.lg,
          border: `1px solid ${color.borderWarm}`,
        }}
      >
        <div style={{
          fontSize: 11, fontWeight: 800, color: color.textMuted,
          textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6,
        }}>
          {title} · {stepIndex + 1}/{steps.length}
        </div>
        <div
          id="np-tour-title"
          style={{ fontFamily: font.display, fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: color.text }}
        >
          {step.title}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 500, color: color.textBody,
          lineHeight: 1.45, marginTop: 8,
        }}>
          {step.body}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={onSkip}
            className="np-tutorial-btn"
            style={{ ...secondaryBtnStyle(), flex: 1, padding: '12px 10px', fontSize: 14, cursor: 'pointer' }}
          >
            Saltar
          </button>
          <button
            type="button"
            onClick={onNext}
            className="np-tutorial-btn"
            style={{ ...primaryBtnStyle({ padding: '12px 10px' }), flex: 1.4, fontSize: 14, cursor: 'pointer' }}
          >
            {isLast ? 'Listo' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>,
    root,
  );
}
