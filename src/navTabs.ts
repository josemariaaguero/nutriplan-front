import type { Screen } from './types';
import type { AppState } from './store';

export const NAV_ICONS: Record<string, string> = {
  hoy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5M5 9.5V20h14V9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  semana: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="3" stroke="currentColor" stroke-width="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  asistente: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4.5 6.5A3 3 0 017.5 3.5h9a3 3 0 013 3v7a3 3 0 01-3 3H11l-3.8 2.9a.8.8 0 01-1.3-.7V16.5H7.5a3 3 0 01-3-3v-7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="12" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/></svg>',
  perfil: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.7" stroke="currentColor" stroke-width="2"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

export const NAV_TABS: { id: Screen; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'asistente', label: 'Asistente' },
  { id: 'perfil', label: 'Perfil' },
];

/** Desktop sidebar — no asistente (opened via FAB chatbox). */
export const WEB_NAV_TABS: { id: Screen; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Semana' },
  { id: 'perfil', label: 'Perfil' },
];

export function isNavTabActive(
  id: Screen,
  { screen, recipeBack, sportCtx, historyBack }: Pick<AppState, 'screen' | 'recipeBack' | 'sportCtx' | 'historyBack'>,
): boolean {
  if (screen === id) return true;
  if (id === 'asistente') return false;
  if (screen === 'historial' && id === historyBack) return true;
  if (screen === 'compra' && id === 'semana') return true;
  if (['misRecetas', 'sugerencias', 'adminSugerencias'].includes(screen) && id === 'perfil') {
    return true;
  }
  if (['receta', 'sport', 'swap', 'swapMeal'].includes(screen)) {
    if (screen === 'sport') {
      if (id === 'semana' && sportCtx.source === 'semana') return true;
      if (id === 'hoy' && sportCtx.source === 'hoy') return true;
      return false;
    }
    if (recipeBack === 'historial' && id === historyBack) return true;
    if (id === 'semana' && recipeBack === 'semana') return true;
    if (id === 'hoy' && recipeBack === 'hoy') return true;
  }
  return false;
}
