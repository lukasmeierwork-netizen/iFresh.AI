import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SettingsGroup, SettingsRow } from '@/components/settings/settings-group';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useLocalePreference } from '@/hooks/locale-preference-provider';
import { useTheme } from '@/hooks/use-theme';
import { patchOnboardingColumnsForUser } from '@/lib/supabase/onboarding-storage';
import { LANGUAGE_NATIVE_LABELS } from '@/lib/settings/language-native-labels';
import { APP_LANGUAGES, type LocalePreference } from '@/lib/settings/locale-preference';

export function LanguageSection() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { preference, setPreference } = useLocalePreference();

  const syncLanguageToOnboarding = (value: LocalePreference) => {
    const uid = user?.id;
    if (!uid) return;
    void patchOnboardingColumnsForUser(uid, { language: value });
  };
  const [expanded, setExpanded] = useState(false);
  const selectedTitle =
    preference === 'system' ? t('settings.languageSystemTitle') : LANGUAGE_NATIVE_LABELS[preference];
  const selectedSubtitle =
    preference === 'system'
      ? t('settings.languageSystemSubtitle')
      : t('settings.languageAlwaysUse', { name: LANGUAGE_NATIVE_LABELS[preference] });

  return (
    <SettingsGroup
      header={t('settings.languageSection')}
      description={t('settings.languageHint')}>
      <SettingsRow
        icon="globe"
        label={selectedTitle}
        sublabel={selectedSubtitle}
        trailing={
          <SymbolView
            tintColor={theme.glassIconMuted}
            name={(expanded ? 'chevron.up' : 'chevron.down') as any}
            size={13}
            weight="semibold"
          />
        }
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityLabel={t('settings.languageSection')}
        accessibilityState={{ expanded }}
      />
      {expanded ? (
        <LanguageRow
          selected={preference === 'system'}
          title={t('settings.languageSystemTitle')}
          subtitle={t('settings.languageSystemSubtitle')}
          onPress={() => {
            setPreference('system');
            syncLanguageToOnboarding('system');
            setExpanded(false);
          }}
        />
      ) : null}
      {expanded
        ? APP_LANGUAGES.map((code) => (
            <LanguageRow
              key={code}
              selected={preference === code}
              title={LANGUAGE_NATIVE_LABELS[code]}
              subtitle={t('settings.languageAlwaysUse', { name: LANGUAGE_NATIVE_LABELS[code] })}
              onPress={() => {
                setPreference(code);
                syncLanguageToOnboarding(code);
                setExpanded(false);
              }}
            />
          ))
        : null}
    </SettingsGroup>
  );
}

function LanguageRow({
  selected,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <View className="flex-row items-center px-4 py-3.5">
        <View className="mr-3 h-7 w-7 items-center justify-center">
          {selected ? (
            <SymbolView
              tintColor={Brand.primary}
              name={'checkmark.circle.fill' as any}
              size={20}
            />
          ) : (
            <SymbolView
              tintColor={theme.glassBorderStrong}
              name={'circle' as any}
              size={20}
            />
          )}
        </View>
        <View className="min-w-0 flex-1 gap-0.5 pr-2">
          <ThemedText
            className="text-[15px] font-semibold leading-5"
            style={{ color: theme.glassTextPrimary }}>
            {title}
          </ThemedText>
          <ThemedText
            className="text-[12px] leading-4"
            style={{ color: theme.glassTextMuted }}>
            {subtitle}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}
