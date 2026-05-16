import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CIRCLE_DIAMETER = 44;
const CIRCLE_STROKE = 1.4;
const CIRCLE_RADIUS = (CIRCLE_DIAMETER - CIRCLE_STROKE) / 2;
const DASH_PATTERN = '3,4';

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // Sunday-anchored week.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function mergeDateKeepTime(timeSource: Date, day: Date): Date {
  const next = new Date(day);
  next.setHours(timeSource.getHours(), timeSource.getMinutes(), 0, 0);
  return next;
}

type DayCellProps = {
  date: Date;
  label: string;
  isSelected: boolean;
  isToday: boolean;
  outlineColor: string;
  selectedOutlineColor: string;
  labelColor: string;
  numberColor: string;
  onPress: () => void;
};

function DayCell({
  date,
  label,
  isSelected,
  isToday,
  outlineColor,
  selectedOutlineColor,
  labelColor,
  numberColor,
  onPress,
}: DayCellProps) {
  // Selected day wins visually. When today is not selected we still draw a
  // solid (non-dashed) outline so "today" stays distinguishable from the
  // dashed regular days, but uses the cell's regular outline color so it
  // doesn't compete with the bold selected ring.
  const useSolidStroke = isSelected || isToday;
  const strokeColor = isSelected ? selectedOutlineColor : outlineColor;
  const strokeWidth = isSelected ? CIRCLE_STROKE + 0.4 : CIRCLE_STROKE;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={date.toDateString()}
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      hitSlop={4}
      className="flex-1 items-center gap-2"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <ThemedText className="text-[12px] font-semibold" style={{ color: labelColor }}>
        {label}
      </ThemedText>

      <View
        style={{
          width: CIRCLE_DIAMETER,
          height: CIRCLE_DIAMETER,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Svg
          width={CIRCLE_DIAMETER}
          height={CIRCLE_DIAMETER}
          style={{ position: 'absolute', top: 0, left: 0 }}>
          <Circle
            cx={CIRCLE_DIAMETER / 2}
            cy={CIRCLE_DIAMETER / 2}
            r={CIRCLE_RADIUS}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={useSolidStroke ? undefined : DASH_PATTERN}
            strokeLinecap="round"
          />
        </Svg>
        <ThemedText
          className="text-[16px] font-semibold tabular-nums"
          style={{ color: numberColor }}>
          {date.getDate()}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export type HomeWeekCalendarProps = {
  value: Date;
  onChange: (next: Date) => void;
};

/**
 * Minimalist horizontal week strip used on the Home screen above the vision
 * hero card. Non-selected days render with a soft dashed outline; the active
 * day uses a solid outline (no fill) per the product spec. No month header
 * or navigation arrows — the week is anchored to `value` and updates as the
 * caller changes the selected date.
 */
export function HomeWeekCalendar({ value, onChange }: HomeWeekCalendarProps) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const theme = useTheme();

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(value), [value]);

  const labels = useMemo(() => {
    // Use the locale's short weekday name truncated to 2 chars to match the
    // "Su Mo Tu We Th Fr Sa" form across languages without extra i18n keys.
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return weekDays.map((day) => fmt.format(day).slice(0, 2));
  }, [locale, weekDays]);

  const onPickDay = useCallback(
    (day: Date) => {
      if (sameCalendarDay(day, value)) return;
      onChange(mergeDateKeepTime(value, day));
    },
    [onChange, value],
  );

  const faintOutline = theme.glassBorderStrong;
  const strongOutline = theme.scheme === 'light' ? '#0F172A' : '#FFFFFF';
  const mutedLabel = theme.glassTextMuted;
  const strongLabel = theme.glassTextPrimary;
  const sundayAccent = Brand.danger;
  const sundayOutline = theme.scheme === 'light' ? Brand.danger : '#F87171';

  return (
    <View className="w-full flex-row items-start justify-between">
      {weekDays.map((day, i) => {
        const isSunday = day.getDay() === 0;
        const isToday = sameCalendarDay(day, today);
        const isSelected = sameCalendarDay(day, value);
        // Today must remain emphasized even when another day is the
        // selected one — promote its outline + label to the strong tint so
        // it visually outranks the dashed regular days. Sunday rules win
        // (red always); selection is the strongest tier and is handled by
        // the cell itself.
        const baseOutline = isSunday
          ? sundayOutline
          : isToday
            ? strongOutline
            : faintOutline;
        const labelColor = isSunday
          ? sundayAccent
          : isToday
            ? strongLabel
            : mutedLabel;
        const numberColor = isSunday ? sundayAccent : strongLabel;

        return (
          <DayCell
            key={day.toISOString()}
            date={day}
            label={labels[i] ?? ''}
            isSelected={isSelected}
            isToday={isToday}
            outlineColor={baseOutline}
            selectedOutlineColor={strongOutline}
            labelColor={labelColor}
            numberColor={numberColor}
            onPress={() => onPickDay(day)}
          />
        );
      })}
    </View>
  );
}
