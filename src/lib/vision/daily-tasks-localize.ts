import type { TFunction } from 'i18next';

import type { DailyTaskLocaleOverlay } from '@/lib/vision/daily-task-locale-cache';
import type { DailyTask, TaskLocaleCopy } from '@/lib/vision/daily-tasks-api';
import { resolveDailyTaskTheme } from '@/lib/vision/daily-task-theme';
import { normalizeTaskContentLocale } from '@/lib/vision/task-locales';

export type DailyTaskDisplayText = {
  title: string;
  description: string;
  categoryLabel: string;
};

export function isEnglishTaskLocale(locale: string): boolean {
  return normalizeTaskContentLocale(locale) === 'en';
}

/** Apply a frontend locale overlay to English source tasks for display. */
export function applyLocaleOverlayToTasks(
  sourceTasks: DailyTask[],
  overlay: DailyTaskLocaleOverlay | null,
  locale: string,
): DailyTask[] {
  const normalized = normalizeTaskContentLocale(locale);

  if (isEnglishTaskLocale(normalized)) {
    return sourceTasks.map((task) => ({
      ...task,
      translations: {
        en: { title: task.title, description: task.description },
      },
    }));
  }

  if (!overlay) return [];

  return sourceTasks
    .map((task) => {
      const copy = overlay[task.id];
      if (!copy?.title?.trim() || !copy?.description?.trim()) return null;
      return {
        ...task,
        title: copy.title,
        description: copy.description,
        translations: { [normalized]: copy },
      };
    })
    .filter((task): task is DailyTask => task != null);
}

export function overlayCoversAllTasks(
  sourceTasks: DailyTask[],
  overlay: DailyTaskLocaleOverlay | null,
): boolean {
  if (sourceTasks.length === 0) return false;
  if (!overlay) return false;
  return sourceTasks.every((task) => {
    const copy = overlay[task.id];
    return Boolean(copy?.title?.trim() && copy?.description?.trim());
  });
}

export function getDailyTaskDisplayText(
  task: DailyTask,
  t: TFunction,
  _locale: string,
): DailyTaskDisplayText {
  const theme = resolveDailyTaskTheme(task.category);
  const categoryLabel = t(`task.category.${task.category}`, {
    defaultValue: t(`task.category.${theme}`, {
      defaultValue: task.category.replace(/-/g, ' ').toUpperCase(),
    }),
  });

  return {
    title: task.title,
    description: task.description,
    categoryLabel,
  };
}
