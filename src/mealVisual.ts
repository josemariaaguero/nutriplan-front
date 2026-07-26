import type { CSSProperties } from 'react';
import type { Meal } from './types';

/** Background for meal thumbs/heroes: photo URL when present, else gradient swatch. */
export function mealBgStyle(
  meal: Pick<Meal, 'swatch' | 'image'>,
  extras: CSSProperties = {},
): CSSProperties {
  if (meal.image) {
    return {
      backgroundImage: `url(${meal.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      ...extras,
    };
  }
  return {
    backgroundImage: meal.swatch,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    ...extras,
  };
}
