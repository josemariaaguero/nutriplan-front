import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { getAppOverlayRoot, isPhoneOverlayRoot } from '../shell';

type Props = {
  children: ReactNode;
  onClose?: () => void;
  /** Max height of the sheet as % of the overlay root */
  maxHeight?: string;
};

const DISMISS_PX = 110;
const DISMISS_VELOCITY = 0.65; // px/ms downward

/**
 * Overlay dialog: bottom sheet on phone mockup, centered modal on web.
 * Portals into `.phone-screen` (mockup) or `.app-root` (web).
 * On phone: swipe down from the handle (or top of sheet when scrolled to top) to dismiss.
 */
export default function PhoneSheet({ children, onClose, maxHeight = '92%' }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    lastY: number;
    lastT: number;
    offset: number;
    active: boolean;
  } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const reduceMotion =
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const scroll = document.querySelector('.np-scroll') as HTMLElement | null;
    if (!scroll) return;
    const prev = scroll.style.overflowY;
    scroll.style.overflowY = 'hidden';
    return () => {
      scroll.style.overflowY = prev;
    };
  }, []);

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const root = getAppOverlayRoot();
  if (!root) return null;

  const phone = isPhoneOverlayRoot(root);

  function finishDrag(velocityY: number) {
    const offset = dragRef.current?.offset ?? 0;
    dragRef.current = null;
    setDragging(false);
    if (onClose && (offset >= DISMISS_PX || velocityY >= DISMISS_VELOCITY)) {
      onClose();
      return;
    }
    setDragY(0);
  }

  function onHandlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!phone || !onClose) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: now,
      offset: 0,
      active: true,
    };
    setDragging(true);
  }

  function onSheetPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!phone || !onClose || dragRef.current?.active) return;
    // Only start a dismiss drag when content is at the top and user pulls down
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-sheet-handle], input, textarea, select, button, a, [role="button"]')) {
      return;
    }

    const now = performance.now();
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: now,
      offset: 0,
      active: false, // armed until we confirm downward intent
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dy = e.clientY - drag.startY;
    const now = performance.now();

    if (!drag.active) {
      // Need clear downward pull; upward / tiny moves stay as scroll
      if (dy < 10) {
        if (dy < -6) dragRef.current = null; // user is scrolling up
        return;
      }
      if (sheetRef.current && sheetRef.current.scrollTop > 0) {
        dragRef.current = null;
        return;
      }
      drag.active = true;
      setDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    e.preventDefault();
    const offset = Math.max(0, dy);
    drag.offset = offset;
    drag.lastY = e.clientY;
    drag.lastT = now;
    setDragY(offset);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dt = Math.max(1, performance.now() - drag.lastT);
    const velocityY = (e.clientY - drag.lastY) / dt;
    if (!drag.active) {
      dragRef.current = null;
      setDragging(false);
      return;
    }
    finishDrag(velocityY);
  }

  function onPointerCancel(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    setDragY(0);
  }

  const backdropOpacity = phone
    ? Math.max(0.12, 0.45 * (1 - Math.min(dragY, 280) / 280))
    : 0.45;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: phone ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 200,
        background: `rgba(42,37,32,${backdropOpacity})`,
        display: 'flex',
        alignItems: phone ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: phone ? 0 : 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={sheetRef}
        onPointerDown={phone ? onSheetPointerDown : undefined}
        onPointerMove={phone ? onPointerMove : undefined}
        onPointerUp={phone ? onPointerUp : undefined}
        onPointerCancel={phone ? onPointerCancel : undefined}
        style={{
          width: '100%',
          maxWidth: phone ? undefined : 440,
          maxHeight: phone ? maxHeight : 'min(85dvh, 640px)',
          overflowY: dragging ? 'hidden' : 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          background: 'var(--np-bg, #faf6f1)',
          borderRadius: phone ? '28px 28px 0 0' : 24,
          padding: phone
            ? '8px 18px calc(24px + env(safe-area-inset-bottom, 0px))'
            : '20px 20px 22px',
          boxSizing: 'border-box',
          boxShadow: phone
            ? '0 -12px 40px rgba(42,37,32,.18)'
            : '0 20px 56px rgba(42,37,32,.22)',
          transform: phone && dragY > 0 ? `translate3d(0, ${dragY}px, 0)` : undefined,
          transition: dragging || reduceMotion
            ? 'none'
            : 'transform 220ms ease, box-shadow 220ms ease',
          touchAction: dragging ? 'none' : 'pan-y',
          willChange: phone ? 'transform' : undefined,
        }}
      >
        {phone && (
          <div
            data-sheet-handle
            role="presentation"
            aria-hidden
            onPointerDown={onHandlePointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '10px 0 12px',
              margin: '0 -8px 4px',
              cursor: onClose ? 'grab' : 'default',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 40,
                height: 5,
                borderRadius: 99,
                background: '#d9cfc3',
              }}
            />
          </div>
        )}
        {children}
      </div>
    </div>,
    root,
  );
}
