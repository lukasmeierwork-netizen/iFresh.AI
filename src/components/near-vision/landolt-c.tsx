import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Rect } from 'react-native-svg';

type LandoltCProps = {
  size: number;
  color: string;
  backgroundColor?: string;
  rotationDeg: number;
  gapDegrees?: number;
};

export function LandoltC({
  size,
  color,
  backgroundColor = '#FFFFFF',
  rotationDeg,
}: LandoltCProps) {
  return (
    <View
      style={{ width: size, height: size, backgroundColor }}
      accessibilityLabel="Landolt C optotype"
    >
      <Svg width={size} height={size} viewBox="-50 -50 100 100">
        <Defs>
          <Mask id="ringMask">
            <Rect x={-50} y={-50} width={100} height={100} fill="white" />
            <Circle cx={0} cy={0} r={30} fill="black" />
            <Rect x={25} y={-10} width={30} height={20} fill="black" />
          </Mask>
        </Defs>

        <G transform={`rotate(${rotationDeg} 0 0)`}>
          <Circle cx={0} cy={0} r={50} fill={color} mask="url(#ringMask)" />
        </G>
      </Svg>
    </View>
  );
}
