import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DailyTaskProgress } from '@/components/schedule/daily-task-progress';
import { DailyTaskSection } from '@/components/schedule/daily-task-section';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDailyTasks } from '@/hooks/use-daily-tasks';
import { useTheme } from '@/hooks/use-theme';

export default function TaskScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    }),
    [safeAreaInsets],
  );

  const dailyTasks = useDailyTasks(today);
  const { loading, error, groups, totalCount, completedCount, toggleTask, refresh } = dailyTasks;

  const contentPlatformStyle = { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom };

  return (
    <TabGlassScreenRoot>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: 'transparent' }}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[{ flexDirection: 'row', justifyContent: 'center' }, contentPlatformStyle]}>
        <SafeAreaView
          className="w-full items-center justify-center px-6"
          style={{ maxWidth: MaxContentWidth }}
          edges={['left', 'right']}>
          <View className="w-full max-w-[420px] gap-8">
            <View className="gap-1.5 px-1">
              <ThemedText type="small" className="font-semibold tracking-[1.4px]" style={{ color: theme.glassTextMuted }}>
                {t('common.brand')}
              </ThemedText>
              <ThemedText className="text-[28px] font-bold leading-9" style={{ color: theme.glassTextPrimary }}>
                {t('task.title')}
              </ThemedText>
            </View>

            <DailyTaskProgress completed={completedCount} total={totalCount} />

            {loading ? (
              <View className="items-center gap-3 py-12">
                <ActivityIndicator color={Brand.primary} />
                <ThemedText className="text-[14px]" style={{ color: theme.glassTextMuted }}>
                  {t('task.loading', { defaultValue: 'Generating today’s plan…' })}
                </ThemedText>
              </View>
            ) : error ? (
              <View
                className="items-center gap-3 rounded-3xl border px-5 py-7"
                style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={32}
                  color={theme.glassTextSecondary}
                />
                <ThemedText
                  className="text-center text-[15px] font-semibold"
                  style={{ color: theme.glassTextPrimary }}>
                  {t('task.errorTitle', { defaultValue: 'Could not load your plan' })}
                </ThemedText>
                <ThemedText
                  className="text-center text-[13px] leading-5"
                  style={{ color: theme.glassTextSecondary }}>
                  {error}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void refresh();
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 14,
                    backgroundColor: Brand.primary,
                  })}>
                  <ThemedText className="text-[14px] font-semibold" style={{ color: '#FFFFFF' }}>
                    {t('task.tryAgain')}
                  </ThemedText>
                </Pressable>
              </View>
            ) : groups.length === 0 ? (
              <View
                className="items-center gap-3 rounded-3xl border px-5 py-7"
                style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={32}
                  color={theme.glassTextSecondary}
                />
                <ThemedText
                  className="text-center text-[15px] font-semibold"
                  style={{ color: theme.glassTextPrimary }}>
                  {t('task.emptyTitle', { defaultValue: 'No tasks for this day yet' })}
                </ThemedText>
                <ThemedText
                  className="text-center text-[13px] leading-5"
                  style={{ color: theme.glassTextSecondary }}>
                  {t('task.emptyHint', {
                    defaultValue: 'Come back later or open the app again to load your plan.',
                  })}
                </ThemedText>
              </View>
            ) : (
              <View className="gap-8">
                {groups.map((group) => (
                  <DailyTaskSection key={group.period} group={group} onToggle={toggleTask} />
                ))}
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}
