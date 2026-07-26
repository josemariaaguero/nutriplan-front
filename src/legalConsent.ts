const FOREVER_KEY = 'nutriplan_legal_dismissed_v1';
const SESSION_KEY = 'nutriplan_legal_session_ok_v1';

export function hasDismissedForever(): boolean {
  try {
    return localStorage.getItem(FOREVER_KEY) === '1';
  } catch {
    return false;
  }
}

export function hasAcceptedSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function shouldShowLegalModal(): boolean {
  if (hasDismissedForever()) return false;
  if (hasAcceptedSession()) return false;
  return true;
}

export function acceptSession(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function dismissForever(): void {
  try {
    localStorage.setItem(FOREVER_KEY, '1');
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export const LEGAL_COPY = {
  title: 'Aviso importante',
  health:
    'NutriPlan y su asistente de inteligencia artificial ofrecen información y planificación orientativa. ' +
    'No sustituyen el criterio de un profesional de la salud y/o de la nutrición. Ante cualquier duda médica, ' +
    'alergia, patología o cambio de dieta, consulta siempre con un profesional cualificado.',
  cookies:
    'Usamos almacenamiento local para sesión y preferencias. Sin cookies publicitarias.',
};
