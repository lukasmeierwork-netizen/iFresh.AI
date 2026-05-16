import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SettingsGroup, SettingsRow } from '@/components/settings/settings-group';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useAppearancePreference } from '@/hooks/appearance-preference-provider';
import { useTheme } from '@/hooks/use-theme';
import type { AppearancePreference } from '@/lib/settings/appearance-preference';

type AppearanceOption = { id: AppearancePreference; title: string; subtitle: string };

export function AppearanceSection() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { preference, setPreference } = useAppearancePreference();
  const [expanded, setExpanded] = useState(false);

  const appearanceOptions = useMemo(
    () =>
      [
        {
          id: 'system' as const,
          title: t('settings.appearanceMatchSystemTitle'),
          subtitle: t('settings.appearanceMatchSystemSubtitle'),
        },
        {
          id: 'light' as const,
          title: t('settings.appearanceLightTitle'),
          subtitle: t('settings.appearanceLightSubtitle'),
        },
        {
          id: 'dark' as const,
          title: t('settings.appearanceDarkTitle'),
          subtitle: t('settings.appearanceDarkSubtitle'),
        },
      ] satisfies AppearanceOption[],
    [t],
  );

  const selectedOption =
    appearanceOptions.find((option) => option.id === preference) ?? appearanceOptions[0];

  return (
    <SettingsGroup
      header={t('settings.appearanceSection')}
      description={t('settings.appearanceHint')}>
      <SettingsRow
        icon="paintbrush.fill"
        label={selectedOption.title}
        sublabel={selectedOption.subtitle}
        trailing={
          <SymbolView
            tintColor={theme.glassIconMuted}
            name={(expanded ? 'chevron.up' : 'chevron.down') as any}
            size={13}
            weight="semibold"
          />
        }
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityLabel={t('settings.appearanceSection')}
        accessibilityState={{ expanded }}
      />
      {expanded
        ? appearanceOptions.map((option) => {
            const selected = preference === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setPreference(option.id);
                  setExpanded(false);
                }}
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
                      {option.title}
                    </ThemedText>
                    <ThemedText
                      className="text-[12px] leading-4"
                      style={{ color: theme.glassTextMuted }}>
                      {option.subtitle}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            );
          })
        : null}
    </SettingsGroup>
  );
}
