/**
 * Hourly screen-time history for the current local day.
 *
 * The store is intentionally lightweight: a 24-bucket array kept in module
 * state plus a `useSyncExternalStore`-compatible subscribe pattern. A
 * single per-minute ticker (`startUsageHistoryTicker`) credits the current
 * hour with one minute whenever the global usage snapshot reports a
 * visible face with monitoring enabled. At local-midnight the bucket
 * array is reset.
 *
 * History is in-memory only. Persisting across app launches would mean
 * routing through `expo-sqlite` like the chat repository — not in scope
 * for the home redesign.
 */

import { getUsageSnapshot } from './usage-store';

export type UsageHourBucket = {
  /** Local hour 0–23. */
  hour: number;
  /** Active minutes accumulated this hour, capped at 60. */
  minutes: number;
};

export type UsageHistorySnapshot = {
  /** Local YYYY-MM-DD key used to detect midnight rollover. */
  dateKey: string;
  /** 24-bucket array, ordered by local hour. */
  buckets: UsageHourBucket[];
  /** Sum of bucket minutes — cached for cheap reads. */
  totalMinutes: number;
};

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyBuckets(): UsageHourBucket[] {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, minutes: 0 }));
}

let snapshot: UsageHistorySnapshot = {
  dateKey: localDateKey(new Date()),
  buckets: emptyBuckets(),
  totalMinutes: 0,
};

const listeners = new Set<() => void>();
let tickerHandle: ReturnType<typeof setInterval> | null = null;

function emit() {
  for (const fn of listeners) fn();
}

export function getUsageHistory(): UsageHistorySnapshot {
  return snapshot;
}

export function subscribeUsageHistory(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Add one active minute to the bucket for `at`'s local hour. */
export function recordActiveMinute(at: Date = new Date()) {
  const key = localDateKey(at);
  let buckets = snapshot.buckets;
  let dateKey = snapshot.dateKey;
  if (key !== dateKey) {
    buckets = emptyBuckets();
    dateKey = key;
  }
  const hour = at.getHours();
  buckets = buckets.map((b) =>
    b.hour === hour ? { ...b, minutes: Math.min(60, b.minutes + 1) } : b
  );
  snapshot = {
    dateKey,
    buckets,
    totalMinutes: buckets.reduce((sum, b) => sum + b.minutes, 0),
  };
  emit();
}

/**
 * Start the per-minute ticker once. Subsequent calls are no-ops, so it's
 * safe to invoke from multiple components / hooks. Stops the previous
 * interval automatically if called after `stopUsageHistoryTicker`.
 */
export function startUsageHistoryTicker() {
  if (tickerHandle != null) return;
  tickerHandle = setInterval(() => {
    const live = getUsageSnapshot();
    if (live.monitoringEnabled && !live.monitoringPaused && live.faceVisible) {
      recordActiveMinute();
    }
  }, 60_000);
}

export function stopUsageHistoryTicker() {
  if (tickerHandle != null) {
    clearInterval(tickerHandle);
    tickerHandle = null;
  }
}
