import { useEffect, useState } from 'react';
import { createSuggestion, fetchMySuggestions, type SuggestionApi } from '../api';
import { useAppActions } from '../store';
import { color, cardStyle, inputStyle, radius } from '../theme';
import { Btn, EmptyState, ScreenHeader, ScreenPage, SectionTitle } from './ui';

export default function SugerenciasScreen() {
  const { go } = useAppActions();
  const [items, setItems] = useState<SuggestionApi[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function reload() {
    setLoading(true);
    try {
      setItems(await fetchMySuggestions());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function send() {
    const text = body.trim();
    if (text.length < 3) {
      setError('Escribe un poco más');
      return;
    }
    setSending(true);
    setError('');
    try {
      await createSuggestion(text);
      setBody('');
      await reload();
    } catch {
      setError('No se pudo enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <ScreenPage>
      <ScreenHeader title="Sugerencias" subtitle="Ideas y mejoras" onBack={() => go('perfil')} />

      <div style={{ ...cardStyle, padding: 16, marginBottom: 18 }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          placeholder="¿Qué mejorarías?"
          style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 10 }}
        />
        {error && <div style={{ color: color.primaryDeep, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{error}</div>}
        <Btn busy={sending} onClick={() => void send()}>
          {sending ? 'Enviando…' : 'Enviar'}
        </Btn>
      </div>

      <SectionTitle style={{ marginTop: 0 }}>Tus envíos</SectionTitle>
      {loading ? (
        <div style={{ color: color.textMuted, fontWeight: 600 }}>Cargando…</div>
      ) : items.length === 0 ? (
        <EmptyState title="Sin envíos" body="Cuando envíes una, aparecerá aquí." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: color.textMuted, textTransform: 'uppercase' }}>
                {item.status === 'answered' ? 'Respondida' : 'Abierta'} · {new Date(item.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>{item.body}</div>
              {item.admin_reply && (
                <div style={{
                  marginTop: 10, padding: 12, borderRadius: radius.sm,
                  background: color.primarySoft, fontSize: 13.5, fontWeight: 500, lineHeight: 1.4,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: color.primaryDeep, marginBottom: 4 }}>Respuesta</div>
                  {item.admin_reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScreenPage>
  );
}
