import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { useLocalePreference } from '@/hooks/locale-preference-provider';
import type { DailyTaskLocaleOverlay } from '@/lib/vision/daily-task-locale-cache';
import {
  peekCachedDailyTaskLocaleOverlay,
  readCachedDailyTaskLocaleOverlay,
  writeCachedDailyTaskLocaleOverlay,
} from '@/lib/vision/daily-task-locale-cache';
import {
  peekCachedDailyTasks,
  readCachedDailyTasks,
  writeCachedDailyTasks,
} from '@/lib/vision/locale-content-cache';
import {
  applyLocaleOverlayToTasks,
  isEnglishTaskLocale,
  overlayCoversAllTasks,
} from '@/lib/vision/daily-tasks-localize';
import {
  fetchDailyTasksForDate,
  setDailyTaskCompletion,
  translateDailyTasks,
  type DailyTask,
  type DailyTaskPeriod,
} from '@/lib/vision/daily-tasks-api';
import { normalizeTaskContentLocale } from '@/lib/vision/task-locales';

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
  translating: boolean;
  error: string | null;
  localeContentMissing: boolean;
  tasks: DailyTask[];
  groups: DailyTaskGroup[];
  totalCount: number;
  completedCount: number;
  toggleTask: (taskId: string, nextCompleted: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useDailyTasks(date: Date): UseDailyTasksState {
  const { user } = useAuth();
  const { resolvedLanguage } = useLocalePreference();
  const isoDate = useMemo(() => toDateOnly(date), [date]);
  const normalizedLocale = useMemo(
    () => normalizeTaskContentLocale(resolvedLanguage),
    [resolvedLanguage],
  );

  const cacheInput = useMemo(
    () => ({
      userId: user?.id,
      planDate: isoDate,
    }),
    [isoDate, user?.id],
  );

  const localeCacheInput = useMemo(
    () => ({
      userId: user?.id,
      planDate: isoDate,
      locale: normalizedLocale,
    }),
    [isoDate, normalizedLocale, user?.id],
  );

  const [sourceTasks, setSourceTasks] = useState<DailyTask[]>(() => {
    const cached = peekCachedDailyTasks(cacheInput);
    return cached ? sortTasks(cached) : [];
  });
  const [localeOverlay, setLocaleOverlay] = useState<DailyTaskLocaleOverlay | null>(() => {
    if (isEnglishTaskLocale(normalizedLocale)) return null;
    return peekCachedDailyTaskLocaleOverlay(localeCacheInput);
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const cached = peekCachedDailyTasks(cacheInput);
    return !(cached && cached.length > 0);
  });
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const translateRequestIdRef = useRef(0);

  const loadFromNetwork = useCallback(
    async (reqId: number) => {
      try {
        const next = await fetchDailyTasksForDate({ planDate: isoDate });
        if (requestIdRef.current !== reqId) return;
        const sorted = sortTasks(next);
        setSourceTasks(sorted);
        if (sorted.length > 0) {
          void writeCachedDailyTasks({
            ...cacheInput,
            tasks: sorted,
          });
        }
      } catch (err) {
        if (requestIdRef.current !== reqId) return;
        const message = err instanceof Error ? err.message : 'Failed to load tasks';
        setError(message);
      } finally {
        if (requestIdRef.current === reqId) {
          setLoading(false);
        }
      }
    },
    [cacheInput, isoDate],
  );

  const load = useCallback(
    async (options?: { forceNetwork?: boolean }) => {
      const reqId = ++requestIdRef.current;
      setError(null);

      const memoryCached = peekCachedDailyTasks(cacheInput);
      if (memoryCached && memoryCached.length > 0 && !options?.forceNetwork) {
        setSourceTasks(sortTasks(memoryCached));
        setLoading(false);
        return;
      }

      const cached = await readCachedDailyTasks(cacheInput);
      if (requestIdRef.current !== reqId) return;

      if (cached && cached.length > 0 && !options?.forceNetwork) {
        setSourceTasks(sortTasks(cached));
        setLoading(false);
        return;
      }

      setLoading(true);
      await loadFromNetwork(reqId);
    },
    [cacheInput, loadFromNetwork],
  );

  useLayoutEffect(() => {
    const cached = peekCachedDailyTasks(cacheInput);
    if (cached && cached.length > 0) {
      setSourceTasks(sortTasks(cached));
      setLoading(false);
      return;
    }
    setSourceTasks([]);
    setLoading(true);
  }, [cacheInput]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      const cached = peekCachedDailyTasks(cacheInput);
      if (cached && cached.length > 0) {
        setSourceTasks(sortTasks(cached));
        setLoading(false);
        return;
      }
      void load();
    }, [cacheInput, load]),
  );

  useLayoutEffect(() => {
    if (sourceTasks.length === 0) {
      setLocaleOverlay(null);
      setTranslating(false);
      return;
    }

    if (isEnglishTaskLocale(normalizedLocale)) {
      setLocaleOverlay(null);
      setTranslating(false);
      return;
    }

    const cached = peekCachedDailyTaskLocaleOverlay(localeCacheInput);
    if (cached && overlayCoversAllTasks(sourceTasks, cached)) {
      setLocaleOverlay(cached);
      setTranslating(false);
      return;
    }

    const reqId = ++translateRequestIdRef.current;
    let cancelled = false;
    setTranslating(true);
    setError(null);

    void (async () => {
      const stored = await readCachedDailyTaskLocaleOverlay(localeCacheInput);
      if (cancelled || translateRequestIdRef.current !== reqId) return;

      if (stored && overlayCoversAllTasks(sourceTasks, stored)) {
        setLocaleOverlay(stored);
        setTranslating(false);
        return;
      }

      try {
        const overlay = await translateDailyTasks({
          locale: normalizedLocale,
          tasks: sourceTasks,
        });
        if (cancelled || translateRequestIdRef.current !== reqId) return;

        await writeCachedDailyTaskLocaleOverlay({
          ...localeCacheInput,
          overlay,
        });
        setLocaleOverlay(overlay);
      } catch (err) {
        if (cancelled || translateRequestIdRef.current !== reqId) return;
        const message = err instanceof Error ? err.message : 'Failed to translate tasks';
        setError(message);
        setLocaleOverlay(null);
      } finally {
        if (!cancelled && translateRequestIdRef.current === reqId) {
          setTranslating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [localeCacheInput, normalizedLocale, sourceTasks]);

  const tasks = useMemo(
    () => sortTasks(applyLocaleOverlayToTasks(sourceTasks, localeOverlay, normalizedLocale)),
    [localeOverlay, normalizedLocale, sourceTasks],
  );

  const localeContentMissing = useMemo(
    () =>
      !loading &&
      !translating &&
      !error &&
      sourceTasks.length > 0 &&
      !isEnglishTaskLocale(normalizedLocale) &&
      !overlayCoversAllTasks(sourceTasks, localeOverlay),
    [error, loading, localeOverlay, normalizedLocale, sourceTasks, translating],
  );

  const groups = useMemo<DailyTaskGroup[]>(() => {
    if (localeContentMissing || translating) return [];

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
  }, [localeContentMissing, tasks, translating]);

  const toggleTask = useCallback(
    async (taskId: string, nextCompleted: boolean) => {
      let previous: DailyTask | null = null;

      const updateTasks = (current: DailyTask[]) => {
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
      };

      setSourceTasks((current) => {
        const next = updateTasks(current);
        void writeCachedDailyTasks({ ...cacheInput, tasks: next });
        return next;
      });

      if (!previous) return;

      try {
        const updated = await setDailyTaskCompletion({ taskId, completed: nextCompleted });
        if (updated) {
          setSourceTasks((current) => {
            const next = current.map((task) => (task.id === updated.id ? updated : task));
            void writeCachedDailyTasks({ ...cacheInput, tasks: next });
            return next;
          });
        }
      } catch (err) {
        const restore = previous;
        if (restore) {
          setSourceTasks((current) => {
            const next = current.map((task) => (task.id === taskId ? restore : task));
            void writeCachedDailyTasks({ ...cacheInput, tasks: next });
            return next;
          });
        }
        const message = err instanceof Error ? err.message : 'Failed to update task';
        setError(message);
      }
    },
    [cacheInput],
  );

  const refresh = useCallback(async () => {
    await load({ forceNetwork: true });
  }, [load]);

  const completedCount = useMemo(() => sourceTasks.filter((t) => t.completed).length, [sourceTasks]);

  return {
    date,
    isoDate,
    loading,
    translating,
    error,
    localeContentMissing,
    tasks,
    groups,
    totalCount: sourceTasks.length,
    completedCount,
    toggleTask,
    refresh,
  };
}
