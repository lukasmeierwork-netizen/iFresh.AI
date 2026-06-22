import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeWeekCalendar } from '@/components/home/home-week-calendar';
import { DailyTaskProgress } from '@/components/schedule/daily-task-progress';
import { DailyTasksCompletionCelebration } from '@/components/schedule/daily-tasks-completion-celebration';
import { DailyTaskSection } from '@/components/schedule/daily-task-section';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDailyTasks } from '@/hooks/use-daily-tasks';
import { useDailyTasksCompletionCelebration } from '@/hooks/use-daily-tasks-completion-celebration';
import { usePlanDate } from '@/hooks/plan-date-provider';
import { useTheme } from '@/hooks/use-theme';

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function TaskScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { selectedDate, setSelectedDate } = usePlanDate();

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    }),
    [safeAreaInsets],
  );

  const dailyTasks = useDailyTasks(selectedDate);
  const {
    loading,
    translating,
    error,
    localeContentMissing,
    groups,
    totalCount,
    completedCount,
    toggleTask,
    refresh,
    isoDate,
  } = dailyTasks;
  const { visible: celebrationVisible, dismiss: dismissCelebration } =
    useDailyTasksCompletionCelebration({
      planDateIso: isoDate,
      completed: completedCount,
      total: totalCount,
      loading,
    });

  const planHeading = useMemo(() => {
    if (sameCalendarDay(selectedDate, new Date())) {
      return t('task.title');
    }
    const locale = i18n.resolvedLanguage ?? i18n.language;
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(selectedDate);
  }, [i18n.language, i18n.resolvedLanguage, selectedDate, t]);

  const contentPlatformStyle = { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom };

  return (
    <TabGlassScreenRoot>
      <DailyTasksCompletionCelebration visible={celebrationVisible} onDismiss={dismissCelebration} />
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
                {planHeading}
              </ThemedText>
            </View>

            <View className="px-1">
              <HomeWeekCalendar value={selectedDate} onChange={setSelectedDate} />
            </View>

            {!localeContentMissing && !translating && totalCount > 0 ? (
              <DailyTaskProgress completed={completedCount} total={totalCount} />
            ) : null}

            {loading || translating ? (
              <View className="items-center gap-3 py-12">
                <ActivityIndicator color={Brand.primary} />
                <ThemedText className="text-[14px]" style={{ color: theme.glassTextMuted }}>
                  {translating ? t('task.translating') : t('task.loading')}
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
                  {t('task.errorTitle')}
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
            ) : localeContentMissing ? (
              <View
                className="items-center gap-3 rounded-3xl border px-5 py-7"
                style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
                <MaterialCommunityIcons
                  name="translate"
                  size={32}
                  color={theme.glassTextSecondary}
                />
                <ThemedText
                  className="text-center text-[15px] font-semibold"
                  style={{ color: theme.glassTextPrimary }}>
                  {t('task.noLocaleContentTitle')}
                </ThemedText>
                <ThemedText
                  className="text-center text-[13px] leading-5"
                  style={{ color: theme.glassTextSecondary }}>
                  {t('task.noLocaleContentHint')}
                </ThemedText>
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
                  {t('task.emptyTitle')}
                </ThemedText>
                <ThemedText
                  className="text-center text-[13px] leading-5"
                  style={{ color: theme.glassTextSecondary }}>
                  {t('task.emptyHint')}
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
