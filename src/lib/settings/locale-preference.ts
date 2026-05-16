export const LOCALE_PREFERENCE_STORAGE_KEY = 'eyefresh.locale-preference-v1';

/** BCP-47-style codes registered in i18next `resources` (hyphenated where needed). */
export const APP_LANGUAGES = ['en', 'zh-Hans', 'fr', 'ko'] as const;

export type AppLanguageCode = (typeof APP_LANGUAGES)[number];
export type LocalePreference = 'system' | AppLanguageCode;

const VALID = new Set<string>(['system', ...APP_LANGUAGES]);

export function parseLocalePreference(raw: string | null): LocalePreference {
  if (raw && VALID.has(raw)) {
    return raw as LocalePreference;
  }
  return 'system';
}

export const APP_LANGUAGE_SET = new Set<string>(APP_LANGUAGES);

export function isAppLanguageCode(value: string): value is AppLanguageCode {
  return APP_LANGUAGE_SET.has(value);
}
