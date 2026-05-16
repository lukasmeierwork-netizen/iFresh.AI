import { useSyncExternalStore } from 'react';

import {
  getUsageSnapshot,
  subscribeUsage,
  type UsageSnapshot,
} from '@/lib/usage/usage-store';

/**
 * Subscribe the calling component to the global usage snapshot.
 * Re-renders whenever any field of the snapshot changes.
 */
export function useUsageStore(): UsageSnapshot {
  return useSyncExternalStore(subscribeUsage, getUsageSnapshot, getUsageSnapshot);
}

/**
 * Subscribe to a single primitive field. Only re-renders when that field
 * changes. Do not return objects here — `useSyncExternalStore` requires
 * referentially stable snapshots.
 */
export function useUsageField<K extends keyof UsageSnapshot>(
  key: K
): UsageSnapshot[K] {
  return useSyncExternalStore(
    subscribeUsage,
    () => getUsageSnapshot()[key],
    () => getUsageSnapshot()[key]
  );
}
