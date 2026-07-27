import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import { color } from '../theme';

/** Normalize common model quirks before markdown parse. */
function normalizeAssistantMarkdown(text: string): string {
  return (text || '')
    .replace(/\r\n/g, '\n')
    // Fullwidth / fancy asterisks → ASCII
    .replace(/［/g, '[')
    .replace(/］/g, ']')
    .replace(/[＊✱⁎∗]/g, '*')
    // Spaces inside markers: ** texto ** → **texto**
    .replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**')
    .replace(/__\s+([^_]+?)\s+__/g, '__$1__')
    .replace(/(^|[^*])\*\s+([^*]+?)\s+\*(?!\*)/g, '$1*$2*');
}

function buildComponents(compact: boolean): Components {
  const fontSize = compact ? 13.5 : 14;
  return {
    p: ({ children }) => (
      <p style={{ margin: '0 0 8px', fontSize, fontWeight: 500, lineHeight: 1.45 }}>{children}</p>
    ),
    strong: ({ children }) => (
      <strong style={{ fontWeight: 800 }}>{children}</strong>
    ),
    em: ({ children }) => (
      <em style={{ fontStyle: 'italic' }}>{children}</em>
    ),
    code: ({ children }) => (
      <code
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '0.92em',
          background: color.surfaceMuted,
          padding: '1px 5px',
          borderRadius: 6,
          fontWeight: 600,
        }}
      >
        {children}
      </code>
    ),
    ul: ({ children }) => (
      <ul style={{ margin: '0 0 8px', paddingLeft: 18, listStyle: 'disc' }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ margin: '0 0 8px', paddingLeft: 18 }}>{children}</ol>
    ),
    li: ({ children }) => (
      <li style={{ marginBottom: 4, paddingLeft: 2, fontSize, fontWeight: 500, lineHeight: 1.45 }}>
        {children}
      </li>
    ),
    h1: ({ children }) => (
      <h1 style={{
        fontFamily: 'var(--np-font-display)', fontWeight: 800, fontSize: compact ? 16 : 17,
        margin: '0 0 6px', lineHeight: 1.3,
      }}>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 style={{
        fontFamily: 'var(--np-font-display)', fontWeight: 800, fontSize: compact ? 15 : 16,
        margin: '0 0 6px', lineHeight: 1.3,
      }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 style={{
        fontFamily: 'var(--np-font-display)', fontWeight: 800, fontSize: compact ? 14 : 15,
        margin: '0 0 6px', lineHeight: 1.3,
      }}>{children}</h3>
    ),
    a: ({ href, children }) => (
      <a href={href} style={{ color: color.primaryDeep, fontWeight: 700, textDecoration: 'underline' }}>
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: '0 0 8px',
        padding: '6px 10px',
        borderLeft: `3px solid ${color.borderWarm || '#f0e8df'}`,
        color: color.textBody,
      }}>
        {children}
      </blockquote>
    ),
  };
}

/**
 * Renders assistant markdown (bold, italic, lists, headings, code).
 * User messages stay plain text elsewhere.
 */
export default function AssistantMarkdown({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  const source = normalizeAssistantMarkdown(text);

  return (
    <div
      className="np-assistant-md"
      style={{
        fontSize: compact ? 13.5 : 14,
        fontWeight: 500,
        lineHeight: 1.45,
        wordBreak: 'break-word',
      }}
    >
      <style>{`
        .np-assistant-md > :last-child { margin-bottom: 0 !important; }
        .np-assistant-md p:last-child { margin-bottom: 0 !important; }
      `}</style>
      <ReactMarkdown components={buildComponents(compact)}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
