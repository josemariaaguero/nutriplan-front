import { color, font, macro } from '../theme';

export type KcalRingMode = 'restantes' | 'sobre' | 'kcal';

interface Props {
  pPct: number;
  cPct: number;
  fPct: number;
  /** Number shown in the ring center (remaining, excess, or plan kcal). */
  value: number;
  /** Caption under the number. */
  mode: KcalRingMode;
}

function dash(pct: number, r: number): string {
  const C = 2 * Math.PI * r;
  const v = Math.min(Math.max(pct, 0), 1) * C;
  return `${v.toFixed(1)} ${C.toFixed(1)}`;
}

const SIZE = 118;
const CX = SIZE / 2;
const STROKE = 8;

const RINGS = [
  { r: 48, color: macro.protein.color, track: macro.protein.track, key: 'p' as const },
  { r: 37, color: macro.carbs.color, track: macro.carbs.track, key: 'c' as const },
  { r: 26, color: macro.fat.color, track: macro.fat.track, key: 'f' as const },
];

const MODE_LABEL: Record<KcalRingMode, string> = {
  restantes: 'kcal',
  sobre: 'sobre obj.',
  kcal: 'kcal',
};

export default function MacroRings({ pPct, cPct, fPct, value, mode }: Props) {
  const pcts = { p: pPct, c: cPct, f: fPct };
  const hole = 26 - STROKE / 2 - 2;
  const display =
    mode === 'sobre'
      ? `+${Math.round(Math.abs(value))}`
      : String(Math.round(value));
  const valueColor = mode === 'sobre' ? color.primaryDeep : color.text;
  // Keep center value inside the inner ring (4-digit kcal often overflow at 20px).
  const digits = display.replace(/\D/g, '').length + (display.startsWith('+') ? 0.5 : 0);
  const valueSize = digits >= 5 ? 13 : digits >= 4 ? 15 : mode === 'sobre' ? 18 : 20;
  const labelMax = Math.floor(hole * 2) - 4;

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        {RINGS.map(ring => (
          <circle
            key={`track-${ring.key}`}
            cx={CX} cy={CX} r={ring.r}
            fill="none"
            stroke={ring.track}
            strokeWidth={STROKE}
          />
        ))}
        {RINGS.map(ring => (
          <circle
            key={`prog-${ring.key}`}
            cx={CX} cy={CX} r={ring.r}
            fill="none"
            stroke={ring.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={dash(pcts[ring.key], ring.r)}
            transform={`rotate(-90 ${CX} ${CX})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <circle cx={CX} cy={CX} r={hole} fill="#fff" />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        padding: `0 ${Math.max(SIZE / 2 - hole + 2, 8)}px`,
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontFamily: font.display,
          fontSize: valueSize,
          fontWeight: 900,
          lineHeight: 1,
          color: valueColor,
          letterSpacing: digits >= 4 ? -0.9 : -0.6,
          maxWidth: '100%',
          textAlign: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          {display}
        </div>
        <div style={{
          fontSize: 8,
          fontWeight: 700,
          color: color.textMuted,
          marginTop: 2,
          letterSpacing: 0.1,
          textAlign: 'center',
          maxWidth: labelMax,
          lineHeight: 1.15,
        }}>
          {MODE_LABEL[mode]}
        </div>
      </div>
    </div>
  );
}
