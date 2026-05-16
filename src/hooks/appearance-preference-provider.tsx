import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

import {
  APPEARANCE_PREFERENCE_STORAGE_KEY,
  type AppearancePreference,
} from '@/lib/settings/appearance-preference';

type AppearancePreferenceContextValue = {
  preference: AppearancePreference;
  setPreference: (value: AppearancePreference) => void;
  hydrated: boolean;
};

const AppearancePreferenceContext = createContext<AppearancePreferenceContextValue | null>(null);

function applyAppearancePreference(value: AppearancePreference) {
  Appearance.setColorScheme(value === 'system' ? null : value);
}

export function AppearancePreferenceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(APPEARANCE_PREFERENCE_STORAGE_KEY);
        const next: AppearancePreference =
          raw === 'light' || raw === 'dark' ? raw : 'system';
        applyAppearancePreference(next);
        if (!cancelled) {
          setPreferenceState(next);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((value: AppearancePreference) => {
    applyAppearancePreference(value);
    setPreferenceState(value);
    void (async () => {
      try {
        if (value === 'system') {
          await AsyncStorage.removeItem(APPEARANCE_PREFERENCE_STORAGE_KEY);
        } else {
          await AsyncStorage.setItem(APPEARANCE_PREFERENCE_STORAGE_KEY, value);
        }
      } catch {
        // ignore persistence failures
      }
    })();
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference, hydrated }),
    [preference, setPreference, hydrated],
  );

  return (
    <AppearancePreferenceContext.Provider value={value}>{children}</AppearancePreferenceContext.Provider>
  );
}

export function useAppearancePreference() {
  const ctx = useContext(AppearancePreferenceContext);
  if (!ctx) {
    throw new Error('useAppearancePreference must be used within AppearancePreferenceProvider');
  }
  return ctx;
}
