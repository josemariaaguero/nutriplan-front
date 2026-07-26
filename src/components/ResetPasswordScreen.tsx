import { useState } from 'react';
import PasswordInput from './PasswordInput';
import { color, font, authPad, primaryBtnStyle } from '../theme';
import { BackButton } from './ui';
import { useShellMode } from '../shellContext';

interface Props {
  onSubmit: (password: string) => Promise<void>;
  onBack: () => void;
  error?: string;
}

export default function ResetPasswordScreen({ onSubmit, onBack, error: externalError }: Props) {
  const shell = useShellMode();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!password.trim() || !confirm.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(password);
      setDone(true);
    } catch {
      // Error shown via externalError from parent
    } finally {
      setLoading(false);
    }
  }

  const displayError = error || externalError;
  const pad = shell === 'web' ? { ...authPad, padding: '36px 28px 32px' } : authPad;

  return (
    <div style={pad}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <BackButton onClick={onBack} />
        <div>
          <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 800, letterSpacing: -0.4 }}>
            Nueva contraseña
          </div>
          <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 500 }}>
            Elige una segura
          </div>
        </div>
      </div>

      {done ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: color.textBody, margin: 0, fontWeight: 500 }}>
            Contraseña actualizada. Ya puedes iniciar sesión.
          </p>
          <button
            type="button"
            onClick={onBack}
            style={{
              ...primaryBtnStyle({ padding: 17 }),
              width: '100%',
              borderRadius: 20,
              marginTop: 8,
            }}
          >
            Ir a iniciar sesión
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: color.textBody, marginBottom: 7 }}>
                Nueva contraseña
              </div>
              <PasswordInput
                value={password}
                onChange={v => { setPassword(v); setError(''); }}
                show={showPassword}
                onToggle={() => setShowPassword(s => !s)}
                autoComplete="new-password"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: color.textBody, marginBottom: 7 }}>
                Confirmar contraseña
              </div>
              <PasswordInput
                value={confirm}
                onChange={v => { setConfirm(v); setError(''); }}
                show={showConfirm}
                onToggle={() => setShowConfirm(s => !s)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {displayError && (
            <div style={{ marginTop: 10, fontSize: 13, color: color.primaryDeep, fontWeight: 600 }}>
              {displayError}
            </div>
          )}

          <button
            type="button"
            onClick={loading ? undefined : () => void handleSubmit()}
            disabled={loading}
            style={{
              ...primaryBtnStyle({ disabled: loading, padding: 17 }),
              marginTop: 26,
              width: '100%',
              borderRadius: 20,
            }}
          >
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </>
      )}
    </div>
  );
}
