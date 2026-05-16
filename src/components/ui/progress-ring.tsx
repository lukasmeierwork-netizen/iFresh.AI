import React, { memo, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

export type ProgressRingProps = {
  value: number;
  size: number;
  thickness: number;
  color: string;
  trackColor: string;
  backgroundColor: string;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * Ring-shaped progress indicator implemented with two rotated half circles so
 * it renders identically on every platform (no SVG dependency).
 */
export const ProgressRing = memo(function ProgressRing({
  value,
  size,
  thickness,
  color,
  trackColor,
  backgroundColor,
  style,
  children,
}: ProgressRingProps) {
  const progress = Math.max(0, Math.min(1, value));
  const rightRotation = (Math.min(progress, 0.5) / 0.5) * 180;
  const leftRotation = progress > 0.5 ? ((progress - 0.5) / 0.5) * 180 : 0;

  const circleBase = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: thickness,
    }),
    [size, thickness]
  );

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={[circleBase, { borderColor: trackColor }]} />
      <View className="absolute top-0 overflow-hidden" style={{ right: 0, width: size / 2, height: size }}>
        <View
          style={[
            circleBase,
            { position: 'absolute', top: 0, right: 0, borderColor: color, transform: [{ rotateZ: `${rightRotation}deg` }] },
          ]}
        />
      </View>
      <View
        className="absolute top-0 overflow-hidden"
        style={{ left: 0, width: size / 2, height: size, opacity: progress > 0.5 ? 1 : 0 }}>
        <View
          style={[
            circleBase,
            { position: 'absolute', top: 0, left: 0, borderColor: color, transform: [{ rotateZ: `${leftRotation}deg` }] },
          ]}
        />
      </View>
      <View
        className="absolute items-center justify-center"
        style={{
          left: thickness,
          top: thickness,
          width: size - thickness * 2,
          height: size - thickness * 2,
          borderRadius: (size - thickness * 2) / 2,
          backgroundColor,
        }}>
        {children}
      </View>
    </View>
  );
});
