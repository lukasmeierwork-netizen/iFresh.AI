import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { loadNearVisionDisplayFormat, saveNearVisionDisplayFormat } from '@/lib/vision/near-vision-storage';
import type { NearVisionDisplayFormat } from '@/lib/vision/snellen';

export function useNearVisionDisplayFormat() {
  const [displayFormat, setDisplayFormat] = useState<NearVisionDisplayFormat>('snellen');

  const refresh = useCallback(async () => {
    const saved = await loadNearVisionDisplayFormat();
    setDisplayFormat(saved);
    return saved;
  }, []);

  const setAndPersist = useCallback((next: NearVisionDisplayFormat) => {
    setDisplayFormat(next);
    void saveNearVisionDisplayFormat(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    displayFormat,
    setDisplayFormat: setAndPersist,
    refreshDisplayFormat: refresh,
  };
}
