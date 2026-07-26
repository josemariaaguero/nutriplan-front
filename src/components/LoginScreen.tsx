import { useState } from 'react';
import PasswordInput from './PasswordInput';
import { color, font, gradient, shadow, inputStyle, authPad, primaryBtnStyle } from '../theme';
import { IconLeaf } from './ui';
import { useShellMode } from '../shellContext';

interface Props {
  onLogin: (email: string, password: string) => void | Promise<void>;
  onRegister: () => void;
  onForgotPassword?: () => void;
  error?: string;
}

export default function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
  error: externalError,
}: Props) {
  const shell = useShellMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } finally {
      setLoading(false);
    }
  }

  const displayError = error || externalError;
  const pad = shell === 'web' ? { ...authPad, padding: '40px 28px 36px' } : authPad;

  return (
    <div style={pad}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22, margin: '0 auto 16px',
          background: gradient.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color.white, boxShadow: shadow.cta,
        }}>
          <IconLeaf />
        </div>
        <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
          NutriPlan
        </div>
        <div style={{ fontSize: 14, color: color.textMuted, fontWeight: 500, marginTop: 4 }}>
          Tu plan nutricional
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: color.textBody, marginBottom: 7 }}>Contraseña</div>
          <PasswordInput
            value={password}
            onChange={v => { setPassword(v); setError(''); }}
            show={showPassword}
            onToggle={() => setShowPassword(s => !s)}
            placeholder="••••••••"
          />
          {onForgotPassword && (
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <span
                onClick={onForgotPassword}
                role="button"
                style={{ fontSize: 13, fontWeight: 700, color: color.primary, cursor: 'pointer' }}
              >
                ¿Has olvidado tu contraseña?
              </span>
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <div style={{ marginTop: 10, fontSize: 13, color: color.primaryDeep, fontWeight: 600 }}>{displayError}</div>
      )}

      <button
        type="button"
        onClick={loading ? undefined : handleSubmit}
        disabled={loading}
        style={{
          ...primaryBtnStyle({ disabled: loading, padding: 17 }),
          marginTop: 26,
          width: '100%',
          borderRadius: 20,
        }}
      >
        {loading ? 'Entrando…' : 'Iniciar sesión'}
      </button>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <span style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 500 }}>
          ¿No tienes cuenta?{' '}
        </span>
        <span
          onClick={onRegister}
          role="button"
          style={{ fontSize: 13.5, fontWeight: 800, color: color.primary, cursor: 'pointer' }}
        >
          Crear cuenta gratis
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ textAlign: 'center', fontSize: 12, color: color.textDisabled, marginTop: 24 }}>
        Al continuar aceptas nuestros Términos y Política de privacidad
      </div>
    </div>
  );
}
