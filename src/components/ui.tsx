import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';
import {
  backBtnStyle,
  color,
  darkBtnStyle,
  font,
  primaryBtnStyle,
  secondaryBtnStyle,
  shadow,
  gradient,
} from '../theme';
import { useShellMode } from '../shellContext';

/* ── Icons (no emoji) ─────────────────────────────────────────── */

export function IconBack({ stroke = color.text }: { stroke?: string }) {
  return (
    <svg width="11" height="18" viewBox="0 0 12 20" aria-hidden>
      <path d="M10 2L2 10l8 8" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconFlame() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c1.5 3 2 4.5 2 6.5a4 4 0 01-8 0c0-1 .2-2 .7-3C8.5 8 9.5 9 11 9c0-2.5 1-4.5 1-6z"
        fill="currentColor"
        opacity=".95"
      />
      <path
        d="M12 22a6.5 6.5 0 01-6.5-6.5c0-2.2 1.1-3.9 2.4-5.3.4 2 1.8 3.3 3.6 3.3 0-1.8.7-3.4 1.7-4.7.7 1.2 1.3 2.6 1.3 4.2A6.5 6.5 0 0112 22z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" fill="currentColor" />
    </svg>
  );
}

export function IconLeaf() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19c8-1 12-5 14-14-8 1-13 5-14 14z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5 19c3-3 6-5 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSparkles() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.2 4.2L17.5 8.5 13.2 9.8 12 14l-1.2-4.2L6.5 8.5l4.3-1.3L12 3z" fill="currentColor" />
      <path d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z" fill="currentColor" />
    </svg>
  );
}

export function IconSpinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="np-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconWave() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12.5h3.5l2-4.5 2.5 8 2.5-6 1.5 2.5H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconApple() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16.5 7.5c-1 .1-2.2.8-2.9 1.6-.7-.7-1.8-1.5-2.9-1.5-2.4.1-4.2 2.2-4.2 5 0 3.6 2.8 7.9 5.1 7.9.8 0 1.4-.4 2.1-.4s1.3.4 2.1.4c2.2 0 3.8-2.7 4.7-4.3-2.9-1.2-3.4-5.5-.7-7.1-.8-.9-2-1.6-3.3-1.6z"
        fill="currentColor"
      />
      <path d="M14.2 4.2c.2 1.2-.4 2.4-1.3 3.1-.9-.9-1.3-2.2-1.1-3.3 1-.1 2 .2 2.4.2z" fill="currentColor" />
    </svg>
  );
}

export function IconRun() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="14.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 13.5l3.2-1.2 2.3 2.4 3-1.5 2.2 3.2M10.5 12l-1.2 5.5M15.5 13.5l2.5 2.2 2 .8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCart() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 5h2l1.2 9.2a2 2 0 002 1.8h8.6a2 2 0 001.95-1.55L20.5 8H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.5" fill="currentColor" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconWatch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="7" width="12" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M9 17v1.5A1.5 1.5 0 0010.5 20h3a1.5 1.5 0 001.5-1.5V17" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v3l2 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconActivity() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12h4l2-5 3 10 2-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHeartPulse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19.5 12.5c2-2 2-5.2 0-7.1a4.8 4.8 0 00-6.9 0L12 6l-.6-.6a4.8 4.8 0 00-6.9 0c-2 1.9-2 5.1 0 7.1L12 20l7.5-7.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Layout primitives ────────────────────────────────────────── */

type DivProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  role?: string;
};

