import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { DailyTaskCard } from '@/components/schedule/daily-task-card';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DailyTaskGroup } from '@/hooks/use-daily-tasks';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const PERIOD_ICONS: Record<DailyTaskGroup['period'], IconName> = {
  morning: 'weather-sunset-up',
  afternoon: 'weather-sunny',
  evening: 'weather-sunset-down',
  night: 'weather-night',
};

type DailyTaskSectionProps = {
  group: DailyTaskGroup;
  onToggle: (taskId: string, nextCompleted: boolean) => void;
};

export function DailyTaskSection({ group, onToggle }: DailyTaskSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const titleKey = `task.period.${group.period}`;
  const periodTitle = t(titleKey, {
    defaultValue: group.period.charAt(0).toUpperCase() + group.period.slice(1),
  });
  const completedLabel = t('task.periodCompleted', {
    defaultValue: '{{completed}} of {{total}} completed',
    completed: group.completedCount,
    total: group.tasks.length,
  });

  const sectionStarted = group.completedCount > 0;
  const sectionComplete =
    group.tasks.length > 0 && group.completedCount === group.tasks.length;

  const headingColor = sectionComplete ? Brand.success : sectionStarted ? Brand.primary : theme.glassTextPrimary;
  const periodIconColor = sectionComplete ? Brand.success : Brand.primary;
  const countColor = sectionComplete
    ? Brand.success
    : sectionStarted
      ? Brand.primary
      : theme.glassTextMuted;

  return (
    <View
      style={{
        backgroundColor: theme.glassSurface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.glassBorder,
        overflow: 'hidden',
      }}>
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-5">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.glassSurfaceRaised }}>
          <MaterialCommunityIcons name={PERIOD_ICONS[group.period]} size={18} color={periodIconColor} />
        </View>
        <ThemedText
          className="min-w-0 flex-1 text-[16px] font-semibold leading-5 tracking-[-0.2px]"
          style={{ color: headingColor }}>
          {periodTitle}
        </ThemedText>
        <ThemedText
          className="max-w-[48%] shrink-0 text-right text-[12px] font-medium leading-4"
          style={{ color: countColor }}>
          {completedLabel}
        </ThemedText>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.glassBorder }} />
      </View>

      <View className="px-5 pb-5 pt-3">
        {group.tasks.map((task, index) => (
          <Fragment key={task.id}>
            <DailyTaskCard task={task} onToggle={onToggle} />
            {index < group.tasks.length - 1 ? (
              <View
                style={{
                  height: StyleSheet.hairlineWidth,
                  backgroundColor: theme.glassBorder,
                  marginVertical: 12,
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
