import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Two frosted glass tiles (reference style): labels over blurred photo.
 */
export function QuickActions() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isLight = theme.scheme === 'light';
  const router = useRouter();

  return (
    <View className="flex-row gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('quickActions.startTestA11y')}
        onPress={() => router.push('/near-vision')}
        className="min-w-0 flex-1"
        style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
        <View
          className="min-h-[132px] w-full flex-col gap-3 overflow-hidden rounded-[16px] px-4 py-4"
          style={{
            backgroundColor: isLight ? theme.glassSurfaceStrong : theme.glassSurfaceRaised,
            // borderWidth: isLight ? 0.6 : 0,
          }}>
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl border"
            style={{
              borderColor: theme.glassBorderStrong,
              backgroundColor: theme.glassSurfaceStrong,
            }}>
            <SymbolView tintColor={theme.glassIcon} name={'camera.viewfinder' as any} size={20} />
          </View>
          <View className="gap-1">
            <ThemedText className="text-[16px] font-semibold" style={{ color: theme.glassTextPrimary }}>
              {t('quickActions.startTest')}
            </ThemedText>
            <ThemedText
              className="text-[12px] leading-4"
              style={{ color: isLight ? theme.glassTextPrimary : theme.glassTextSecondary }}>
              {t('quickActions.startTestHint')}
            </ThemedText>
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('quickActions.openTasksA11y')}
        onPress={() => router.push('/task')}
        className="min-w-0 flex-1"
        style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
        <View
          className="min-h-[132px] w-full flex-col gap-3 overflow-hidden rounded-[16px] px-4 py-4"
          style={{
            backgroundColor: isLight ? theme.glassSurfaceStrong : theme.glassSurfaceRaised,
          }}>
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl border"
            style={{
              borderColor: theme.glassBorderStrong,
              backgroundColor: theme.glassSurfaceStrong,
            }}>
            <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.glassIcon} />
          </View>
          <View className="gap-1">
            <ThemedText className="text-[16px] font-semibold" style={{ color: theme.glassTextPrimary }}>
              {t('tabs.task')}
            </ThemedText>
            <ThemedText
              className="text-[12px] leading-4"
              style={{ color: isLight ? theme.glassTextPrimary : theme.glassTextSecondary }}>
              {t('quickActions.tasksHint')}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
