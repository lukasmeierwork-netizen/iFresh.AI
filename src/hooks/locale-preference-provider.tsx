import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@/lib/i18n/i18n';
import { resolveLanguageTag } from '@/lib/i18n/resolve-language-tag';
import {
  LOCALE_PREFERENCE_STORAGE_KEY,
  parseLocalePreference,
  type LocalePreference,
} from '@/lib/settings/locale-preference';

type LocalePreferenceContextValue = {
  preference: LocalePreference;
  setPreference: (value: LocalePreference) => void;
  hydrated: boolean;
  resolvedLanguage: ReturnType<typeof resolveLanguageTag>;
};

const LocalePreferenceContext = createContext<LocalePreferenceContextValue | null>(null);

function LocalePreferenceInner({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  const applyLanguage = useCallback((pref: LocalePreference) => {
    const code = resolveLanguageTag(pref);
    void i18n.changeLanguage(code);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY);
        const next = parseLocalePreference(raw);
        applyLanguage(next);
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
  }, [applyLanguage]);

  const setPreference = useCallback(
    (value: LocalePreference) => {
      setPreferenceState(value);
      applyLanguage(value);
      void (async () => {
        try {
          if (value === 'system') {
            await AsyncStorage.removeItem(LOCALE_PREFERENCE_STORAGE_KEY);
          } else {
            await AsyncStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, value);
          }
        } catch {
          // ignore persistence failures
        }
      })();
    },
    [applyLanguage],
  );

  const resolvedLanguage = useMemo(() => resolveLanguageTag(preference), [preference]);

  const value = useMemo(
    () => ({ preference, setPreference, hydrated, resolvedLanguage }),
    [preference, setPreference, hydrated, resolvedLanguage],
  );

  return <LocalePreferenceContext.Provider value={value}>{children}</LocalePreferenceContext.Provider>;
}

export function LocalePreferenceProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocalePreferenceInner>{children}</LocalePreferenceInner>
    </I18nextProvider>
  );
}

export function useLocalePreference() {
  const ctx = useContext(LocalePreferenceContext);
  if (!ctx) {
    throw new Error('useLocalePreference must be used within LocalePreferenceProvider');
  }
  return ctx;
}
