import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NearVisionHistoryGraph } from '@/components/near-vision/near-vision-history-graph';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNearVisionDisplayFormat } from '@/hooks/use-near-vision-display-format';
import { useNearVisionLastResult } from '@/hooks/use-near-vision-last-result';
import { useTheme } from '@/hooks/use-theme';

export default function ScanScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const { history, insight, historyLoading, insightLoading } = useNearVisionLastResult();
  const { displayFormat } = useNearVisionDisplayFormat();

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    }),
    [safeAreaInsets]
  );

  const startTest = () => router.push({ pathname: '/near-vision' });

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
          className="w-full items-center justify-center px-6"
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
                <ThemedText className="text-[28px] font-bold leading-9" style={{ color: theme.glassTextPrimary }}>
                  {t('scan.title')}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('scan.startTestA11y')}
                onPress={startTest}
                hitSlop={6}>
                {({ pressed }) => (
                  <View
                    className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border"
                    style={{
                      opacity: pressed ? 0.88 : 1,
                      borderColor: theme.glassBorderStrong,
                      backgroundColor: theme.glassSurfaceRaised,
                    }}>
                    <SymbolView tintColor={theme.glassIcon} name={'play.fill' as any} size={16} weight="semibold" />
                  </View>
                )}
              </Pressable>
            </View>

            <View
              style={{
                backgroundColor: theme.glassSurface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.glassBorder,
                overflow: 'hidden',
              }}>
              <View className="px-5 pb-3 pt-5">
                <ThemedText
                  type="small"
                  className="font-bold tracking-[1.4px]"
                  style={{ color: theme.glassTextMuted }}>
                  {t('scan.history')}
                </ThemedText>
              </View>
              <View className="px-4 pb-4">
                <NearVisionHistoryGraph
                  history={history}
                  insight={insight}
                  insightLoading={insightLoading}
                  loading={historyLoading}
                  displayFormat={displayFormat}
                />
              </View>
            </View>

            <View
              style={{
                backgroundColor: theme.glassSurface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: theme.glassBorder,
                overflow: 'hidden',
              }}>
              <View className="px-5 pb-3 pt-5">
                <ThemedText
                  type="small"
                  className="font-bold tracking-[1.4px]"
                  style={{ color: theme.glassTextMuted }}>
                  {t('scan.tips')}
                </ThemedText>
              </View>

              <View className="gap-3 px-5 pb-5">
                <View className="flex-row items-start gap-3">
                  <View
                    className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.glassSurfaceRaised }}>
                    <SymbolView tintColor={theme.glassTextSecondary} name={'ruler.fill' as any} size={14} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-[14px] font-semibold leading-5" style={{ color: theme.glassTextPrimary }}>
                      {t('scan.tipHoldTitle')}
                    </ThemedText>
                    <ThemedText className="mt-0.5 text-[13px] leading-[18px]" style={{ color: theme.glassTextSecondary }}>
                      {t('scan.tipHoldBody')}
                    </ThemedText>
                  </View>
                </View>

                <View className="flex-row items-start gap-3">
                  <View
                    className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.glassSurfaceRaised }}>
                    <SymbolView tintColor={theme.glassTextSecondary} name={'hand.draw.fill' as any} size={14} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <ThemedText className="text-[14px] font-semibold leading-5" style={{ color: theme.glassTextPrimary }}>
                      {t('scan.tipSwipeTitle')}
                    </ThemedText>
                    <ThemedText className="mt-0.5 text-[13px] leading-[18px]" style={{ color: theme.glassTextSecondary }}>
                      {t('scan.tipSwipeBody')}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}
