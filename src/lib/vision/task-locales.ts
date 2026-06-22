import { APP_LANGUAGES, type AppLanguageCode } from '@/lib/settings/locale-preference';

/** Locales stored on each generated daily task. */
export const TASK_CONTENT_LOCALES = APP_LANGUAGES;

export type TaskContentLocale = AppLanguageCode;

const SUPPORTED_SET = new Set<string>(TASK_CONTENT_LOCALES);

/** Normalize i18n / app locale tags to a supported task content locale. */
export function normalizeTaskContentLocale(raw: string | null | undefined): TaskContentLocale {
  const trimmed = raw?.trim() || 'en';
  if (trimmed === 'zh-Hans' || trimmed.startsWith('zh')) return 'zh-Hans';
  const base = trimmed.split('-')[0]?.toLowerCase() ?? 'en';
  if (SUPPORTED_SET.has(trimmed)) return trimmed as TaskContentLocale;
  if (base === 'zh') return 'zh-Hans';
  if (SUPPORTED_SET.has(base)) return base as TaskContentLocale;
  return 'en';
}
