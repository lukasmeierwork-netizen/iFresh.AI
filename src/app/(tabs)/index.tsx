import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroCard } from '@/components/home/hero-card';
import { QuickActions } from '@/components/home/quick-actions';
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
import { useUsageStore } from '@/hooks/use-usage-store';
import {
  formatLastUpdated,
} from '@/lib/usage/indicator-mapping';

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const snapshot = useUsageStore();

  const { setSelectedDate } = usePlanDate();
  const [nowMs, setNowMs] = useState(() => Date.now());

  const today = useMemo(() => {
    const next = new Date(nowMs);
    next.setHours(0, 0, 0, 0);
    return next;
  }, [nowMs]);

  const dailyTasks = useDailyTasks(today);
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
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const lastUpdatedLabel = useMemo(
    () => formatLastUpdated(snapshot.lastUpdatedAt, nowMs),
    [snapshot.lastUpdatedAt, nowMs],
  );

  const monitorStatusLabel = useMemo(() => {
    if (!snapshot.monitoringEnabled) return t('home.monitoringPaused');
    if (snapshot.monitoringPaused) return t('home.monitoringCameraBusy');
    return lastUpdatedLabel;
  }, [snapshot.monitoringEnabled, snapshot.monitoringPaused, lastUpdatedLabel, t]);

  const greeting = useMemo(() => {
    const hours = new Date(nowMs).getHours();
    if (hours < 5) return t('home.greetingLateNight');
    if (hours < 12) return t('home.greetingMorning');
    if (hours < 18) return t('home.greetingAfternoon');
    return t('home.greetingEvening');
  }, [nowMs, t]);

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    }),
    [safeAreaInsets],
  );

  return (
    <TabGlassScreenRoot>
      <DailyTasksCompletionCelebration visible={celebrationVisible} onDismiss={dismissCelebration} />
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom,
        }}>
        <SafeAreaView
          className="w-full items-center px-6"
          style={{ maxWidth: MaxContentWidth }}
          edges={['left', 'right']}>
          <View className="w-full max-w-[420px] gap-5">
            <View className="flex-row items-center justify-between gap-4 px-1">
              <View className="min-w-0 flex-1 gap-1.5">
                <ThemedText
                  type="small"
                  className="font-semibold tracking-[1.4px]"
                  style={{ color: theme.glassTextMuted }}>
                  {t('common.brand')}
                </ThemedText>
                <ThemedText
                  className="text-[28px] font-bold leading-9"
                  style={{ color: theme.glassTextPrimary }}>
                  {greeting}
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('home.openHelpA11y')}
                onPress={() => router.push('/help')}
                hitSlop={6}>
                {({ pressed }) => (
                  <View
                    className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border"
                    style={{
                      opacity: pressed ? 0.88 : 1,
                      borderColor: theme.glassBorderStrong,
                      backgroundColor: theme.glassSurfaceRaised,
                    }}>
                    <SymbolView tintColor={theme.glassIcon} name={'questionmark.circle.fill' as any} size={20} />
                  </View>
                )}
              </Pressable>
            </View>

            <View
              className="overflow-hidden rounded-3xl border"
              style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
              <HeroCard />
            </View>

            <View
              className="overflow-hidden rounded-3xl border"
              style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
              <View className="p-4">
                <QuickActions />
              </View>
            </View>

            <View
              className="gap-3 overflow-hidden rounded-3xl border px-5 py-7"
              style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
              <View className="flex-row items-end justify-between gap-3 px-1">
                <View className="min-w-0 flex-1 gap-1.5">
                  <ThemedText
                    type="small"
                    className="font-bold tracking-[1.4px]"
                    style={{ color: theme.glassTextMuted }}>
                    {t('home.todaysPlan')}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.seeScheduleA11y')}
                  onPress={() => {
                    setSelectedDate(today);
                    router.push('/task');
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  hitSlop={8}>
                  <ThemedText
                    className="text-[13px] font-semibold"
                    style={{ color: theme.glassTextSecondary }}>
                    {t('home.seeAll')}
                  </ThemedText>
                </Pressable>
              </View>

              {loading || translating ? (
                <View className="items-center gap-3 px-1 py-6">
                  <ActivityIndicator color={Brand.primary} />
                  <ThemedText className="text-[14px]" style={{ color: theme.glassTextMuted }}>
                    {translating
                      ? t('task.translating')
                      : t('task.loading', { defaultValue: 'Building today’s routine…' })}
                  </ThemedText>
                </View>
              ) : error ? (
                <View className="items-center gap-3 px-1 py-4">
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={28}
                    color={theme.glassTextSecondary}
                  />
                  <ThemedText
                    className="text-center text-[15px] font-semibold leading-6"
                    style={{ color: theme.glassTextPrimary }}>
                    {t('task.errorTitle', { defaultValue: 'Could not load your routine' })}
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
                <View className="gap-2 px-1 py-2">
                  <ThemedText
                    className="text-center text-[15px] font-semibold leading-6"
                    style={{ color: theme.glassTextPrimary }}>
                    {t('task.noLocaleContentTitle')}
                  </ThemedText>
                  <ThemedText
                    className="text-center text-[14px] leading-5"
                    style={{ color: theme.glassTextSecondary }}>
                    {t('task.noLocaleContentHint')}
                  </ThemedText>
                </View>
              ) : groups.length === 0 ? (
                <View className="gap-2 px-1 py-2">
                  <ThemedText
                    className="text-center text-[15px] font-semibold leading-6"
                    style={{ color: theme.glassTextPrimary }}>
                    {t('dailyPlan.noScheduleTitle')}
                  </ThemedText>
                  <ThemedText
                    className="text-center text-[14px] leading-5"
                    style={{ color: theme.glassTextSecondary }}>
                    {t('dailyPlan.noScheduleHint')}
                  </ThemedText>
                </View>
              ) : (
                <View className="gap-4">
                  <DailyTaskProgress completed={completedCount} total={totalCount} />
                  {groups.map((group) => (
                    <DailyTaskSection key={group.period} group={group} onToggle={toggleTask} />
                  ))}
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}
