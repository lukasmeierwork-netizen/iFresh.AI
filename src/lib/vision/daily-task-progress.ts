import type { DailyTask } from '@/lib/vision/daily-tasks-api';

export type DailyTaskProgressSnapshot = {
  completed: number;
  total: number;
  ratio: number;
};

export function toPlanDateOnly(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyTaskProgress(tasks: DailyTask[]): DailyTaskProgressSnapshot {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const ratio = total === 0 ? 0 : completed / total;
  return { completed, total, ratio };
}

export function dailyTasksCompletionEqual(a: DailyTask[], b: DailyTask[]): boolean {
  if (a.length !== b.length) return false;
  const completionById = new Map(b.map((task) => [task.id, task.completed]));
  return a.every((task) => completionById.get(task.id) === task.completed);
}

/** Calendar ring ratio: undefined = unknown, null = no tasks, 0–1 = progress. */
export function resolveCalendarProgressRatio(input: {
  liveRatio?: number | null;
  cachedRatio?: number | null;
}): number | null | undefined {
  if (input.liveRatio === null) return null;
  if (typeof input.liveRatio === 'number') return input.liveRatio;
  if (input.cachedRatio === undefined) return undefined;
  return input.cachedRatio;
}
