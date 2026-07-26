import type { TutorialId } from './types';

const STORAGE_KEY = 'nutriplan_tutorial_progress';

export type TutorialProgress = {
  /** Tutorials the user finished or dismissed. */
  completed: Partial<Record<TutorialId, boolean>>;
};

function read(): TutorialProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: {} };
    const parsed = JSON.parse(raw) as TutorialProgress;
    return { completed: parsed.completed || {} };
  } catch {
    return { completed: {} };
  }
}

function write(progress: TutorialProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota
  }
}

export function isTutorialCompleted(id: TutorialId): boolean {
  return Boolean(read().completed[id]);
}

export function markTutorialCompleted(id: TutorialId): void {
  const progress = read();
  progress.completed[id] = true;
  write(progress);
}

export function resetTutorial(id: TutorialId): void {
  const progress = read();
  delete progress.completed[id];
  write(progress);
}

export function resetAllTutorials(): void {
  write({ completed: {} });
}

export function getTutorialProgress(): TutorialProgress {
  return read();
}
