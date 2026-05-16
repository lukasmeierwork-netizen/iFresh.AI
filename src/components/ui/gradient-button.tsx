import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, View, type ViewStyle, type StyleProp } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';

type GradientButtonProps = {
  label: string;
  /** When set, allows the label to wrap (e.g. long plan CTAs). */
  labelNumberOfLines?: number;
  onPress?: () => void;
  disabled?: boolean;
  colors?: readonly [string, string, ...string[]];
  solidColor?: string;
  textColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

/**
 * Primary action button. When `colors` is provided it renders a LinearGradient;
 * otherwise it falls back to a flat `solidColor`. Keeps disabled/pressed states
 * consistent across Start, Continue, Send, Add-to-calendar, etc.
 */
export function GradientButton({
  label,
  labelNumberOfLines,
  onPress,
  disabled,
  colors,
  solidColor,
  textColor = '#FFFFFF',
  accessibilityLabel,
  style,
  radius = 18,
  paddingVertical = 14,
  paddingHorizontal = 18,
  leading,
  trailing,
}: GradientButtonProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
      {leading}
      <ThemedText
        className="text-[15px] font-semibold text-center"
        style={{ color: textColor }}
        numberOfLines={labelNumberOfLines}>
        {label}
      </ThemedText>
      {trailing}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 },
        style,
      ]}>
      {colors ? (
        <LinearGradient
          colors={[...colors] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius, paddingVertical, paddingHorizontal }}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            borderRadius: radius,
            paddingVertical,
            paddingHorizontal,
            backgroundColor: solidColor,
          }}>
          {content}
        </View>
      )}
    </Pressable>
  );
}
