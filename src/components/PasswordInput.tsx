import type { CSSProperties } from 'react';
import { color, inputStyle } from '../theme';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
  style?: CSSProperties;
  autoComplete?: string;
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
          stroke={color.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke={color.textMuted} strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2M9.9 5.1A10.5 10.5 0 0112 5c6.5 0 10 7 10 7a18.3 18.3 0 01-3.3 4.3M6.1 6.1A18.4 18.4 0 002 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        stroke={color.textMuted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  show,
  onToggle,
  style,
  autoComplete = 'current-password',
}: Props) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          ...inputStyle,
          padding: '14px 48px 14px 16px',
          ...style,
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
        }}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}
