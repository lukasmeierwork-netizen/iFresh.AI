import type { PropsWithChildren, ReactElement } from 'react';
import React from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ui/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const HEADER_HEIGHT = 250;

export type ParallaxScrollViewProps = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  headerOverlay?: ReactElement;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  headerOverlay,
}: ParallaxScrollViewProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme() ?? 'light';
  const safeAreaInsets = useSafeAreaInsets();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      className="flex-1"
      style={{ backgroundColor: 'transparent' }}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Animated.View
        style={[
          { height: HEADER_HEIGHT, overflow: 'hidden' },
          { backgroundColor: headerBackgroundColor[colorScheme === 'dark' ? 'dark' : 'light'] },
          headerAnimatedStyle,
        ]}>
        <View className="absolute inset-0" pointerEvents="none">
          {headerImage}
        </View>

        <View
          pointerEvents="none"
          className="absolute inset-0"
          style={{
            backgroundColor:
              theme.scheme === 'dark' ? 'rgba(4, 18, 32, 0.38)' : 'rgba(255, 255, 255, 0.42)',
          }}
        />
      </Animated.View>
      {headerOverlay ? (
        <View className="absolute left-0 right-0 top-0" pointerEvents="none" style={{ height: HEADER_HEIGHT }}>
          {headerOverlay}
        </View>
      ) : null}

      <ThemedView
        type="backgroundElement"
        className="flex-1 px-4 pt-6"
        style={{
          marginTop: -18,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: theme.backgroundElement,
          shadowColor: theme.shadow,
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
          paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
        }}>
        <View className="mx-auto w-full max-w-[1200px] gap-3">{children}</View>
      </ThemedView>
    </Animated.ScrollView>
  );
}
