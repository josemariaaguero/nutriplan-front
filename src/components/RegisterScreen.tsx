import { useState } from 'react';
import PasswordInput from './PasswordInput';
import { color, font, inputStyle, authPad, primaryBtnStyle } from '../theme';
import { BackButton } from './ui';
import { useShellMode } from '../shellContext';

interface Props {
  onContinue: (name: string, email: string, password: string) => void | Promise<void>;
  onLogin: () => void;
  error?: string;
}

export default function RegisterScreen({ onContinue, onLogin, error: externalError }: Props) {
  const shell = useShellMode();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password.trim()) {
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
      await onContinue(name.trim(), email.trim(), password);
    } finally {
      setLoading(false);
    }
  }

  const displayError = error || externalError;
  const pad = shell === 'web' ? { ...authPad, padding: '36px 28px 32px' } : authPad;

  return (
    <div style={pad}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <BackButton onClick={onLogin} />
        <div>
          <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 800, letterSpacing: -0.4 }}>
            Crear cuenta
          </div>
          <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 500 }}>
            Personaliza tu plan
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: color.textBody, marginBottom: 7 }}>Nombre</div>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="Tu nombre"
            style={inputStyle}
          />
        </div>
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
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: color.textBody, marginBottom: 7 }}>Confirmar contraseña</div>
          <PasswordInput
            value={confirm}
            onChange={v => { setConfirm(v); setError(''); }}
            show={showConfirm}
            onToggle={() => setShowConfirm(s => !s)}
            placeholder="Repite tu contraseña"
          />
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
        {loading ? 'Creando cuenta…' : 'Continuar'}
      </button>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <span style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 500 }}>
          ¿Ya tienes cuenta?{' '}
        </span>
        <span
          onClick={onLogin}
          role="button"
          style={{ fontSize: 13.5, fontWeight: 800, color: color.primary, cursor: 'pointer' }}
        >
          Iniciar sesión
        </span>
      </div>
    </div>
  );
}
