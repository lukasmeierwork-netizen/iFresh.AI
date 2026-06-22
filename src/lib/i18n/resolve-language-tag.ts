import {
  APP_LANGUAGE_SET,
  type AppLanguageCode,
  type LocalePreference,
} from '@/lib/settings/locale-preference';

/** Subset of `expo-localization` `Locale` used for mapping (avoids static import of native module). */
export type DeviceLocale = {
  languageCode?: string | null;
  languageScriptCode?: string | null;
  regionCode?: string | null;
  languageTag?: string | null;
};

function getLocalesFromExpo(): DeviceLocale[] {
  try {
    // Lazy-load so missing native module (old dev client) does not crash the whole bundle at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization') as {
      getLocales: () => DeviceLocale[];
    };
    return Localization.getLocales() ?? [];
  } catch {
    return [];
  }
}

/**
 * Maps one device `Locale` entry to a supported app language, or `null` if
 * this entry should be skipped (e.g. unsupported language codes).
 */
export function deviceLocaleToAppLanguage(loc: DeviceLocale): AppLanguageCode | null {
  const lang = (loc.languageCode ?? 'en').toLowerCase();

  if (lang === 'zh') {
    // Single `zh-Hans` bundle for all Chinese device locales (including zh-TW / zh-HK)
    // until a dedicated Traditional Chinese catalog exists.
    return 'zh-Hans';
  }

  const byLanguage: Record<string, AppLanguageCode> = {
    en: 'en',
    fr: 'fr',
    ko: 'ko',
    ja: 'ja',
    es: 'es',
    de: 'de',
  };

  const mapped = byLanguage[lang];
  if (mapped && APP_LANGUAGE_SET.has(mapped)) {
    return mapped;
  }

  return null;
}

export function resolveLanguageTag(pref: LocalePreference): AppLanguageCode {
  if (pref !== 'system') {
    return pref;
  }

  for (const loc of getLocalesFromExpo()) {
    const mapped = deviceLocaleToAppLanguage(loc);
    if (mapped) {
      return mapped;
    }
  }

  return 'en';
}
