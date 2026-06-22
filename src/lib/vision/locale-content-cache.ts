import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailyTask } from '@/lib/vision/daily-tasks-api';
import type { NearVisionInsight } from '@/lib/vision/near-vision-results-api';
import { computeDailyTaskProgress, dailyTasksCompletionEqual } from '@/lib/vision/daily-task-progress';

const DAILY_TASKS_CACHE_PREFIX = 'eyefresh.daily-tasks-cache-v2';
const INSIGHT_CACHE_PREFIX = 'eyefresh.near-vision-insight-cache-v1';

type DailyTasksCacheEntry = {
  savedAt: string;
  tasks: DailyTask[];
};

type InsightCacheEntry = {
  savedAt: string;
  insight: NearVisionInsight;
};

const dailyTasksMemory = new Map<string, DailyTask[]>();
const dailyTasksLoadedKeys = new Set<string>();
const insightMemory = new Map<string, NearVisionInsight>();

type DailyTasksCacheListener = (cacheKey: string) => void;
const dailyTasksCacheListeners = new Set<DailyTasksCacheListener>();

export function subscribeDailyTasksCache(listener: DailyTasksCacheListener): () => void {
  dailyTasksCacheListeners.add(listener);
  return () => {
    dailyTasksCacheListeners.delete(listener);
  };
}

function notifyDailyTasksCacheChanged(cacheKey: string) {
  queueMicrotask(() => {
    for (const listener of dailyTasksCacheListeners) {
      listener(cacheKey);
    }
  });
}

export function getPlanDateFromDailyTasksCacheKey(cacheKey: string): string | null {
  const parts = cacheKey.split(':');
  return parts.length >= 3 ? (parts[2] ?? null) : null;
}

export function publishDailyTasksCache(
  input: {
    userId: string | null | undefined;
    planDate: string;
    tasks: DailyTask[];
  },
  options?: { overwrite?: boolean; notify?: boolean },
): boolean {
  const key = dailyTasksKey(input);
  const overwrite = options?.overwrite ?? true;
  const notify = options?.notify ?? true;
  const existing = dailyTasksMemory.get(key);

  if (!overwrite && dailyTasksLoadedKeys.has(key)) {
    return false;
  }

  if (existing && dailyTasksCompletionEqual(existing, input.tasks)) {
    dailyTasksLoadedKeys.add(key);
    return false;
  }

  dailyTasksMemory.set(key, input.tasks);
  dailyTasksLoadedKeys.add(key);
  if (notify) {
    notifyDailyTasksCacheChanged(key);
  }
  return true;
}

export function isDailyTasksCacheLoaded(input: {
  userId: string | null | undefined;
  planDate: string;
}): boolean {
  return dailyTasksLoadedKeys.has(dailyTasksKey(input));
}

export function readDailyTasksMemory(input: {
  userId: string | null | undefined;
  planDate: string;
}): DailyTask[] | null {
  const key = dailyTasksKey(input);
  if (!dailyTasksLoadedKeys.has(key)) return null;
  return dailyTasksMemory.get(key) ?? [];
}

function scopedKey(prefix: string, userId: string | null | undefined, suffix?: string): string {
  const uid = userId?.trim() || 'anon';
  return suffix ? `${prefix}:${uid}:${suffix}` : `${prefix}:${uid}`;
}

function dailyTasksKey(input: {
  userId: string | null | undefined;
  planDate: string;
}): string {
  return scopedKey(DAILY_TASKS_CACHE_PREFIX, input.userId, input.planDate);
}

export function getDailyTasksCacheKey(input: {
  userId: string | null | undefined;
  planDate: string;
}): string {
  return dailyTasksKey(input);
}

/** Synchronous read from the in-memory layer. */
export function peekCachedDailyTasks(input: {
  userId: string | null | undefined;
  planDate: string;
}): DailyTask[] | null {
  const key = dailyTasksKey(input);
  if (!dailyTasksLoadedKeys.has(key)) {
    const cached = dailyTasksMemory.get(key);
    return cached && cached.length > 0 ? cached : null;
  }
  return dailyTasksMemory.get(key) ?? [];
}

export function peekDailyTaskProgress(input: {
  userId: string | null | undefined;
  planDate: string;
}) {
  const tasks = readDailyTasksMemory(input);
  if (tasks === null) return null;
  return computeDailyTaskProgress(tasks);
}

export async function readCachedDailyTasks(input: {
  userId: string | null | undefined;
  planDate: string;
}): Promise<DailyTask[] | null> {
  const key = dailyTasksKey(input);
  if (isDailyTasksCacheLoaded(input)) {
    return dailyTasksMemory.get(key) ?? [];
  }

  const fromMemory = dailyTasksMemory.get(key);
  if (fromMemory && fromMemory.length > 0) {
    return fromMemory;
  }

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyTasksCacheEntry;
    if (!Array.isArray(parsed.tasks)) return null;
    publishDailyTasksCache({ ...input, tasks: parsed.tasks }, { overwrite: false });
    return parsed.tasks;
  } catch {
    return null;
  }
}

export async function writeCachedDailyTasks(input: {
  userId: string | null | undefined;
  planDate: string;
  tasks: DailyTask[];
}): Promise<void> {
  publishDailyTasksCache(input);

  const key = dailyTasksKey(input);

  try {
    const payload: DailyTasksCacheEntry = {
      savedAt: new Date().toISOString(),
      tasks: input.tasks,
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
}

/** Synchronous read from the in-memory layer (instant language switches). */
export function peekCachedNearVisionInsight(input: {
  userId: string | null | undefined;
  locale: string;
  periodDays?: number;
}): NearVisionInsight | null {
  const insight = insightMemory.get(insightKey(input));
  if (!insight) return null;
  if (
    input.periodDays != null &&
    typeof insight.periodDays === 'number' &&
    insight.periodDays !== input.periodDays
  ) {
    return null;
  }
  return insight;
}

export async function readCachedNearVisionInsight(input: {
  userId: string | null | undefined;
  locale: string;
  periodDays?: number;
}): Promise<NearVisionInsight | null> {
  const key = insightKey(input);
  const fromMemory = insightMemory.get(key);
  if (fromMemory) {
    if (
      input.periodDays != null &&
      typeof fromMemory.periodDays === 'number' &&
      fromMemory.periodDays !== input.periodDays
    ) {
      return null;
    }
    return fromMemory;
  }

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InsightCacheEntry;
    const insight = parsed.insight;
    if (
      !insight ||
      typeof insight.title !== 'string' ||
      typeof insight.body !== 'string'
    ) {
      return null;
    }
    if (
      input.periodDays != null &&
      typeof insight.periodDays === 'number' &&
      insight.periodDays !== input.periodDays
    ) {
      return null;
    }
    insightMemory.set(key, insight);
    return insight;
  } catch {
    return null;
  }
}

export async function writeCachedNearVisionInsight(input: {
  userId: string | null | undefined;
  locale: string;
  insight: NearVisionInsight;
}): Promise<void> {
  const key = insightKey(input);
  insightMemory.set(key, input.insight);

  try {
    const payload: InsightCacheEntry = {
      savedAt: new Date().toISOString(),
      insight: input.insight,
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
}

function insightKey(input: {
  userId: string | null | undefined;
  locale: string;
}): string {
  return scopedKey(INSIGHT_CACHE_PREFIX, input.userId, input.locale);
}
