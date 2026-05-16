import { en } from './locales/en';
import { fr } from './locales/fr';
import { ko } from './locales/ko';
import { zhHans } from './locales/zhHans';

export const defaultNS = 'translation' as const;

export const resources = {
  en: { translation: en },
  'zh-Hans': { translation: zhHans },
  fr: { translation: fr },
  ko: { translation: ko },
} as const;

export const supportedI18nLanguageTags = Object.keys(resources) as (keyof typeof resources)[];
