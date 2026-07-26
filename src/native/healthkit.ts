/**
 * Capacitor HealthKit stub — prepared for a native iOS build.
 * In the PWA / web runtime this never syncs; callers should treat the result
 * as needs_native.
 */

export type HealthKitAvailability = {
  available: boolean;
  platform: 'ios' | 'web' | 'android' | 'unknown';
  message: string;
};

export async function getHealthKitAvailability(): Promise<HealthKitAvailability> {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  const isNative = Boolean(cap?.isNativePlatform?.());
  const platform = (cap?.getPlatform?.() as HealthKitAvailability['platform']) || 'web';

  if (!isNative || platform !== 'ios') {
    return {
      available: false,
      platform: isNative ? platform : 'web',
      message:
        'Apple Health (HealthKit) solo está disponible en la app iOS nativa. En la web/PWA no se puede sincronizar.',
    };
  }

  // Future: import('@capacitor-community/health') or custom plugin and request auth.
  return {
    available: false,
    platform: 'ios',
    message:
      'HealthKit está preparado en el stub nativo, pero el plugin aún no está enlazado en este build.',
  };
}

/** Placeholder for a future native sync of today's active energy / steps. */
export async function requestHealthKitToday(): Promise<{
  ok: false;
  kcal: number;
  steps: number;
  minutes: number;
  message: string;
}> {
  const avail = await getHealthKitAvailability();
  return {
    ok: false,
    kcal: 0,
    steps: 0,
    minutes: 0,
    message: avail.message,
  };
}
