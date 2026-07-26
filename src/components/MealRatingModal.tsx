import { createPortal } from 'react-dom';
import { color, font, radius, shadow } from '../theme';
import { getAppOverlayRoot, isPhoneOverlayRoot } from '../shell';

type Rating = -1 | 0 | 1;

const FACES: { rating: Rating; emoji: string; label: string }[] = [
  { rating: 1, emoji: '😊', label: 'Me gustó' },
  { rating: 0, emoji: '😐', label: 'Normal' },
  { rating: -1, emoji: '😞', label: 'No me gustó' },
];

export default function MealRatingModal({
  mealName,
  onRate,
  onSkip,
}: {
  mealName: string;
  onRate: (rating: Rating) => void;
  onSkip: () => void;
}) {
  const root = getAppOverlayRoot();
  if (!root) return null;

  const phone = isPhoneOverlayRoot(root);

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-labelledby="meal-rating-title"
      style={{
        position: phone ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(42,37,32,.45)',
      }}
      onClick={onSkip}
    >
      <div
        data-tutorial="hoy-rating"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 320,
          background: color.surface,
          borderRadius: radius['2xl'],
          padding: '22px 20px 18px',
          boxShadow: shadow.lg,
        }}
      >
        <div
          id="meal-rating-title"
          style={{
            fontFamily: font.display,
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: -0.2,
          }}
        >
          ¿Te ha gustado?
        </div>
        <div style={{
          fontSize: 13.5,
          color: color.textMuted,
          fontWeight: 600,
          textAlign: 'center',
          marginTop: 6,
          lineHeight: 1.35,
        }}>
          {mealName}
        </div>

        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 18,
          justifyContent: 'center',
        }}>
          {FACES.map(f => (
            <button
              key={f.rating}
              type="button"
              onClick={() => onRate(f.rating)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 6px',
                borderRadius: radius.xl,
                border: `1.5px solid ${color.borderWarm}`,
                background: color.surfaceMuted,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{f.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: color.ink, textAlign: 'center' }}>
                {f.label}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSkip}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 14,
            padding: 10,
            border: 'none',
            background: 'none',
            fontSize: 13,
            fontWeight: 700,
            color: color.textMuted,
            cursor: 'pointer',
          }}
        >
          Saltar
        </button>
      </div>
    </div>,
    root,
  );
}
