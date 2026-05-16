import React from 'react';
import { View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StepProgressProps = {
  progress: number;
  height?: number;
  /** Override track (unfilled) color — e.g. dark onboarding shell. */
  trackColor?: string;
  /** Override fill color — e.g. cinematic orange accent. */
  fillColor?: string;
};

/** Thin horizontal progress bar shown in the onboarding header. */
export function StepProgress({ progress, height = 4, trackColor, fillColor }: StepProgressProps) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor ?? theme.backgroundSelected,
        overflow: 'hidden',
      }}>
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          backgroundColor: fillColor ?? Brand.primary,
          borderRadius: height,
        }}
      />
    </View>
  );
}
