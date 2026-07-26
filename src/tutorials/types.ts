/** Guided in-app product tours (spotlight). */

export type TutorialId =
  | 'hoy'
  | 'semana'
  | 'perfil'
  | 'asistente'
  | 'actividad'
  | 'compra'
  | 'historial'
  | 'mis-recetas'
  | 'generar-plan'
  | 'cambiar-comida'
  | 'cambiar-ingrediente';

export type TutorialPlacement = 'auto' | 'top' | 'bottom';

/** Navigation / UI prep before measuring a step target. */
export type TutorialPrep =
  | 'hoy'
  | 'swap-meal-hoy'
  | 'recipe-hoy'
  | 'swap-ing-hoy'
  | 'hoy-rating-demo';

/** Lightweight context for step `when` predicates. */
export interface TutorialAppContext {
  screen: string;
  isWebShell: boolean;
  isSuperadmin: boolean;
}

export interface TutorialStep {
  /** CSS selector; prefer `[data-tutorial="..."]`. */
  target: string;
  title: string;
  body: string;
  placement?: TutorialPlacement;
  /** Built-in navigation before measuring the target. */
  prep?: TutorialPrep;
  /** Prepare UI before measuring the target (open menus, navigate, etc.). */
  beforeShow?: () => void | Promise<void>;
  when?: (ctx: TutorialAppContext) => boolean;
}

export interface TutorialDefinition {
  id: TutorialId;
  title: string;
  /** Short label for the Perfil list. */
  label: string;
  steps: TutorialStep[];
  /** Auto-start when landing on this screen (if not completed). */
  autoScreen?: string;
  /**
   * If set, decides auto-start instead of only matching `autoScreen`.
   * Used e.g. for the web FAB tour (no dedicated asistente screen).
   */
  whenAuto?: (ctx: TutorialAppContext) => boolean;
  /** Navigate here before resolving targets (manual relaunch). */
  ensureScreen?: string;
}
