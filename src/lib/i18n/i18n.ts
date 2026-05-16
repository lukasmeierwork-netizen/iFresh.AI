import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultNS, resources, supportedI18nLanguageTags } from './resources';
import { resolveLanguageTag } from './resolve-language-tag';

void i18next.use(initReactI18next).init({
  resources,
  lng: resolveLanguageTag('system'),
  fallbackLng: 'en',
  supportedLngs: [...supportedI18nLanguageTags],
  defaultNS,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/** Shared i18next instance for `I18nextProvider` and imperative `changeLanguage`. */
export const i18n = i18next;
