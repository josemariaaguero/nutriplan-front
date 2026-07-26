import { color, font, radius, shadow, primaryBtnStyle, secondaryBtnStyle } from '../theme';
import { LEGAL_COPY, acceptSession, dismissForever } from '../legalConsent';
import { createPortal } from 'react-dom';
import { getAppOverlayRoot, isPhoneOverlayRoot } from '../shell';

export default function LegalConsentModal({
  onDone,
}: {
  onDone: () => void;
}) {
  const root = getAppOverlayRoot();
  if (!root) return null;

  const phone = isPhoneOverlayRoot(root);

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-labelledby="legal-consent-title"
      style={{
        position: phone ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 12,
        background: 'rgba(42,37,32,.5)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: phone ? undefined : 440,
          background: color.surface,
          borderRadius: radius['2xl'],
          padding: '20px 18px 16px',
          boxShadow: shadow.lg,
          maxHeight: '78%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          id="legal-consent-title"
          style={{
            fontFamily: font.display,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: -0.3,
          }}
        >
          {LEGAL_COPY.title}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Salud y nutrición
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: color.text, lineHeight: 1.45, margin: '6px 0 0' }}>
            {LEGAL_COPY.health}
          </p>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: color.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Cookies y almacenamiento
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: color.text, lineHeight: 1.45, margin: '6px 0 0' }}>
            {LEGAL_COPY.cookies}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            acceptSession();
            onDone();
          }}
          style={{ ...primaryBtnStyle(), width: '100%', marginTop: 18 }}
        >
          Entendido
        </button>
        <button
          type="button"
          onClick={() => {
            dismissForever();
            onDone();
          }}
          style={{ ...secondaryBtnStyle(), width: '100%', marginTop: 8 }}
        >
          No mostrar más
        </button>
      </div>
    </div>,
    root,
  );
}
