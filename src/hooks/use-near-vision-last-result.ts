import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchNearVisionHistory,
  fetchNearVisionInsight,
  latestNearVisionSavedResultFromHistory,
  type NearVisionInsight,
} from '@/lib/vision/near-vision-results-api';
import type { NearVisionHistoryEntry, NearVisionSavedResult } from '@/lib/vision/near-vision-storage';

export function useNearVisionLastResult() {
  const [value, setValue] = useState<NearVisionSavedResult | null>(null);
  const [history, setHistory] = useState<NearVisionHistoryEntry[]>([]);
  const [insight, setInsight] = useState<NearVisionInsight | null>(null);
  const [loading, setLoading] = useState(true);

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

  const refresh = useCallback(async (locale?: string) => {
    const [h, aiInsight] = await Promise.all([
      loadHistory(),
      fetchNearVisionInsight(30, locale).catch((error: unknown) => {
        console.warn(
          '[near-vision] Failed to fetch insight',
          error instanceof Error ? error.message : error
        );
        return null;
      }),
    ]);
    setValue(latestNearVisionSavedResultFromHistory(h));
    setHistory(h);
    setInsight(aiInsight);
    setLoading(false);
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadHistory(),
      fetchNearVisionInsight(30).catch((error: unknown) => {
        console.warn(
          '[near-vision] Failed to fetch insight',
          error instanceof Error ? error.message : error
        );
        return null;
      }),
    ]).then(([h, aiInsight]) => {
      if (cancelled) return;
      setValue(latestNearVisionSavedResultFromHistory(h));
      setHistory(h);
      setInsight(aiInsight);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const eyesight = useMemo(() => value?.both ?? value?.right ?? value?.left ?? null, [value]);

  return { loading, value, eyesight, history, insight, refresh };
}

