import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  backgroundColor?: string;
  color?: string;
  style?: ViewStyle;
};

/** Small rounded-pill label used for statuses ("Needs review", "Done", etc). */
export function Chip({ label, backgroundColor, color, style }: ChipProps) {
  const theme = useTheme();
  const fill = backgroundColor ?? theme.glassSurfaceStrong;
  const fg = color ?? theme.glassTextPrimary;
  return (
    <View
      style={[
        {
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: fill,
          alignSelf: 'flex-start',
        },
        style,
      ]}>
      <ThemedText type="small" className="text-[11px] font-semibold tracking-[0.8px]" style={{ color: fg }}>
        {label}
      </ThemedText>
    </View>
  );
}
