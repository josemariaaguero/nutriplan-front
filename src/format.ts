/** Round a numeric value for user-facing text (calculations keep decimals). */
export function n(value: number | null | undefined): number {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.round(Number(value));
}

/** Display helper that keeps "—" for empty / zero-optional macros. */
export function nOrDash(value: number | null | undefined, emptyAsDash = false): string | number {
  if (value == null || Number.isNaN(Number(value))) return emptyAsDash ? '—' : 0;
  if (emptyAsDash && Number(value) === 0) return '—';
  return Math.round(Number(value));
}
