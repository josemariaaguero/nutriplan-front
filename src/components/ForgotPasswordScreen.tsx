import { useState } from 'react';
import { color, font, inputStyle, authPad, primaryBtnStyle } from '../theme';
import { BackButton } from './ui';
import { useShellMode } from '../shellContext';

interface Props {
  onSubmit: (email: string) => Promise<{ message: string }>;
  onBack: () => void;
  error?: string;
}

export default function ForgotPasswordScreen({ onSubmit, onBack, error: externalError }: Props) {
  const shell = useShellMode();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Introduce tu email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await onSubmit(email.trim());
      setDoneMessage(res.message);
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
            Recuperar acceso
          </div>
          <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 500 }}>
            Te enviaremos un enlace
          </div>
        </div>
      </div>

      {doneMessage ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: color.textBody, margin: 0, fontWeight: 500 }}>
            {doneMessage}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.45, color: color.textMuted, margin: 0 }}>
            Revisa también la carpeta de spam. El correo lo envía Supabase.
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
            Volver al inicio de sesión
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: color.textMuted, margin: '0 0 20px', fontWeight: 500 }}>
            Introduce el email de tu cuenta y te mandaremos un enlace para crear una nueva contraseña.
          </p>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: color.textBody, marginBottom: 7 }}>Email</div>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="tu@email.com"
              style={inputStyle}
              onKeyDown={e => { if (e.key === 'Enter' && !loading) void handleSubmit(); }}
            />
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
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </>
      )}
    </div>
  );
}
