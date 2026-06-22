import React from 'react';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useLocalePreference } from '@/hooks/locale-preference-provider';
import type { OnboardingDraft } from '@/lib/onboarding/types';
import { LANGUAGE_NATIVE_LABELS } from '@/lib/settings/language-native-labels';
import {
  APP_LANGUAGES,
  type AppLanguageCode,
  type LocalePreference,
} from '@/lib/settings/locale-preference';

const LANGUAGE_FLAGS: Record<AppLanguageCode, string> = {
  en: '🇺🇸',
  'zh-Hans': '🇨🇳',
  fr: '🇫🇷',
  ko: '🇰🇷',
  ja: '🇯🇵',
  es: '🇪🇸',
  de: '🇩🇪',
};

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
};

export function StepLanguage({ draft, setAnswer }: Props) {
  const { t } = useTranslation();
  const { preference, setPreference } = useLocalePreference();
  const selectedLanguage: LocalePreference = draft.language ?? preference;

  useEffect(() => {
    if (draft.language == null || draft.language !== preference) {
      setAnswer({ language: preference });
    }
  }, [draft.language, preference, setAnswer]);

  const selectLanguage = (value: LocalePreference) => {
    setPreference(value);
    setAnswer({ language: value });
  };

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {t('settings.languageSection')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('settings.languageHint')}
        </ThemedText>
      </View>

      <View style={{ gap: 12 }}>
        <LanguageOption
          selected={selectedLanguage === 'system'}
          icon="🌐"
          title={t('settings.languageSystemTitle')}
          subtitle={t('settings.languageSystemSubtitle')}
          onPress={() => selectLanguage('system')}
        />
        {APP_LANGUAGES.map((code) => (
          <LanguageOption
            key={code}
            selected={selectedLanguage === code}
            icon={LANGUAGE_FLAGS[code]}
            title={LANGUAGE_NATIVE_LABELS[code]}
            subtitle={t('settings.languageAlwaysUse', { name: LANGUAGE_NATIVE_LABELS[code] })}
            onPress={() => selectLanguage(code)}
          />
        ))}
      </View>
    </View>
  );
}

function LanguageOption({
  selected,
  icon,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="rounded-2xl border px-4 py-3.5 active:opacity-80"
      style={{
        borderColor: selected ? Brand.primary : '#D1D5DB',
        backgroundColor: selected ? '#E8F2FE' : '#FFFFFF0',
      }}>
      <View className="flex-row items-center gap-3">
        <View className="min-h-[48px] justify-center self-stretch">
          <ThemedText className="text-[28px] leading-8">{icon}</ThemedText>
        </View>
        <View className="flex-1 justify-center">
          <ThemedText className="text-[15px] font-semibold leading-5" style={{ color: Brand.primary }}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary" className="mt-1 text-[12px] leading-4">
            {subtitle}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}
