import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DailyTask } from '@/lib/vision/daily-tasks-api';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type CategoryStyle = {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  labelColor: string;
};

// Visual "themes" — a small set of color/icon families. Specific technique
// slugs from the AI are matched into these by keyword (see `THEME_KEYWORDS`).
type Theme =
  | 'eye-exercise'
  | 'screen-break'
  | 'vision-rest'
  | 'hydration'
  | 'posture'
  | 'nutrition'
  | 'sleep'
  | 'environment';

const THEME_STYLES: Record<Theme, CategoryStyle> = {
  'eye-exercise': {
    icon: 'eye-outline',
    iconColor: '#1E88FF',
    iconBg: 'rgba(30,136,255,0.14)',
    labelColor: '#1E88FF',
  },
  'screen-break': {
    icon: 'cellphone-off',
    iconColor: '#F97316',
    iconBg: 'rgba(249,115,22,0.14)',
    labelColor: '#F97316',
  },
  'vision-rest': {
    icon: 'sleep',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.14)',
    labelColor: '#8B5CF6',
  },
  hydration: {
    icon: 'water-outline',
    iconColor: '#14B8A6',
    iconBg: 'rgba(20,184,166,0.14)',
    labelColor: '#14B8A6',
  },
  posture: {
    icon: 'human-handsup',
    iconColor: '#22C55E',
    iconBg: 'rgba(34,197,94,0.14)',
    labelColor: '#22C55E',
  },
  nutrition: {
    icon: 'food-apple-outline',
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.14)',
    labelColor: '#EF4444',
  },
  sleep: {
    icon: 'weather-night',
    iconColor: '#6366F1',
    iconBg: 'rgba(99,102,241,0.14)',
    labelColor: '#6366F1',
  },
  environment: {
    icon: 'lightbulb-outline',
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.14)',
    labelColor: '#F59E0B',
  },
};

/**
 * Each theme's keyword fragments. The first keyword that appears as a
 * substring of the lowercased category slug wins. Ordering matters: more
 * specific keywords come before more generic ones so e.g. `screen-brightness`
 * lands in `environment` (lighting) only if no `screen-break` keyword fires
 * first — adjust with care.
 */
const THEME_KEYWORDS: Array<[Theme, readonly string[]]> = [
  ['screen-break', ['20-20-20', 'screen-break', 'device-detox', 'phone-break', 'screen-pause']],
  ['eye-exercise', [
    'blink',
    'saccade',
    'convergence',
    'focus-shift',
    'near-far',
    'figure-eight',
    'eye-roll',
    'exercise',
    'drill',
    'stretch',
    'gaze',
  ]],
  ['vision-rest', ['palm', 'compress', 'rest', 'relax', 'soothe', 'recovery']],
  ['hydration', ['hydra', 'water', 'drink', 'humidif', 'moistur']],
  ['posture', ['posture', 'ergonom', 'distance', 'reading-distance', 'screen-position', 'desk', 'monitor-height']],
  ['nutrition', ['nutri', 'food', 'meal', 'lutein', 'omega', 'vitamin', 'leafy', 'fish', 'carrot']],
  ['sleep', ['sleep', 'bed', 'wind-down', 'nap', 'night-routine']],
  ['environment', [
    'light',
    'glare',
    'environ',
    'brightness',
    'lamp',
    'sun',
    'outdoor',
    'blue-light',
    'ambient',
    'contrast',
  ]],
];

const THEME_FALLBACK_ORDER: readonly Theme[] = [
  'eye-exercise',
  'screen-break',
  'vision-rest',
  'hydration',
  'posture',
  'nutrition',
  'sleep',
  'environment',
];

function hashSlug(slug: string): number {
  // djb2 — stable across sessions, no platform dependency.
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function resolveTheme(slug: string): Theme {
  const lower = slug.toLowerCase();
  for (const [theme, keywords] of THEME_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return theme;
    }
  }
  // No keyword match → deterministically scatter across themes so unrelated
  // slugs still get a consistent (but varied) color across sessions.
  return THEME_FALLBACK_ORDER[hashSlug(lower) % THEME_FALLBACK_ORDER.length] ?? 'eye-exercise';
}

function getCategoryStyle(slug: string): CategoryStyle {
  return THEME_STYLES[resolveTheme(slug)];
}

type DailyTaskCardProps = {
  task: DailyTask;
  onToggle: (taskId: string, nextCompleted: boolean) => void;
};

export function DailyTaskCard({ task, onToggle }: DailyTaskCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const style = useMemo(() => getCategoryStyle(task.category), [task.category]);

  const categoryLabel = t(`task.category.${task.category}`, {
    defaultValue: task.category.replace(/-/g, ' ').toUpperCase(),
  });

  const handleToggle = () => onToggle(task.id, !task.completed);

  const done = task.completed;
  const categoryColor = done ? theme.glassTextMuted : style.labelColor;
  const titleColor = done ? theme.glassTextMuted : theme.glassTextPrimary;
  const bodyColor = done ? theme.glassTextFaint : theme.glassTextSecondary;
  const iconColor = done ? theme.glassIconMuted : style.iconColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: task.completed }}
      accessibilityLabel={t('task.toggleA11y', {
        defaultValue: 'Toggle task: {{title}}',
        title: task.title,
      })}
      onPress={handleToggle}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
      })}>
      <View className="flex-row items-start gap-3">
        <View
          className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.glassSurfaceRaised }}>
          <MaterialCommunityIcons name={style.icon} size={18} color={iconColor} />
        </View>

        <View className="min-w-0 flex-1 pr-2">
          <ThemedText
            className="text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ color: categoryColor }}>
            {categoryLabel}
          </ThemedText>
          <ThemedText
            className="mt-0.5 text-[14px] font-semibold leading-5"
            style={{
              color: titleColor,
              textDecorationLine: done ? 'line-through' : 'none',
            }}>
            {task.title}
          </ThemedText>
          <ThemedText
            className="mt-0.5 text-[13px] leading-[18px]"
            style={{
              color: bodyColor,
              textDecorationLine: done ? 'line-through' : 'none',
            }}>
            {task.description}
          </ThemedText>
        </View>

        <View
          className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
          style={{
            borderWidth: task.completed ? 0 : 1,
            borderColor: task.completed ? 'transparent' : theme.glassBorderStrong,
            backgroundColor: task.completed ? Brand.primary : theme.glassSurfaceRaised,
          }}>
          {task.completed ? (
            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
