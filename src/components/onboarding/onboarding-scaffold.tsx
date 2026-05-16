import { SymbolView } from 'expo-symbols';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepProgress } from '@/components/onboarding/step-progress';
import { GradientButton } from '@/components/ui/gradient-button';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Gradients, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OnboardingScaffoldProps = {
  children: React.ReactNode;
  progress: number;
  stepNumber?: number;
  stepTotal?: number;
  hideHeader?: boolean;
  /** Optional accessory row above the progress header. */
  topAccessory?: React.ReactNode;
  hideBackButton?: boolean;
  canGoBack: boolean;
  onBack: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimaryPress: () => void;
  primaryColors?: readonly [string, string, ...string[]];
  primarySolidColor?: string;
  primaryTextColor?: string;
  primaryLabelNumberOfLines?: number;
  footerAbovePrimary?: React.ReactNode;
  footerCaption?: string;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  hidePrimary?: boolean;
  backgroundImage?: ImageSourcePropType;
  backgroundImageScale?: number;
  /** Root screen background (default onboarding cream). */
  shellBackgroundColor?: string;
  /**
   * Light-on-dark header chrome for cinematic steps (back chip, step count, progress track).
   */
  darkChrome?: boolean;
  /** When the primary CTA mounts, fade it in (e.g. after a delayed reveal). */
  primaryFadeIn?: boolean;
};

/**
 * Shared onboarding shell: safe-area aware header (back + progress), scrollable
 * body, sticky footer with a primary CTA and optional secondary text button.
 */
export function OnboardingScaffold({
  children,
  progress,
  stepNumber,
  stepTotal,
  hideHeader,
  topAccessory,
  hideBackButton = false,
  canGoBack,
  onBack,
  primaryLabel,
  primaryDisabled,
  onPrimaryPress,
  primaryColors,
  primarySolidColor,
  primaryTextColor,
  primaryLabelNumberOfLines,
  footerAbovePrimary,
  footerCaption,
  secondaryLabel,
  onSecondaryPress,
  hidePrimary,
  backgroundImage,
  backgroundImageScale = 1,
  shellBackgroundColor = '#FFFFF9',
  darkChrome = false,
  primaryFadeIn = false,
}: OnboardingScaffoldProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const topPad = insets.top + Spacing.two;
  const bottomPad = insets.bottom + Spacing.three;

  const bgScale = Math.max(0.5, Math.min(3, backgroundImageScale));
  const bgSize = 170 * bgScale;
  const bgRight = -40 * bgScale;
  const bgBottom = -40;

  // Slightly tighter gutters on very small devices.
  const gutterX = width < 360 ? Spacing.three : Spacing.four;

  const showFooter =
    Boolean(footerAbovePrimary) ||
    Boolean(footerCaption) ||
    (Boolean(secondaryLabel) && Boolean(onSecondaryPress)) ||
    !hidePrimary;

  const cinematicAccent = '#FF4D3D';
  const progressTrack = darkChrome ? 'rgba(255,255,255,0.14)' : undefined;
  const progressFill = darkChrome ? cinematicAccent : undefined;
  const backBg = darkChrome ? 'rgba(255,255,255,0.12)' : theme.backgroundElement;
  const backIcon = darkChrome ? '#FFFFFF' : theme.text;
  const stepCountColor = darkChrome ? 'rgba(255,255,255,0.48)' : theme.textSecondary;

  return (
    <View style={{ flex: 1, backgroundColor: shellBackgroundColor }}>
      {backgroundImage ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: bgRight,
            bottom: bgBottom,
            width: bgSize,
            height: bgSize,
            opacity: theme.scheme === 'dark' ? 0.14 : 0.12,
          }}>
          <Image source={backgroundImage} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
        </View>
      ) : (
        null
      )}

      <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
        {hideHeader && topAccessory ? (
          <View
            style={{
              paddingTop: topPad,
              paddingHorizontal: gutterX,
              paddingBottom: Spacing.two,
            }}>
            {topAccessory}
          </View>
        ) : null}

        {!hideHeader ? (
          <View
            style={{
              paddingTop: topPad,
              paddingHorizontal: gutterX,
              paddingBottom: Spacing.four,
              gap: Spacing.three,
            }}>
            <StepProgress
              progress={progress}
              trackColor={progressTrack}
              fillColor={progressFill}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              {hideBackButton ? (
                <View style={{ width: 36, height: 36 }} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous"
                  onPress={onBack}
                  disabled={!canGoBack}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: backBg,
                    opacity: !canGoBack ? 0.35 : pressed ? 0.75 : 1,
                  })}>
                  <SymbolView
                    tintColor={backIcon}
                    name={'chevron.left' as any}
                    size={16}
                    weight="semibold"
                  />
                </Pressable>
              )}

              {stepNumber != null && stepTotal != null ? (
                <ThemedText className="text-[12px] font-semibold" style={{ color: stepCountColor }}>
                  {stepNumber}/{stepTotal}
                </ThemedText>
              ) : (
                <View />
              )}
            </View>
          </View>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexDirection: 'row',
            justifyContent: 'center',
            paddingHorizontal: gutterX,
            paddingTop: hideHeader ? (topAccessory ? Spacing.three : topPad) : 0,
            paddingBottom: Spacing.four,
          }}
          keyboardShouldPersistTaps="handled">
          <View
            style={{
              width: '100%',
              maxWidth: Math.min(MaxContentWidth, 420),
              gap: Spacing.four,
            }}>
            {children}
          </View>
        </ScrollView>

        {showFooter ? (
          <View
            style={{
              paddingHorizontal: gutterX,
              paddingTop: Spacing.two,
              paddingBottom: bottomPad,
              gap: Spacing.two,
              alignItems: 'center',
            }}>
            <View
              style={{
                width: '100%',
                maxWidth: Math.min(MaxContentWidth, 420),
                gap: Spacing.two,
              }}>
              {footerAbovePrimary ? footerAbovePrimary : null}
              {!hidePrimary ? (
                primaryFadeIn ? (
                  <Animated.View entering={FadeIn.duration(360)}>
                    <GradientButton
                      label={primaryLabel}
                      labelNumberOfLines={primaryLabelNumberOfLines}
                      onPress={onPrimaryPress}
                      disabled={primaryDisabled}
                      colors={primaryColors ?? Gradients.composerPrimary}
                      solidColor={primarySolidColor}
                      textColor={primaryTextColor}
                      radius={22}
                      paddingVertical={16}
                    />
                  </Animated.View>
                ) : (
                  <GradientButton
                    label={primaryLabel}
                    labelNumberOfLines={primaryLabelNumberOfLines}
                    onPress={onPrimaryPress}
                    disabled={primaryDisabled}
                    colors={primaryColors ?? Gradients.composerPrimary}
                    solidColor={primarySolidColor}
                    textColor={primaryTextColor}
                    radius={22}
                    paddingVertical={16}
                  />
                )
              ) : null}
              {footerCaption ? (
                <ThemedText themeColor="textSecondary" className="text-[12px] leading-5 text-center">
                  {footerCaption}
                </ThemedText>
              ) : null}
              {secondaryLabel && onSecondaryPress ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onSecondaryPress}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    alignItems: 'flex-start',
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <ThemedText
                    className="text-[14px] font-semibold"
                    style={{ color: Brand.primary, textAlign: 'left' }}>
                    {secondaryLabel}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
