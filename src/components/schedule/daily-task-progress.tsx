import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DailyTaskProgressProps = {
  completed: number;
  total: number;
};

export function DailyTaskProgress({ completed, total }: DailyTaskProgressProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const safeTotal = Math.max(total, 0);
  const safeCompleted = Math.max(0, Math.min(completed, safeTotal));
  const ratio = safeTotal === 0 ? 0 : safeCompleted / safeTotal;
  const percent = Math.round(ratio * 100);

  const label = t('task.overallCompleted', {
    defaultValue: '{{completed}} of {{total}} completed',
    completed: safeCompleted,
    total: safeTotal,
  });

  const planStarted = safeTotal > 0 && safeCompleted > 0;
  const planComplete = safeTotal > 0 && safeCompleted === safeTotal;

  const targetFillPercent = useMemo(() => {
    if (safeTotal === 0) return 0;
    const raw = ratio * 100;
    return Math.max(raw, safeCompleted > 0 ? 5 : 0);
  }, [safeTotal, safeCompleted, ratio]);

  const fillWidth = useSharedValue(targetFillPercent);

  useEffect(() => {
    fillWidth.value = withTiming(targetFillPercent, {
      duration: 480,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetFillPercent, fillWidth]);

  const fillAnimatedStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%`,
  }));

  const labelColor = planComplete ? Brand.success : planStarted ? Brand.primary : theme.glassTextPrimary;
  const pillBackground = planComplete ? 'rgba(34, 197, 94, 0.18)' : theme.glassPrimarySoft;
  const pillTextColor = planComplete ? Brand.success : Brand.primary;
  const barFillColor = planComplete ? Brand.success : Brand.primary;

  return (
    <View
      style={{
        // backgroundColor: theme.glassSurface,
        // borderRadius: 24,
        // borderWidth: 1,
        // borderColor: theme.glassBorder,
        overflow: 'hidden',
        // paddingVertical: 16,
        paddingHorizontal: 15,
      }}>
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText
          className="min-w-0 flex-1 text-[15px] font-semibold leading-5"
          style={{ color: labelColor }}>
          {label}
        </ThemedText>
        {safeTotal > 0 ? (
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: pillBackground,
            }}>
            <ThemedText className="text-[13px] font-bold tabular-nums" style={{ color: pillTextColor }}>
              {percent}%
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.glassBorder,
          marginTop: 14,
          marginBottom: 14,
        }}
      /> */}

      <View
        style={{
          height: 8,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: theme.glassTrack,
          marginTop: 10,
          // borderWidth: 1,
          // borderColor: theme.glassBorderMuted,
        }}>
        <Animated.View
          style={[
            {
              height: '100%',
              borderRadius: 999,
              backgroundColor: barFillColor,
            },
            fillAnimatedStyle,
          ]}
        />
      </View>
    </View>
  );
}
