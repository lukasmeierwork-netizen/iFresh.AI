import { SymbolView } from 'expo-symbols';
import type { TFunction } from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UsageHistorySnapshot } from '@/lib/usage/usage-history';

const CHART_HEIGHT = 110;
const Y_AXIS_MAX_MIN = 60;

function formatHM(totalMinutes: number, t: TFunction): string {
  if (totalMinutes <= 0) return t('usageChart.zeroMin');
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return t('usageChart.minutes', { mins });
  if (mins === 0) return t('usageChart.hours', { hours });
  return t('usageChart.hoursMinutes', { hours, mins });
}

function busiestHourLabel(buckets: UsageHistorySnapshot['buckets'], t: TFunction): string | null {
  let best: UsageHistorySnapshot['buckets'][number] | null = null;
  for (const b of buckets) {
    if (b.minutes <= 0) continue;
    if (best == null || b.minutes > best.minutes) best = b;
  }
  if (best == null) return null;
  const hour12 = ((best.hour + 11) % 12) + 1;
  const suffix = best.hour < 12 ? t('usageChart.am') : t('usageChart.pm');
  return t('usageChart.peak', { hour: hour12, suffix, minutes: best.minutes });
}

export type UsageHourChartProps = {
  history: UsageHistorySnapshot;
};

/**
 * Hourly chart in frosted glass; bars stay saturated for readability on the photo.
 */
export function UsageHourChart({ history }: UsageHourChartProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const id = setInterval(() => setCurrentHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hourLabels = useMemo(
    () => [
      { hour: 0, label: t('usageChart.hour12a') },
      { hour: 6, label: t('usageChart.hour6a') },
      { hour: 12, label: t('usageChart.hour12p') },
      { hour: 18, label: t('usageChart.hour6p') },
      { hour: 23, label: t('usageChart.hour11p') },
    ],
    [t],
  );

  const peak = useMemo(() => busiestHourLabel(history.buckets, t), [history.buckets, t]);
  const isEmpty = history.totalMinutes === 0;
  const currentHour12 = ((currentHour + 11) % 12) + 1;
  const currentSuffix = currentHour < 12 ? t('usageChart.am') : t('usageChart.pm');

  return (
    <View
      className="gap-4 overflow-hidden rounded-[22px] border px-5 py-7"
      style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
      <View className="flex-row items-end justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <ThemedText
            type="small"
            style={{ color: theme.glassTextSecondary }}
            className="font-bold tracking-[1.4px] pb-2">
            {t('usageChart.title')}
          </ThemedText>
          <ThemedText className="text-[26px] font-bold leading-8" style={{ color: theme.glassTextPrimary }}>
            {formatHM(history.totalMinutes, t)}
          </ThemedText>
          <ThemedText className="text-[12px] leading-4" style={{ color: theme.glassTextMuted }}>
            {peak ?? t('usageChart.noPeak')}
          </ThemedText>
        </View>
      </View>

      <View>
        <View
          style={{
            height: CHART_HEIGHT,
            position: 'relative',
            justifyContent: 'flex-end',
          }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 1,
              backgroundColor: theme.glassGrid,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: CHART_HEIGHT / 2,
              height: 1,
              backgroundColor: theme.glassGrid,
            }}
          />
          <ThemedText
            style={{
              position: 'absolute',
              right: 0,
              top: -4,
              fontSize: 9,
              fontWeight: '700',
              letterSpacing: 0.4,
              color: theme.glassTextMuted,
            }}>
            60m
          </ThemedText>
          <ThemedText
            style={{
              position: 'absolute',
              right: 0,
              top: CHART_HEIGHT / 2 - 6,
              fontSize: 9,
              fontWeight: '700',
              letterSpacing: 0.4,
              color: theme.glassTextMuted,
            }}>
            30m
          </ThemedText>

          <View
            className="flex-row items-end gap-[3px]"
            style={{ height: CHART_HEIGHT }}>
            {history.buckets.map((b) => {
              const ratio = Math.min(1, b.minutes / Y_AXIS_MAX_MIN);
              const height = Math.max(4, ratio * CHART_HEIGHT);
              const isCurrent = b.hour === currentHour;
              const hasData = b.minutes > 0;
              const fill = isCurrent ? Brand.primary : hasData ? theme.glassMeterFill : theme.glassTrack;
              return (
                <View
                  key={b.hour}
                  style={{
                    flex: 1,
                    height,
                    borderRadius: 4,
                    backgroundColor: fill,
                    opacity: isEmpty ? 0.7 : 1,
                  }}
                />
              );
            })}
          </View>
        </View>

        <View className="mt-2 flex-row justify-between">
          {hourLabels.map((l) => (
            <ThemedText key={l.hour} className="text-[11px] font-medium" style={{ color: theme.glassTextMuted }}>
              {l.label}
            </ThemedText>
          ))}
        </View>

        <View className="mt-2 flex-row items-center gap-1.5">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: Brand.primary }}
          />
          <ThemedText className="text-[11px]" style={{ color: theme.glassTextMuted }}>
            {t('usageChart.nowLine', { hour: currentHour12, suffix: currentSuffix })}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