export function ScreenPage({ children, className = '', style, pad = 'tab' }: DivProps & { pad?: 'tab' | 'auth' | 'none' }) {
  const shell = useShellMode();
  const padStyle =
    pad === 'tab'
      ? shell === 'web'
        ? { padding: '36px 28px 48px' }
        : {
            paddingTop: 'max(64px, calc(48px + env(safe-area-inset-top, 0px)))',
            paddingRight: 20,
            paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
            paddingLeft: 20,
          }
      : pad === 'auth'
        ? shell === 'web'
          ? { padding: '40px 28px 36px', display: 'flex', flexDirection: 'column' as const, minHeight: '100%' }
          : {
              paddingTop: 'max(64px, calc(48px + env(safe-area-inset-top, 0px)))',
              paddingRight: 28,
              paddingBottom: 'max(40px, env(safe-area-inset-bottom, 0px))',
              paddingLeft: 28,
              display: 'flex',
              flexDirection: 'column' as const,
              minHeight: '100%',
            }
        : {};
  return (
    <div className={`np-page ${className}`.trim()} style={{ ...padStyle, ...style }}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="np-eyebrow"
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: color.primaryDeep,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ScreenTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="np-title"
      style={{
        fontFamily: font.display,
        fontSize: 30,
        fontWeight: 800,
        letterSpacing: -0.5,
        lineHeight: 1.05,
        color: color.text,
        marginTop: 2,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function MutedSubtitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: 13, color: color.textMuted, fontWeight: 500, lineHeight: 1.35, marginTop: 4, ...style }}>
      {children}
    </div>
  );
}

/** Standard sub-screen / tab header: optional back, title, short subtitle, optional right slot. */
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  right,
  style,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, ...style }}>
      {onBack && <BackButton onClick={onBack} style={{ marginTop: eyebrow ? 18 : 4 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow != null && <Eyebrow>{eyebrow}</Eyebrow>}
        <ScreenTitle style={{ fontSize: onBack && !eyebrow ? 24 : 30 }}>{title}</ScreenTitle>
        {subtitle != null && <MutedSubtitle>{subtitle}</MutedSubtitle>}
      </div>
      {right}
    </div>
  );
}

export function SectionTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: font.display,
        fontSize: 18,
        fontWeight: 800,
        color: color.text,
        margin: '26px 2px 12px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FieldLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: color.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 7,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Soft info / tip banner. */
export function Notice({
  children,
  tone = 'info',
  style,
}: {
  children: ReactNode;
  tone?: 'info' | 'warm';
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 12.5,
        lineHeight: 1.45,
        color: color.textMuted,
        fontWeight: 500,
        background: tone === 'warm' ? color.bannerWarm : color.primarySoft,
        borderRadius: 14,
        padding: '10px 12px',
        marginBottom: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Empty list / blank state card. */
export function EmptyState({
  title,
  body,
  action,
  style,
}: {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: color.surface,
        borderRadius: 22,
        boxShadow: shadow.md,
        padding: 20,
        ...style,
      }}
    >
      <div style={{ fontFamily: font.display, fontSize: 16, fontWeight: 800, color: color.text }}>{title}</div>
      {body != null && (
        <div style={{ fontSize: 13.5, color: color.textMuted, fontWeight: 500, marginTop: 6, lineHeight: 1.4 }}>
          {body}
        </div>
      )}
      {action != null && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function BackButton({ onClick, style }: { onClick: () => void; style?: CSSProperties }) {
  return (
    <button type="button" aria-label="Volver" onClick={onClick} className="np-back" style={{ ...backBtnStyle, ...style }}>
      <IconBack />
    </button>
  );
}

export function Avatar({
  initial,
  size = 46,
  onClick,
}: {
  initial: string;
  size?: number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient.avatar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color.white,
        fontFamily: font.display,
        fontWeight: 800,
        fontSize: size > 40 ? 18 : 14,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: shadow.avatar,
        transition: 'opacity .2s ease',
      }}
    >
      {initial}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'dark';
  busy?: boolean;
  block?: boolean;
};

export function Btn({
  variant = 'primary',
  busy,
  block = true,
  children,
  style,
  disabled,
  ...rest
}: BtnProps) {
  const base =
    variant === 'primary' ? primaryBtnStyle({ disabled: disabled || busy })
      : variant === 'secondary' ? secondaryBtnStyle()
        : darkBtnStyle({ busy });

  return (
    <button
      type="button"
      disabled={disabled || busy}
      style={{
        ...base,
        width: block ? '100%' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
