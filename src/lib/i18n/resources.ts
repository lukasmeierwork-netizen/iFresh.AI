import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { zhHans } from './locales/zhHans';

export const defaultNS = 'translation' as const;

export const resources = {
  en: { translation: en },
  'zh-Hans': { translation: zhHans },
  fr: { translation: fr },
  ko: { translation: ko },
  ja: { translation: ja },
  es: { translation: es },
  de: { translation: de },
} as const;

export const supportedI18nLanguageTags = Object.keys(resources) as (keyof typeof resources)[];
