/** Whether the weekly plan should avoid repeating the same dish. */
export type MealRepeatPolicy = 'avoid' | 'allow';

export const DEFAULT_MEAL_REPEAT_POLICY: MealRepeatPolicy = 'avoid';

export const MEAL_REPEAT_OPTIONS: {
  id: MealRepeatPolicy;
  label: string;
  desc: string;
}[] = [
  {
    id: 'avoid',
    label: 'Máxima variedad',
    desc: 'Evita repetir el mismo plato a lo largo de la semana',
  },
  {
    id: 'allow',
    label: 'Permitir repeticiones',
    desc: 'Puede repetir platos si cocinas en batch o te gusta una comida',
  },
];

export function normalizeMealRepeatPolicy(value?: string | null): MealRepeatPolicy {
  return value === 'allow' ? 'allow' : 'avoid';
}

export function mealRepeatLabel(value?: string | null): string {
  const id = normalizeMealRepeatPolicy(value);
  return MEAL_REPEAT_OPTIONS.find(o => o.id === id)?.label ?? 'Máxima variedad';
}
