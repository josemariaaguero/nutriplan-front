/** Bridge so the product tour can demo the meal-rating modal on Hoy. */

type HoyRatingHandler = (show: boolean) => void;

let handler: HoyRatingHandler | null = null;

export function registerHoyRatingTutorialHandler(next: HoyRatingHandler | null): void {
  handler = next;
}

export function setHoyRatingTutorialVisible(show: boolean): void {
  handler?.(show);
}
