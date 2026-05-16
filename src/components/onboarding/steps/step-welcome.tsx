import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';

const ONBOARDING_HERO = require('@/assets/images/onboarding/1.png');

type StepWelcomeProps = {
  onContinue: () => void;
};

/**
 * First onboarding screen — hero photo, “Welcome to” / “EyeFresh AI” headline + body,
 * helper text + Continue pill (Tailwind / NativeWind). Dynamic hero sizing uses
 * inline `style` only where layout depends on screen width.
 */
export function StepWelcome({ onContinue }: StepWelcomeProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const heroBandHeight = useMemo(() => Math.min(screenW * 0.92, 360), [screenW]);
  const imageWidth = useMemo(() => screenW * 0.92, [screenW]);

  const bottomPad = Math.max(insets.bottom, Spacing.three);

  return (
    <View className="flex-1" style={{ backgroundColor: "#FFFFF9" }}>
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1">
        {/* Hero — eye image top-right */}
        <View className="mb-6 w-full overflow-hidden" style={{ height: heroBandHeight }}>
          <Image
            source={ONBOARDING_HERO}
            className="absolute"
            style={{
              width: imageWidth,
              height: heroBandHeight + 48,
              right: -screenW * 0.06,
              top: -12,
            }}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
        </View>

        {/* Copy */}
        <View
          className="w-full max-w-[420px] gap-5 self-center px-6"
          style={{ maxWidth: Math.min(MaxContentWidth, screenW - Spacing.three * 2) }}>
          <View className="gap-2" accessibilityRole="header">
            <ThemedText
              themeColor="textSecondary"
              className="text-xl font-semibold leading-7 tracking-tight">
              Welcome to
            </ThemedText>
            <ThemedText
              className="text-4xl font-bold leading-[44px] tracking-tight"
              style={{ color: Brand.primary }}>
              EyeFresh AI
            </ThemedText>
          </View>
          <ThemedText
            themeColor="textSecondary"
            className="text-base font-normal leading-6 tracking-tight">
            A simple dashboard that makes your vision habits visible — daily,
            weekly, and over time.
          </ThemedText>
        </View>

        {/* `flex-1` pushes the CTA down on tall screens; `minHeight` keeps a
            visible gap on small phones when the hero + copy use most of the view. */}
        <View style={{ flex: 1, minHeight: Spacing.five }} />

        {/* Bottom: helper copy + Continue, right-aligned */}
        <View
          className="w-full max-w-[800px] flex-col items-end self-center px-6"
          style={{ paddingBottom: bottomPad, maxWidth: MaxContentWidth }}>
          {/* <ThemedText
            themeColor="textSecondary"
            className="mb-3 max-w-[280px] text-right text-sm font-medium leading-5">
            Continue to personalize your eye-health experience.
          </ThemedText> */}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onContinue}
            className="flex-row items-center gap-2.5 self-end rounded-full py-1.5 pl-6 pr-1.5 active:opacity-90"
            style={{ backgroundColor: Brand.primary }}>
            <ThemedText
              className="text-base font-semibold tracking-tight"
              style={{ color: '#FFFFFF' }}>
              Continue
            </ThemedText>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
              <SymbolView
                tintColor={Brand.primary}
                name={'chevron.right' as any}
                size={14}
                weight="semibold"
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="I already have an account"
            onPress={() => router.push('/sign-in')}
            hitSlop={8}
            className="mt-4 self-end py-2 active:opacity-70">
            <ThemedText
              themeColor="textSecondary"
              className="text-right text-sm leading-5">
              Already have an account?{' '}
              <ThemedText
                className="text-sm font-semibold leading-5"
                style={{ color: Brand.primary }}>
                Sign in
              </ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
