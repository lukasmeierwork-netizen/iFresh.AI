import type { AppTranslation } from '@/lib/i18n/catalog/en';
import { catalogEn } from '@/lib/i18n/catalog/en';
import type { DeepPartial } from '@/lib/i18n/merge-locale';
import { mergeLocale } from '@/lib/i18n/merge-locale';

export function withPartial(partial: DeepPartial<AppTranslation>): AppTranslation {
  return mergeLocale(catalogEn as unknown as AppTranslation, partial) as AppTranslation;
}
