import { useState, type CSSProperties } from 'react';
import PhoneSheet from './PhoneSheet';
import { color, font, radius } from '../theme';

const KCAL_PRESETS = [400, 600, 800, 1000] as const;

export type OtherFoodSavePayload = {
  name: string;
  estimate: null | { kcal: number; p?: number; c?: number; f?: number };
};

type Props = {
  slotLabel: string;
  onClose: () => void;
  onSave: (payload: OtherFoodSavePayload) => void;
  busy?: boolean;
};

export default function OtherFoodSheet({ slotLabel, onClose, onSave, busy }: Props) {
  const [name, setName] = useState('');
  const [withEstimate, setWithEstimate] = useState(false);
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');

  function handleSave() {
    if (!withEstimate) {
      onSave({ name: name.trim(), estimate: null });
      return;
    }
    const kcalN = Number(kcal);
    if (!Number.isFinite(kcalN) || kcalN <= 0) return;
    const payload: OtherFoodSavePayload = {
      name: name.trim(),
      estimate: { kcal: kcalN },
    };
    const pN = Number(p);
    const cN = Number(c);
    const fN = Number(f);
    if (Number.isFinite(pN) && Number.isFinite(cN) && Number.isFinite(fN) && (p || c || f)) {
      payload.estimate.p = pN;
      payload.estimate.c = cN;
      payload.estimate.f = fN;
    }
    onSave(payload);
  }

  const canSave = !withEstimate || (Number(kcal) > 0 && Number.isFinite(Number(kcal)));

  return (
    <PhoneSheet onClose={onClose} maxHeight="88%">
      <div style={{ padding: '8px 20px 28px' }}>
        <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          He comido otra cosa
        </div>
        <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 600, marginBottom: 18 }}>
          En lugar del {slotLabel.toLowerCase()} del plan. La estimación es opcional.
        </div>

        <label style={labelStyle}>Nombre (opcional)</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Menú del trabajo, tostadas…"
          style={inputStyle}
        />

        <button
          type="button"
          onClick={() => setWithEstimate(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: radius.lg,
            border: `1.5px solid ${withEstimate ? color.borderAccent : color.border}`,
            background: withEstimate ? color.surfaceMuted : color.surface,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: `2px solid ${withEstimate ? color.primary : color.border}`,
              background: withEstimate ? color.primary : color.surface,
              color: color.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {withEstimate ? '✓' : ''}
          </span>
          <span>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Añadir estimación aproximada</div>
            <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 600, marginTop: 2 }}>
              Si no la añades, el plato del plan no cuenta y no inventamos kcal.
            </div>
          </span>
        </button>

        {withEstimate && (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Kcal aproximadas</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={kcal}
              onChange={e => setKcal(e.target.value)}
              placeholder="ej. 700"
              style={inputStyle}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {KCAL_PRESETS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setKcal(String(v))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: radius.pill,
                    border: `1.5px solid ${kcal === String(v) ? color.primary : color.border}`,
                    background: kcal === String(v) ? color.primary : color.surface,
                    color: kcal === String(v) ? color.white : color.text,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ~{v}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 600, margin: '14px 0 8px' }}>
              Macros opcionales (g)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <MacroField label="P" value={p} onChange={setP} />
              <MacroField label="C" value={c} onChange={setC} />
              <MacroField label="G" value={f} onChange={setF} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} style={secondaryBtn} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || busy}
            style={{
              ...primaryBtn,
              opacity: !canSave || busy ? 0.55 : 1,
            }}
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </PhoneSheet>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ ...labelStyle, marginBottom: 4 }}>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, padding: '10px 10px' }}
      />
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  color: color.textMuted,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: radius.lg,
  border: `1.5px solid ${color.border}`,
  background: color.surface,
  fontSize: 15,
  fontWeight: 600,
  color: color.text,
  outline: 'none',
};

const primaryBtn: CSSProperties = {
  flex: 1,
  padding: '13px 16px',
  borderRadius: radius.lg,
  border: 'none',
  background: color.primary,
  color: color.white,
  fontSize: 15,
  fontWeight: 800,
  cursor: 'pointer',
};

const secondaryBtn: CSSProperties = {
  flex: 1,
  padding: '13px 16px',
  borderRadius: radius.lg,
  border: `1.5px solid ${color.border}`,
  background: color.surface,
  color: color.text,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};
