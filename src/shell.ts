/** Desktop web shell breakpoint — mobile mockup stays below this. */
export const WEB_SHELL_MQ = '(min-width: 900px)';

export function matchesWebShell(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(WEB_SHELL_MQ).matches;
}

/** Overlay portal target: web shell `.app-root`, else phone `.phone-screen`. */
export function getAppOverlayRoot(): Element | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector('.app-root') || document.querySelector('.phone-screen');
}

export function isPhoneOverlayRoot(root: Element | null): boolean {
  return Boolean(root?.classList.contains('phone-screen'));
}
