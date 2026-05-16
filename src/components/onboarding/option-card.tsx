import React from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';

type OptionCardProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
};

/**
 * Tap-to-select row used by single-choice onboarding screens (screen time,
 * discovery source, etc). Shows a filled indicator on the right when selected.
 */
export function OptionCard({
  label,
  description,
  selected,
  onPress,
  leading,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={[
        'w-full rounded-2xl border border-opacity-10 px-5 py-5 flex-row items-center relative overflow-hidden',
        'active:scale-[0.99] active:opacity-95',
        selected
          ? 'border-[#1E88FF]/40 bg-[#1E88FF]/20 dark:bg-[#0F1115]'
          : 'border-black/10 dark:border-white/10',
      ].join(' ')}>
      {selected ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-[#1E88FF]/10 dark:bg-[#1E88FF]/18"
        />
      ) : null}

      {leading ? <View className="shrink-0 mr-3">{leading}</View> : null}

      <View className="flex-1">
        <ThemedText className="text-[16px] font-semibold leading-6">
          {label}
        </ThemedText>
        {description ? (
          <ThemedText themeColor="textSecondary" className="text-[13px] leading-5">
            {description}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}
