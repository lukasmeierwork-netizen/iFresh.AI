import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroCard } from '@/components/home/hero-card';
import { HomeWeekCalendar } from '@/components/home/home-week-calendar';
import { QuickActions } from '@/components/home/quick-actions';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
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

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [nowMs, setNowMs] = useState(() => Date.now());
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
                accessibilityLabel={t('home.openSettingsA11y')}
                onPress={() => router.push('/settings')}
                hitSlop={6}>
                {({ pressed }) => (
                  <View
                    className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border"
                    style={{
                      opacity: pressed ? 0.88 : 1,
                      borderColor: theme.glassBorderStrong,
                      backgroundColor: theme.glassSurfaceRaised,
                    }}>
                    <SymbolView tintColor={theme.glassIcon} name={'slider.horizontal.3' as any} size={18} />
                  </View>
                )}
              </Pressable>
            </View>

            <View className="px-1">
              <HomeWeekCalendar value={selectedDate} onChange={setSelectedDate} />
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
                  {/* <ThemedText className="text-[20px] font-semibold leading-7 text-white">
                    {hasTodayPlan ? 'Daily eye care' : 'No schedule yet'}
                  </ThemedText> */}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('home.seeScheduleA11y')}
                  onPress={() => router.push('/task')}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  hitSlop={8}>
                  <ThemedText
                    className="text-[13px] font-semibold"
                    style={{ color: theme.glassTextSecondary }}>
                    {t('home.seeAll')}
                  </ThemedText>
                </Pressable>
              </View>

              <View className="gap-2 px-1 py-2">
                <ThemedText
                  className="text-center text-[15px] font-semibold leading-6"
                  style={{ color: theme.glassTextPrimary }}>
                  {t('dailyPlan.noScheduleTitle')}
                </ThemedText>
                <ThemedText className="text-center text-[14px] leading-5" style={{ color: theme.glassTextSecondary }}>
                  {t('dailyPlan.noScheduleHint')}
                </ThemedText>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}
