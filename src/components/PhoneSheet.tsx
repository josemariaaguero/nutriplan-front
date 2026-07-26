import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getAppOverlayRoot, isPhoneOverlayRoot } from '../shell';

type Props = {
  children: ReactNode;
  onClose?: () => void;
  /** Max height of the sheet as % of the overlay root */
  maxHeight?: string;
};

/**
 * Overlay dialog: bottom sheet on phone mockup, centered modal on web.
 * Portals into `.phone-screen` (mockup) or `.app-root` (web).
 */
export default function PhoneSheet({ children, onClose, maxHeight = '92%' }: Props) {
  useEffect(() => {
    const scroll = document.querySelector('.np-scroll') as HTMLElement | null;
    if (!scroll) return;
    const prev = scroll.style.overflowY;
    scroll.style.overflowY = 'hidden';
    return () => {
      scroll.style.overflowY = prev;
    };
  }, []);

  const root = getAppOverlayRoot();
  if (!root) return null;

  const phone = isPhoneOverlayRoot(root);

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
        background: 'rgba(42,37,32,.45)',
        display: 'flex',
        alignItems: phone ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: phone ? 0 : 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: phone ? undefined : 440,
          maxHeight: phone ? maxHeight : 'min(85dvh, 640px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: 'var(--np-bg, #faf6f1)',
          borderRadius: phone ? '28px 28px 0 0' : 24,
          padding: phone
            ? '12px 18px calc(24px + env(safe-area-inset-bottom, 0px))'
            : '20px 20px 22px',
          boxSizing: 'border-box',
          boxShadow: phone
            ? '0 -12px 40px rgba(42,37,32,.18)'
            : '0 20px 56px rgba(42,37,32,.22)',
        }}
      >
        {phone && (
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 99,
              background: '#e0d5c8',
              margin: '4px auto 14px',
            }}
          />
        )}
        {children}
      </div>
    </div>,
    root,
  );
}
