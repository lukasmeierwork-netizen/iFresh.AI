import React, { useMemo } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenContainerProps = ScrollViewProps & {
  children: React.ReactNode;
  withBottomTabInset?: boolean;
  maxContentWidth?: number;
  columnWidth?: number;
  contentStyle?: ViewStyle;
};

/**
 * Standard scrollable screen wrapper. Applies the tab-aware safe-area insets,
 * platform-specific padding, max content width, and background color that
 * every tab uses. Built to replace the ~30 lines of boilerplate each screen
 * re-implemented.
 */
export function ScreenContainer({
  children,
  withBottomTabInset = true,
  maxContentWidth = MaxContentWidth,
  columnWidth = 420,
  contentStyle,
  style,
  ...rest
}: ScreenContainerProps) {
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom:
        safeAreaInsets.bottom +
        (withBottomTabInset ? BottomTabInset : 0) +
        Spacing.three,
    }),
    [safeAreaInsets, withBottomTabInset]
  );

  const contentPlatformStyle = {
    paddingTop: insets.top + Spacing.three,
    paddingBottom: insets.bottom,
  };

  return (
    <ScrollView
      className="flex-1"
      style={[{ backgroundColor: theme.background }, style]}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[
        { flexDirection: 'row', justifyContent: 'center' },
        contentPlatformStyle,
      ]}
      {...rest}>
      <SafeAreaView
        className="w-full items-center justify-center px-6"
        style={{ maxWidth: maxContentWidth }}
        edges={['left', 'right']}>
        <View style={[{ width: '100%', maxWidth: columnWidth, gap: 24 }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
