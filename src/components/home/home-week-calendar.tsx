import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CIRCLE_DIAMETER = 44;
const CIRCLE_STROKE = 1.4;
const CIRCLE_RADIUS = (CIRCLE_DIAMETER - CIRCLE_STROKE) / 2;
const DASH_PATTERN = '3,4';
const SWIPE_COMMIT_RATIO = 0.22;
const SWIPE_VELOCITY = 650;
const SNAP_DURATION = 260;

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

function addDaysKeepTime(source: Date, days: number): Date {
  const next = new Date(source);
  next.setDate(next.getDate() + days);
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

type WeekStripProps = {
  selectedDate: Date;
  today: Date;
  labels: string[];
  weekDays: Date[];
  width?: number;
  faintOutline: string;
  strongOutline: string;
  mutedLabel: string;
  strongLabel: string;
  sundayAccent: string;
  sundayOutline: string;
  onPickDay: (day: Date) => void;
};

function WeekStrip({
  selectedDate,
  today,
  labels,
  weekDays,
  width,
  faintOutline,
  strongOutline,
  mutedLabel,
  strongLabel,
  sundayAccent,
  sundayOutline,
  onPickDay,
}: WeekStripProps) {
  return (
    <View
      className="flex-row items-start justify-between"
      style={width ? { width } : undefined}>
      {weekDays.map((day, i) => {
        const isSunday = day.getDay() === 0;
        const isToday = sameCalendarDay(day, today);
        const isSelected = sameCalendarDay(day, selectedDate);
        const baseOutline = isSunday ? sundayOutline : isToday ? strongOutline : faintOutline;
        const labelColor = isSunday ? sundayAccent : isToday ? strongLabel : mutedLabel;
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

export type HomeWeekCalendarProps = {
  value: Date;
  onChange: (next: Date) => void;
};

/**
 * Minimalist horizontal week strip used on the Home screen above the vision
 * hero card. Drag horizontally to move between weeks; tap a day to select it.
 */
export function HomeWeekCalendar({ value, onChange }: HomeWeekCalendarProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const theme = useTheme();

  const today = useMemo(() => new Date(), []);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const translateX = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  const prevWeekAnchor = useMemo(() => addDaysKeepTime(value, -7), [value]);
  const nextWeekAnchor = useMemo(() => addDaysKeepTime(value, 7), [value]);

  const weekSets = useMemo(
    () =>
      [prevWeekAnchor, value, nextWeekAnchor].map((anchor) => {
        const weekDays = getWeekDays(anchor);
        const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
        const labels = weekDays.map((day) => fmt.format(day).slice(0, 2));
        return { anchor, weekDays, labels };
      }),
    [locale, nextWeekAnchor, prevWeekAnchor, value],
  );

  const selectedDateHeading = useMemo(() => {
    const includeYear = value.getFullYear() !== today.getFullYear();
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(value);
    const monthDay = new Intl.DateTimeFormat(locale, {
      month: 'long',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
    }).format(value);
    return { weekday, monthDay, isToday: sameCalendarDay(value, today) };
  }, [locale, today, value]);

  const onPickDay = useCallback(
    (day: Date) => {
      if (sameCalendarDay(day, value)) return;
      onChange(mergeDateKeepTime(value, day));
    },
    [onChange, value],
  );

  const shiftWeek = useCallback(
    (direction: 1 | -1) => {
      onChange(addDaysKeepTime(value, direction * 7));
    },
    [onChange, value],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width <= 0 || width === layoutWidth) return;
      setLayoutWidth(width);
      containerWidth.value = width;
      translateX.value = -width;
    },
    [containerWidth, layoutWidth, translateX],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onBegin(() => {
          dragStartX.value = translateX.value;
        })
        .onUpdate((event) => {
          const width = containerWidth.value;
          if (width <= 0) return;
          const next = dragStartX.value + event.translationX;
          const min = -2 * width;
          const max = 0;
          translateX.value = Math.max(min, Math.min(max, next));
        })
        .onEnd((event) => {
          const width = containerWidth.value;
          if (width <= 0) return;

          const deltaFromCenter = translateX.value + width;
          const snapConfig = {
            duration: SNAP_DURATION,
            easing: Easing.out(Easing.cubic),
          };

          let direction: 0 | 1 | -1 = 0;
          if (deltaFromCenter <= -width * SWIPE_COMMIT_RATIO || event.velocityX < -SWIPE_VELOCITY) {
            direction = 1;
          } else if (deltaFromCenter >= width * SWIPE_COMMIT_RATIO || event.velocityX > SWIPE_VELOCITY) {
            direction = -1;
          }

          if (direction === 1) {
            translateX.value = withTiming(-2 * width, snapConfig, (finished) => {
              if (!finished) return;
              runOnJS(shiftWeek)(1);
              translateX.value = -width;
            });
            return;
          }

          if (direction === -1) {
            translateX.value = withTiming(0, snapConfig, (finished) => {
              if (!finished) return;
              runOnJS(shiftWeek)(-1);
              translateX.value = -width;
            });
            return;
          }

          translateX.value = withTiming(-width, snapConfig);
        }),
    [containerWidth, dragStartX, shiftWeek, translateX],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const faintOutline = theme.glassBorderStrong;
  const strongOutline = theme.scheme === 'light' ? '#0F172A' : '#FFFFFF';
  const mutedLabel = theme.glassTextMuted;
  const strongLabel = theme.glassTextPrimary;
  const sundayAccent = Brand.danger;
  const sundayOutline = theme.scheme === 'light' ? Brand.danger : '#F87171';

  const stripProps = {
    selectedDate: value,
    today,
    faintOutline,
    strongOutline,
    mutedLabel,
    strongLabel,
    sundayAccent,
    sundayOutline,
    onPickDay,
  };

  const selectedDateHeader = (
    <View className="gap-1 px-1" accessibilityRole="header">
      <View className="flex-row items-center gap-2">
        <ThemedText
          className="text-[13px] font-semibold capitalize tracking-[0.2px]"
          style={{ color: theme.glassTextMuted }}>
          {selectedDateHeading.weekday}
        </ThemedText>
        {selectedDateHeading.isToday ? (
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: theme.glassPrimarySoft }}>
            <ThemedText className="text-[11px] font-bold" style={{ color: Brand.primary }}>
              {t('chat.today', { defaultValue: 'Today' })}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText
        className="text-[24px] font-bold leading-8 tracking-[-0.4px]"
        style={{ color: theme.glassTextPrimary }}>
        {selectedDateHeading.monthDay}
      </ThemedText>
    </View>
  );

  if (layoutWidth === 0) {
    const current = weekSets[1];
    return (
      <View className="w-full gap-3" onLayout={onLayout}>
        {selectedDateHeader}
        <WeekStrip
          {...stripProps}
          labels={current.labels}
          weekDays={current.weekDays}
        />
      </View>
    );
  }

  return (
    <View className="w-full gap-3">
      {selectedDateHeader}
      <GestureDetector gesture={panGesture}>
        <View
          className="w-full overflow-hidden"
          onLayout={onLayout}
          accessibilityRole="adjustable"
          accessibilityLabel={t('home.selectedDateA11y', {
            defaultValue: 'Selected date {{date}}',
            date: selectedDateHeading.monthDay,
          })}
          accessibilityHint="Swipe left or right to change weeks">
        <Animated.View style={[{ flexDirection: 'row', width: layoutWidth * 3 }, animatedStyle]}>
          {weekSets.map(({ anchor, weekDays, labels }) => (
            <WeekStrip
              key={anchor.toISOString()}
              {...stripProps}
              labels={labels}
              weekDays={weekDays}
              width={layoutWidth}
            />
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
    </View>
  );
}
