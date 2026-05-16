import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { LandoltC } from '@/components/near-vision/landolt-c';
import { LANDOLT_ENTER_MS, LANDOLT_EXIT_MS } from '@/lib/vision/landolt';

type AnimatedLandoltOverlayProps = {
  visible: boolean;
  rotationDeg: number;
  size: number;
  color: string;
  backgroundColor: string;
};

/**
 * Fades and scales the Landolt C in/out whenever the user enters or leaves the
 * valid focus range. Keeps the reanimated shared values local so the parent
 * screen stays simple.
 */
export function AnimatedLandoltOverlay({
  visible,
  rotationDeg,
  size,
  color,
  backgroundColor,
}: AnimatedLandoltOverlayProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Only drive enter/exit from `visible`. `size` tracks live distance and updates often;
  // including it here reset opacity to 0 every frame and caused rapid blinking.
  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: LANDOLT_EXIT_MS, easing: Easing.in(Easing.quad) });
      scale.value = withTiming(0.9, { duration: LANDOLT_EXIT_MS, easing: Easing.in(Easing.quad) });
      return;
    }
    opacity.value = 0;
    scale.value = 0.86;
    opacity.value = withTiming(1, { duration: LANDOLT_ENTER_MS, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, {
      duration: LANDOLT_ENTER_MS + 50,
      easing: Easing.out(Easing.back(1.18)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Reanimated shared values omitted (stable)
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} pointerEvents="none">
      <LandoltC size={size} color={color} backgroundColor={backgroundColor} rotationDeg={rotationDeg} />
    </Animated.View>
  );
}
