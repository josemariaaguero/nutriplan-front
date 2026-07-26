import type { HealthSummary, Provider } from './types';
import type { HealthConnectionsApi } from './api';

/** Canonical provider order for Salud + onboarding preference ids. */
export const HEALTH_PROVIDER_IDS = [
  'apple',
  'google',
  'strava',
  'fitbit',
  'garmin',
  'samsung',
] as const;

export const HEALTH_PROVIDER_LABELS: Record<string, string> = {
  apple: 'Apple Health',
  google: 'Google Fit',
  strava: 'Strava',
  fitbit: 'Fitbit',
  garmin: 'Garmin Connect',
  samsung: 'Samsung Health',
};

/** Map onboarding display name → API id (preference only, not connected). */
export const ONBOARDING_HEALTH_ID: Record<string, string> = {
  'Apple Health': 'apple',
  'Google Fit': 'google',
  'Garmin Connect': 'garmin',
  Strava: 'strava',
  Fitbit: 'fitbit',
  'Samsung Health': 'samsung',
};

export function mapHealthConnections(api: HealthConnectionsApi): {
  providers: Provider[];
  summary: HealthSummary;
} {
  const providers: Provider[] = (api.connections || []).map(c => ({
    id: c.provider,
    name: c.name || HEALTH_PROVIDER_LABELS[c.provider] || c.provider,
    on: Boolean(c.connected),
    status: (c.status as Provider['status']) || 'disconnected',
    message: c.message || '',
    lastSyncAt: c.last_sync_at,
    configured: c.configured,
    meta: c.meta || {},
  }));

  const s = api.summary || {};
  return {
    providers,
    summary: {
      kcal: Number(s.kcal || 0),
      steps: Number(s.steps || 0),
      minutes: Number(s.minutes || 0),
      lastSyncAt: s.last_sync_at ?? null,
      hasConnected: Boolean(s.has_connected),
    },
  };
}

export function formatSyncLabel(iso: string | null | undefined): string {
  if (!iso) return 'Sin sync';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'Sin sync';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'Sincronizado ahora';
  if (mins < 60) return `Sincronizado hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Sincronizado hace ${hours} h`;
  return 'Última sync hace más de un día';
}
