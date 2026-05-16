import { useEffect, useSyncExternalStore } from 'react';

import {
  getUsageHistory,
  startUsageHistoryTicker,
  subscribeUsageHistory,
  type UsageHistorySnapshot,
} from '@/lib/usage/usage-history';

/**
 * Subscribe to today's hourly screen-time history. The first caller starts
 * the per-minute ticker; subsequent calls reuse the same interval.
 */
export function useUsageHistory(): UsageHistorySnapshot {
  useEffect(() => {
    startUsageHistoryTicker();
  }, []);
  return useSyncExternalStore(
    subscribeUsageHistory,
    getUsageHistory,
    getUsageHistory
  );
}
