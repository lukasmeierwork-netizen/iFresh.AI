import React from 'react';
import { View, type ViewStyle } from 'react-native';

type IconBadgeProps = {
  size?: number;
  backgroundColor: string;
  style?: ViewStyle;
  children: React.ReactNode;
};

/** Circular wrapper around an icon; a common pattern across every screen. */
export function IconBadge({ size = 44, backgroundColor, style, children }: IconBadgeProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
