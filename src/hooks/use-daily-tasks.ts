import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  fetchDailyTasksForDate,
  setDailyTaskCompletion,
  type DailyTask,
  type DailyTaskPeriod,
} from '@/lib/vision/daily-tasks-api';

const PERIOD_ORDER: readonly DailyTaskPeriod[] = ['morning', 'afternoon', 'evening', 'night'];

function toDateOnly(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sortTasks(tasks: DailyTask[]): DailyTask[] {
  return [...tasks].sort((a, b) => {
    const pa = PERIOD_ORDER.indexOf(a.period);
    const pb = PERIOD_ORDER.indexOf(b.period);
    if (pa !== pb) return pa - pb;
    if (a.position !== b.position) return a.position - b.position;
    return a.id.localeCompare(b.id);
  });
}

export type DailyTaskGroup = {
  period: DailyTaskPeriod;
  tasks: DailyTask[];
  completedCount: number;
};

export type UseDailyTasksState = {
  date: Date;
  isoDate: string;
  loading: boolean;
  error: string | null;
  tasks: DailyTask[];
  groups: DailyTaskGroup[];
  totalCount: number;
  completedCount: number;
  toggleTask: (taskId: string, nextCompleted: boolean) => Promise<void>;
  /**
   * Re-fetches the existing plan for the selected day. Never regenerates: the
   * backend only invokes Gemini when no row exists yet, so once a day is
   * generated the same rows are served until they're explicitly cleared.
   */
  refresh: () => Promise<void>;
};

export function useDailyTasks(date: Date): UseDailyTasksState {
  const { i18n } = useTranslation();
  const isoDate = useMemo(() => toDateOnly(date), [date]);

  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const next = await fetchDailyTasksForDate({
        planDate: isoDate,
        locale: i18n.resolvedLanguage ?? i18n.language,
      });
      if (requestIdRef.current !== reqId) return;
      setTasks(sortTasks(next));
    } catch (err) {
      if (requestIdRef.current !== reqId) return;
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [isoDate, i18n.resolvedLanguage, i18n.language]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTask = useCallback(
    async (taskId: string, nextCompleted: boolean) => {
      let previous: DailyTask | null = null;
      setTasks((current) => {
        previous = current.find((task) => task.id === taskId) ?? null;
        if (!previous) return current;
        return current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: nextCompleted,
                completedAt: nextCompleted ? new Date().toISOString() : null,
              }
            : task,
        );
      });
      if (!previous) return;

      try {
        const updated = await setDailyTaskCompletion({ taskId, completed: nextCompleted });
        if (updated) {
          setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
        }
      } catch (err) {
        // Roll back optimistic update on failure.
        const restore = previous;
        if (restore) {
          setTasks((current) => current.map((task) => (task.id === taskId ? restore : task)));
        }
        const message = err instanceof Error ? err.message : 'Failed to update task';
        setError(message);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const groups = useMemo<DailyTaskGroup[]>(() => {
    const buckets = new Map<DailyTaskPeriod, DailyTask[]>();
    for (const period of PERIOD_ORDER) buckets.set(period, []);
    for (const task of tasks) {
      const bucket = buckets.get(task.period);
      if (bucket) bucket.push(task);
    }
    return PERIOD_ORDER.map((period) => {
      const list = buckets.get(period) ?? [];
      return {
        period,
        tasks: list,
        completedCount: list.filter((task) => task.completed).length,
      };
    }).filter((group) => group.tasks.length > 0);
  }, [tasks]);

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  return {
    date,
    isoDate,
    loading,
    error,
    tasks,
    groups,
    totalCount: tasks.length,
    completedCount,
    toggleTask,
    refresh,
  };
}
