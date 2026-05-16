import 'i18next';

import type { AppTranslation } from '@/lib/i18n/catalog/en';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: AppTranslation;
    };
  }
}
