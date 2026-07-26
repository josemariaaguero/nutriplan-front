/** NutriPlan design tokens — single source for JS/inline styles */
import type { CSSProperties } from 'react';

export const color = {
  primary: '#ff6a3d',
  primaryDeep: '#e0512c',
  secondary: '#ffb02e',
  secondaryDeep: '#e8a020',
  success: '#18bd73',
  successDeep: '#11a866',
  successSoft: '#a0f0c6',
  successBg: '#edf9f3',
  successBgAlt: '#eaf3ee',
  bg: '#fff6ec',
  surface: '#fff',
  surfaceMuted: '#f6ece0',
  surfaceWarm: '#f7f2ea',
  surfaceSheet: '#faf6f1',
  border: '#f0e8df',
  borderWarm: '#efe8df',
  borderAccent: '#ffd3c2',
  divider: '#f6ece0',
  text: '#2a2520',
  textBody: '#4a4038',
  textMuted: '#9a9087',
  textSoft: '#b8aea2',
  textWarm: '#9a7a63',
  textDisabled: '#c8bfb4',
  ink: '#2a2520',
  inkSoft: '#4a4038',
  chipActiveBg: '#fff4f0',
  primarySoft: '#ffece4',
  primaryTrack: '#ffe8df',
  carbTrack: '#fff0d6',
  fatTrack: '#e3f6ec',
  fat: '#1aaa68',
  bannerWarm: '#fff1ea',
  toggleOff: '#e8dcd0',
  chevron: '#cdbfae',
  white: '#fff',
} as const;

export const gradient = {
  primary: 'linear-gradient(120deg,#ff6a3d,#ffb02e)',
  avatar: 'linear-gradient(135deg,#ffc24d,#ff6a3d)',
  selected: 'linear-gradient(140deg,#ff7a45,#ff6a3d)',
  health: 'linear-gradient(135deg,#18bd73,#11a866)',
  warmBanner: 'linear-gradient(120deg,#fff1ea,#ffe9de)',
} as const;

export const radius = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 26,
  pill: 999,
} as const;

export const shadow = {
  sm: '0 2px 8px rgba(80,60,40,.08)',
  md: '0 4px 16px rgba(80,60,40,.05)',
  lg: '0 8px 30px rgba(80,60,40,.07)',
  cta: '0 8px 20px rgba(224,122,77,.32)',
  health: '0 10px 26px rgba(77,143,110,.28)',
  avatar: '0 4px 12px rgba(224,122,77,.3)',
} as const;

export const font = {
  display: "'Nunito', system-ui, sans-serif",
  body: "'Plus Jakarta Sans', system-ui, sans-serif",
} as const;

/** Macro / accent row colors used across rings, bars, badges */
export const macro = {
  protein: { color: color.primary, track: color.primaryTrack },
  carbs: { color: color.secondaryDeep, track: color.carbTrack },
  fat: { color: color.fat, track: color.fatTrack },
} as const;

/** Goal chip colors — warm brand palette only (no purple) */
export const goalColors = [
  color.primary,
  color.success,
  color.secondary,
  '#ef6f24',
  '#5fb37a',
] as const;

/** Week-day tag colors — warm / success / muted only */
export const weekTagColors = [
  color.primary,
  color.secondary,
  '#ef6f24',
  color.secondary,
  color.textMuted,
  color.primary,
  '#5fb37a',
] as const;

export const pagePad: CSSProperties = {
  padding: '64px 20px 120px',
};

export const authPad: CSSProperties = {
  padding: '64px 28px 40px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: `2px solid ${color.border}`,
  borderRadius: radius.md,
  padding: '14px 16px',
  fontSize: 15,
  fontFamily: font.display,
  fontWeight: 600,
  outline: 'none',
  background: color.surface,
  color: color.text,
  transition: 'border-color .2s ease, box-shadow .2s ease',
};

export function chipStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 16px',
    borderRadius: radius.pill,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    transition: 'background .2s ease, border-color .2s ease, color .2s ease',
    border: active ? `2px solid ${color.primary}` : `2px solid ${color.border}`,
    background: active ? color.chipActiveBg : color.surface,
    color: active ? color.primaryDeep : color.textBody,
  };
}

export function primaryBtnStyle(opts?: { disabled?: boolean; padding?: number | string }): CSSProperties {
  const disabled = opts?.disabled;
  return {
    background: disabled ? color.border : gradient.primary,
    color: disabled ? color.textDisabled : color.white,
    borderRadius: radius.lg,
    padding: opts?.padding ?? 15,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 800,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : shadow.cta,
    transition: 'opacity .2s ease, background .2s ease',
    border: 'none',
  };
}

export function secondaryBtnStyle(): CSSProperties {
  return {
    background: color.surface,
    color: color.textBody,
    borderRadius: radius.lg,
    padding: 15,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    border: `2px solid ${color.border}`,
    transition: 'background .2s ease, border-color .2s ease',
  };
}

export function darkBtnStyle(opts?: { busy?: boolean }): CSSProperties {
  return {
    background: opts?.busy ? color.inkSoft : color.ink,
    color: color.white,
    borderRadius: radius.lg,
    cursor: opts?.busy ? 'wait' : 'pointer',
    opacity: opts?.busy ? 0.85 : 1,
    transition: 'opacity .2s ease, background .2s ease',
    border: 'none',
  };
}

export const cardStyle: CSSProperties = {
  background: color.surface,
  borderRadius: radius.xl,
  boxShadow: shadow.md,
};

export const backBtnStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: color.surface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: shadow.sm,
  flexShrink: 0,
  border: 'none',
  padding: 0,
  transition: 'background .2s ease',
};
