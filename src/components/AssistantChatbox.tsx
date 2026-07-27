import { useRef, useState } from 'react';
import { assistantChat } from '../api';
import { hasAcceptedSession, hasDismissedForever, LEGAL_COPY } from '../legalConsent';
import { color, cardStyle, inputStyle, radius, font, shadow } from '../theme';
import AssistantMarkdown from './AssistantMarkdown';
import { Btn } from './ui';

export type AssistantMsg = { role: 'user' | 'assistant'; content: string };

const WELCOME: AssistantMsg = {
  role: 'assistant',
  content: '¡Hola! Pregúntame lo que necesites sobre la app o dame ingredientes y te propongo recetas.',
};

export function useAssistantChat({
  legalOk,
  onNeedLegal,
}: {
  legalOk: boolean;
  onNeedLegal: () => void;
}) {
  const [messages, setMessages] = useState<AssistantMsg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    if (!legalOk && !hasAcceptedSession() && !hasDismissedForever()) {
      onNeedLegal();
      return;
    }
    const next: AssistantMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const reply = await assistantChat(next.map(m => ({ role: m.role, content: m.content })));
      setMessages([...next, { role: 'assistant', content: reply }]);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e
        ? String((e as { message: string }).message)
        : 'Sin respuesta';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return { messages, input, setInput, loading, error, bottomRef, send };
}

/** Shared message list + composer (screen or chatbox). */
export function AssistantChatBody({
  legalOk,
  onNeedLegal,
  compact = false,
}: {
  legalOk: boolean;
  onNeedLegal: () => void;
  compact?: boolean;
}) {
  const { messages, input, setInput, loading, error, bottomRef, send } = useAssistantChat({
    legalOk,
    onNeedLegal,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 8 : 10,
          padding: compact ? '12px 14px' : undefined,
          paddingBottom: compact ? 8 : 12,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              ...cardStyle,
              padding: compact ? '10px 12px' : '12px 14px',
              background: m.role === 'user' ? color.ink : color.surface,
              color: m.role === 'user' ? color.white : color.ink,
              borderRadius: m.role === 'user'
                ? `${radius.lg}px ${radius.lg}px 6px ${radius.lg}px`
                : `${radius.lg}px ${radius.lg}px ${radius.lg}px 6px`,
              boxShadow: compact ? shadow.sm : cardStyle.boxShadow,
            }}
          >
            <div style={{ fontSize: compact ? 13.5 : 14, fontWeight: 500, lineHeight: 1.45 }}>
              {m.role === 'assistant'
                ? <AssistantMarkdown text={m.content} compact={compact} />
                : <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 600 }}>Pensando…</div>
        )}
        {error && (
          <div style={{ fontSize: 13, color: color.primaryDeep, fontWeight: 600 }}>{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: compact ? '10px 14px 12px' : undefined,
          borderTop: compact ? `1px solid ${color.borderWarm}` : undefined,
          background: compact ? color.surface : undefined,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void send(); }}
            placeholder="Pregunta o ingredientes…"
            style={{ ...inputStyle, flex: 1, padding: compact ? '11px 12px' : inputStyle.padding }}
          />
          <Btn
            block={false}
            busy={loading}
            onClick={() => void send()}
            style={{ padding: compact ? '11px 14px' : '12px 16px', flexShrink: 0 }}
          >
            Enviar
          </Btn>
        </div>
        <p style={{
          fontSize: compact ? 10.5 : 11.5,
          color: color.textMuted,
          fontWeight: 500,
          margin: '8px 2px 0',
          lineHeight: 1.35,
        }}>
          {LEGAL_COPY.health}
        </p>
      </div>
    </div>
  );
}

/** Floating chatbox for desktop web shell. */
export default function AssistantChatbox({
  open,
  onClose,
  legalOk,
  onNeedLegal,
}: {
  open: boolean;
  onClose: () => void;
  legalOk: boolean;
  onNeedLegal: () => void;
}) {
  return (
    <div
      className="np-assistant-chatbox"
      role="dialog"
      aria-label="Asistente"
      aria-modal="false"
      aria-hidden={!open}
      hidden={!open}
      style={{ display: open ? 'flex' : 'none' }}
    >
      <div className="np-assistant-chatbox-header">
        <div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, letterSpacing: -0.2 }}>
            Asistente
          </div>
          <div style={{ fontSize: 12, color: color.textMuted, fontWeight: 500, marginTop: 1 }}>
            App y recetas
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar asistente"
          onClick={onClose}
          className="np-assistant-chatbox-close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <AssistantChatBody legalOk={legalOk} onNeedLegal={onNeedLegal} compact />
    </div>
  );
}
