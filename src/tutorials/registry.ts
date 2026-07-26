import type { TutorialDefinition, TutorialId } from './types';

/** Prefer `[data-tutorial="id"]` selectors. */
export function tut(id: string): string {
  return `[data-tutorial="${id}"]`;
}

export const TUTORIALS: TutorialDefinition[] = [
  {
    id: 'hoy',
    title: 'Tu día',
    label: 'Hoy',
    autoScreen: 'hoy',
    steps: [
      {
        target: tut('hoy-macros'),
        title: 'Tu progreso de hoy',
        body: 'Aquí ves las kcal y macros según lo que ya has comido. El anillo se actualiza al marcar comidas.',
        placement: 'bottom',
      },
      {
        target: tut('hoy-actividad'),
        title: 'Actividad física',
        body: 'Toca aquí para registrar ejercicio. Las kcal quemadas suben tu objetivo del día.',
        placement: 'bottom',
      },
      {
        target: tut('hoy-comidas'),
        title: 'Comidas del día',
        body: 'Abre una receta, márcala como hecha o cámbiala. Solo las comidas hechas cuentan en el progreso.',
        placement: 'top',
      },
      {
        target: tut('hoy-marcar'),
        title: 'Marcar como hecha',
        body: 'Toca el círculo para indicar que ya has comido. Así se actualizan kcal y macros del día.',
        placement: 'top',
        prep: 'hoy',
      },
      {
        target: tut('hoy-rating'),
        title: '¿Te ha gustado?',
        body: 'Al marcar una comida por primera vez te preguntamos si te gustó. Así mejoramos tus próximos menús. Puedes saltarlo.',
        placement: 'top',
        prep: 'hoy-rating-demo',
      },
    ],
  },
  {
    id: 'semana',
    title: 'Plan semanal',
    label: 'Semana',
    autoScreen: 'semana',
    steps: [
      {
        target: tut('semana-titulo'),
        title: 'Tu semana',
        body: 'Cada día tiene comidas y actividad planificada. Expande un día para ver el detalle.',
        placement: 'bottom',
      },
      {
        target: tut('semana-compra'),
        title: 'Lista de la compra',
        body: 'Genera la lista a partir de las recetas de la semana.',
        placement: 'bottom',
      },
      {
        target: tut('semana-dia'),
        title: 'Días de la semana',
        body: 'Toca un día para ver comidas, cambiar platos o editar la actividad física.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'perfil',
    title: 'Tu perfil',
    label: 'Perfil',
    autoScreen: 'perfil',
    steps: [
      {
        target: tut('perfil-datos'),
        title: 'Tus datos',
        body: 'Altura, edad, actividad y dieta alimentan el cálculo de calorías.',
        placement: 'bottom',
      },
      {
        target: tut('perfil-preferencias'),
        title: 'Preferencias',
        body: 'Edita el perfil, recetas propias, historial, compra y más desde aquí.',
        placement: 'top',
      },
      {
        target: tut('perfil-cuenta'),
        title: 'Cuenta',
        body: 'Genera un plan nuevo o cierra sesión. Regenerar sustituye toda la semana.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'asistente',
    title: 'Asistente',
    label: 'Asistente',
    /** Phone: full-page asistente. Web: no stable screen — see whenAuto. */
    autoScreen: 'asistente',
    whenAuto: ctx => {
      if (ctx.isWebShell) {
        // FAB lives on main screens; web redirects away from `asistente`.
        return ['hoy', 'semana', 'perfil'].includes(ctx.screen);
      }
      return ctx.screen === 'asistente';
    },
    steps: [
      {
        target: tut('asistente-entry'),
        title: 'Tu asistente',
        body: 'Pregunta por comidas, macros o ideas desde esta pestaña.',
        placement: 'auto',
        when: ctx => !ctx.isWebShell,
      },
      {
        target: tut('asistente-fab'),
        title: 'Chat del asistente',
        body: 'En escritorio, el botón flotante abre el asistente sin salir de la pantalla.',
        placement: 'top',
        when: ctx => ctx.isWebShell,
      },
    ],
  },
  {
    id: 'actividad',
    title: 'Actividad física',
    label: 'Actividad física',
    autoScreen: 'sport',
    steps: [
      {
        target: tut('sport-objetivo'),
        title: 'Objetivo recalculado',
        body: 'Al activar actividades, suben las kcal del día y el plan se adapta.',
        placement: 'bottom',
      },
      {
        target: tut('sport-lista'),
        title: 'Elige actividades',
        body: 'Activa, indica minutos y tipo. Los cambios de hoy se guardan en tu plan.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'compra',
    title: 'Lista de la compra',
    label: 'Lista de la compra',
    autoScreen: 'compra',
    steps: [
      {
        target: tut('compra-lista'),
        title: 'Ingredientes de la semana',
        body: 'Marca lo que ya tienes. La lista se basa en las recetas del plan semanal.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'historial',
    title: 'Historial',
    label: 'Historial',
    autoScreen: 'historial',
    steps: [
      {
        target: tut('historial-lista'),
        title: 'Días anteriores',
        body: 'Consulta macros y comidas de días pasados para ver cómo vas.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'mis-recetas',
    title: 'Mis recetas',
    label: 'Mis recetas',
    autoScreen: 'misRecetas',
    steps: [
      {
        target: tut('mis-recetas-lista'),
        title: 'Tus platos',
        body: 'Guarda recetas propias y úsalas al cambiar un plato del menú.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'generar-plan',
    title: 'Generar plan nuevo',
    label: 'Generar nuevo plan',
    ensureScreen: 'perfil',
    steps: [
      {
        target: tut('perfil-generar-plan'),
        title: 'Regenerar la semana',
        body: 'Crea un menú nuevo. Te pediremos confirmación porque se sustituye todo el plan.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'cambiar-comida',
    title: 'Cambiar una comida',
    label: 'Cambiar comida',
    autoScreen: 'swapMeal',
    steps: [
      {
        target: tut('hoy-swap-comida'),
        title: 'Intercambiar el plato',
        body: 'Desde Hoy (o Semana), toca el icono de intercambio en una comida para ver alternativas.',
        placement: 'top',
        prep: 'hoy',
      },
      {
        target: tut('swap-meal-actual'),
        title: 'Tu plato actual',
        body: 'Aquí ves lo que tienes ahora. Las kcal te ayudan a comparar con las opciones.',
        placement: 'bottom',
        prep: 'swap-meal-hoy',
      },
      {
        target: tut('swap-meal-alternativas'),
        title: 'Elige una alternativa',
        body: 'Toca una opción (o una receta tuya) para previsualizarla y confirmar el cambio.',
        placement: 'top',
        prep: 'swap-meal-hoy',
      },
    ],
  },
  {
    id: 'cambiar-ingrediente',
    title: 'Cambiar un ingrediente',
    label: 'Cambiar ingrediente',
    autoScreen: 'swap',
    steps: [
      {
        target: tut('hoy-abrir-receta'),
        title: 'Abre la receta',
        body: 'Entra en una comida del día para ver ingredientes y poder sustituirlos.',
        placement: 'top',
        prep: 'hoy',
      },
      {
        target: tut('receta-ingredientes'),
        title: 'Ingredientes del plato',
        body: 'Toca un ingrediente para ver equivalencias con porciones ya ajustadas.',
        placement: 'top',
        prep: 'recipe-hoy',
      },
      {
        target: tut('swap-ing-actual'),
        title: 'Ingrediente actual',
        body: 'Ves el alimento que vas a sustituir y sus macros.',
        placement: 'bottom',
        prep: 'swap-ing-hoy',
      },
      {
        target: tut('swap-ing-alternativas'),
        title: 'Alternativas equivalentes',
        body: 'Elige un sustituto. El plan recalcula kcal y macros al confirmar.',
        placement: 'top',
        prep: 'swap-ing-hoy',
      },
    ],
  },
];

export const TUTORIAL_BY_ID: Record<TutorialId, TutorialDefinition> = Object.fromEntries(
  TUTORIALS.map(t => [t.id, t]),
) as Record<TutorialId, TutorialDefinition>;

/** Tutorials eligible to auto-start on this screen (priority = registry order). */
export function tutorialsForAutoStart(
  screen: string,
  ctx: { isWebShell: boolean; isSuperadmin: boolean },
): TutorialDefinition[] {
  const fullCtx = { screen, ...ctx };
  return TUTORIALS.filter(t => {
    if (t.whenAuto) return t.whenAuto(fullCtx);
    return t.autoScreen === screen;
  });
}

export function tutorialForScreen(screen: string): TutorialDefinition | undefined {
  return TUTORIALS.find(t => t.autoScreen === screen);
}
