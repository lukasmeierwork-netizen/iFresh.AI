import type { AppLanguageCode } from '@/lib/settings/locale-preference';

/** Endonym for each app language — shown as the primary label in the language picker. */
export const LANGUAGE_NATIVE_LABELS: Record<AppLanguageCode, string> = {
  en: 'English',
  'zh-Hans': '简体中文',
  fr: 'Français',
  ko: '한국어',
  ja: '日本語',
  es: 'Español',
  de: 'Deutsch',
};
