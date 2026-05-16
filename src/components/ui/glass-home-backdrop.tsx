import { Image } from 'expo-image';
import React, { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const LIGHT_BACKDROP = require('../../../assets/images/home/16.png');
const DARK_BACKDROP = require('../../../assets/images/home/13.jpg');

/**
 * Soft, colorful photo layer (reference glassmorphism). Slight slow zoom
 * pulse so the background feels alive without distracting from content.
 */
export function GlassHomeBackdrop() {
  const theme = useTheme();
  const backdropSource = theme.scheme === 'dark' ? DARK_BACKDROP : LIGHT_BACKDROP;
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 28_000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [pulse]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1.03 + pulse.value * 0.04 }],
  }));

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden>
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <Image
          source={backdropSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={0}
          blurRadius={5}
        />
      </Animated.View>
      {/* <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassImageOverlay }]} /> */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassImageOverlay }]} />
    </View>
  );
}

/**
 * Full-screen base + image layer for a tab screen. Must be used *inside* each
 * tab route: native `BottomTabs` draws an opaque host above any sibling of
 * `NativeTabs`, so a backdrop next to the tab navigator never shows through.
 */
export function TabGlassScreenRoot({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.glassRoot }}>
      <GlassHomeBackdrop />
      {children}
    </View>
  );
}
