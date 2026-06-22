import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { useLocalePreference } from '@/hooks/locale-preference-provider';
import {
  peekCachedNearVisionInsight,
  readCachedNearVisionInsight,
  writeCachedNearVisionInsight,
} from '@/lib/vision/locale-content-cache';
import {
  fetchNearVisionHistory,
  fetchNearVisionInsight,
  latestNearVisionSavedResultFromHistory,
  type NearVisionInsight,
} from '@/lib/vision/near-vision-results-api';
import { subscribeNearVisionHistoryInvalidation } from '@/lib/vision/near-vision-results-invalidation';
import type { NearVisionHistoryEntry, NearVisionSavedResult } from '@/lib/vision/near-vision-storage';

const INSIGHT_PERIOD_DAYS = 30;

export function useNearVisionLastResult() {
  const { user } = useAuth();
  const { resolvedLanguage } = useLocalePreference();
  const [value, setValue] = useState<NearVisionSavedResult | null>(null);
  const [history, setHistory] = useState<NearVisionHistoryEntry[]>([]);
  const [insight, setInsight] = useState<NearVisionInsight | null>(() =>
    peekCachedNearVisionInsight({
      userId: user?.id,
      locale: resolvedLanguage,
      periodDays: INSIGHT_PERIOD_DAYS,
    }),
  );
  const [historyLoading, setHistoryLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState<boolean>(() => {
    const cached = peekCachedNearVisionInsight({
      userId: user?.id,
      locale: resolvedLanguage,
      periodDays: INSIGHT_PERIOD_DAYS,
    });
    return !cached;
  });

  const historyLoadedRef = useRef(false);
  const insightRequestRef = useRef(0);

  const loadHistory = useCallback(async () => {
    try {
      return await fetchNearVisionHistory(120);
    } catch (error) {
      console.warn(
        '[near-vision] Failed to fetch remote history',
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }, []);

  const loadInsight = useCallback(
    async (locale = resolvedLanguage, options?: { forceNetwork?: boolean }) => {
      const reqId = ++insightRequestRef.current;

      const cacheInput = {
        userId: user?.id,
        locale,
        periodDays: INSIGHT_PERIOD_DAYS,
      };

      const memoryCached = peekCachedNearVisionInsight(cacheInput);
      if (memoryCached && !options?.forceNetwork) {
        if (insightRequestRef.current !== reqId) return;
        setInsight(memoryCached);
        setInsightLoading(false);
        return;
      }

      const cached = await readCachedNearVisionInsight(cacheInput);
      if (insightRequestRef.current !== reqId) return;

      if (cached && !options?.forceNetwork) {
        setInsight(cached);
        setInsightLoading(false);
        return;
      }

      setInsightLoading(true);

      try {
        const aiInsight = await fetchNearVisionInsight(INSIGHT_PERIOD_DAYS, locale);
        if (insightRequestRef.current !== reqId) return;
        setInsight(aiInsight);
        if (aiInsight) {
          void writeCachedNearVisionInsight({
            userId: user?.id,
            locale,
            insight: aiInsight,
          });
        }
      } catch (error) {
        console.warn(
          '[near-vision] Failed to fetch insight',
          error instanceof Error ? error.message : error
        );
        if (insightRequestRef.current === reqId) {
          setInsight(null);
        }
      } finally {
        if (insightRequestRef.current === reqId) {
          setInsightLoading(false);
        }
      }
    },
    [resolvedLanguage, user?.id],
  );

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    const h = await loadHistory();
    setValue(latestNearVisionSavedResultFromHistory(h));
    setHistory(h);
    setHistoryLoading(false);
    historyLoadedRef.current = true;
  }, [loadHistory]);

  const refresh = useCallback(
    async (locale = resolvedLanguage) => {
      await Promise.all([
        historyLoadedRef.current ? Promise.resolve() : refreshHistory(),
        loadInsight(locale),
      ]);
      if (historyLoadedRef.current) {
        const h = await loadHistory();
        setValue(latestNearVisionSavedResultFromHistory(h));
        setHistory(h);
      }
    },
    [loadHistory, loadInsight, refreshHistory, resolvedLanguage],
  );

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    return subscribeNearVisionHistoryInvalidation(() => {
      void refreshHistory();
    });
  }, [refreshHistory]);

  useLayoutEffect(() => {
    const cached = peekCachedNearVisionInsight({
      userId: user?.id,
      locale: resolvedLanguage,
      periodDays: INSIGHT_PERIOD_DAYS,
    });
    if (cached) {
      setInsight(cached);
      setInsightLoading(false);
    }
  }, [resolvedLanguage, user?.id]);

  useEffect(() => {
    void loadInsight(resolvedLanguage);
  }, [loadInsight, resolvedLanguage]);

  useFocusEffect(
    useCallback(() => {
      const cached = peekCachedNearVisionInsight({
        userId: user?.id,
        locale: resolvedLanguage,
        periodDays: INSIGHT_PERIOD_DAYS,
      });
      if (cached) {
        setInsight(cached);
        setInsightLoading(false);
      } else {
        void loadInsight(resolvedLanguage);
      }
      void refreshHistory();
    }, [loadInsight, refreshHistory, resolvedLanguage, user?.id]),
  );

  const eyesight = useMemo(() => value?.both ?? value?.right ?? value?.left ?? null, [value]);

  return {
    loading: historyLoading,
    historyLoading,
    insightLoading,
    value,
    eyesight,
    history,
    insight,
    refresh,
  };
}
