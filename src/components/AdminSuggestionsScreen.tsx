import { useEffect, useState } from 'react';
import { fetchAdminSuggestions, replySuggestion, type SuggestionApi } from '../api';
import { useAppActions, useAppState } from '../store';
import { color, cardStyle, chipStyle, inputStyle } from '../theme';
import { Btn, EmptyState, ScreenHeader, ScreenPage } from './ui';

export default function AdminSuggestionsScreen() {
  const { user } = useAppState();
  const { go } = useAppActions();
  const [items, setItems] = useState<SuggestionApi[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'answered'>('open');
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      setItems(await fetchAdminSuggestions(status));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user.isSuperadmin) return;
    void reload();
  }, [filter, user.isSuperadmin]);

  if (!user.isSuperadmin) {
    return (
      <ScreenPage>
        <ScreenHeader title="Sugerencias" onBack={() => go('perfil')} />
        <EmptyState title="Sin acceso" />
      </ScreenPage>
    );
  }

  async function sendReply(id: number) {
    const reply = (replyDrafts[id] || '').trim();
    if (!reply) return;
    setBusyId(id);
    try {
      await replySuggestion(id, reply);
      setReplyDrafts(prev => ({ ...prev, [id]: '' }));
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  const statusLabel = (s: string) => (s === 'answered' ? 'Respondida' : 'Abierta');

  return (
    <ScreenPage>
      <ScreenHeader title="Bandeja" subtitle="Sugerencias" onBack={() => go('perfil')} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {([
          ['open', 'Abiertas'],
          ['answered', 'Respondidas'],
          ['all', 'Todas'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} style={chipStyle(filter === id)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: color.textMuted, fontWeight: 600 }}>Cargando…</div>
      ) : items.length === 0 ? (
        <EmptyState title="Nada aquí" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: color.textMuted }}>
                {item.user_name || 'Usuario'} · {statusLabel(item.status)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>{item.body}</div>
              {item.admin_reply ? (
                <div style={{ marginTop: 10, fontSize: 13.5, color: color.textMuted }}>
                  Respuesta: {item.admin_reply}
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    value={replyDrafts[item.id] || ''}
                    onChange={e => setReplyDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                    rows={3}
                    placeholder="Respuesta…"
                    style={{ ...inputStyle, width: '100%', resize: 'vertical', marginBottom: 8 }}
                  />
                  <Btn busy={busyId === item.id} onClick={() => void sendReply(item.id)}>
                    Responder
                  </Btn>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScreenPage>
  );
}
