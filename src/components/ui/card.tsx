import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';

export type CardTone = 'background' | 'element' | 'selected';

type CardProps = ViewProps & {
  tone?: CardTone;
  padding?: number;
  radius?: number;
  style?: ViewStyle;
};

/**
 * Rounded container used on every screen. Keeps radius/padding/background
 * consistent so screens compose Cards instead of hand-rolling `View`s.
 */
export function Card({
  tone = 'element',
  padding = 20,
  radius = 28,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const backgroundColor =
    tone === 'element'
      ? theme.backgroundElement
      : tone === 'selected'
        ? theme.backgroundSelected
        : theme.background;

  return (
    <ThemedView
      {...rest}
      style={[{ backgroundColor, borderRadius: radius, padding }, style]}>
      {children}
    </ThemedView>
  );
}

type PlainCardProps = ViewProps & {
  backgroundColor: string;
  radius?: number;
  padding?: number;
  style?: ViewStyle;
};

/** Card with a custom background (used for hero panels that ignore theme). */
export function PlainCard({
  backgroundColor,
  radius = 28,
  padding = 20,
  style,
  children,
  ...rest
}: PlainCardProps) {
  return (
    <View {...rest} style={[{ backgroundColor, borderRadius: radius, padding, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}
