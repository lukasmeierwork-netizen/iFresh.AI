import React from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type SegmentedControlOption<T extends string> = {
  id: T;
  label: string;
  accessibilityLabel?: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: readonly SegmentedControlOption<T>[];
  onChange: (next: T) => void;
};

/**
 * iOS-style pill segmented control for binary/multi choice within a settings
 * card. Selected segment lifts to `glassSurfaceRaised`; unselected segments
 * stay transparent on top of a soft `glassWell` track.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      className="flex-row gap-1 rounded-2xl p-1"
      style={{
        backgroundColor: theme.glassWell,
        borderColor: theme.glassBorderMuted,
        borderWidth: 1,
      }}>
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="button"
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.id)}
            className="flex-1 items-center justify-center rounded-xl px-3 py-2"
            style={({ pressed }) => ({
              backgroundColor: selected ? theme.glassSurfaceRaised : 'transparent',
              opacity: !selected && pressed ? 0.7 : 1,
              shadowColor: selected ? theme.shadow : 'transparent',
              shadowOpacity: selected ? 0.12 : 0,
              shadowRadius: selected ? 6 : 0,
              shadowOffset: { width: 0, height: 1 },
            })}>
            <ThemedText
              className="text-center text-[13px] font-semibold"
              style={{
                color: selected ? theme.glassTextPrimary : theme.glassTextMuted,
              }}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
