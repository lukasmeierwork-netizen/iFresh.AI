import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AhaSlideProps = {
  eyebrow: string;
  title: string;
  body: string;
  iconName: string;
  accentColors?: readonly [string, string];
  hero?: React.ReactNode;
  heroAfterEyebrow?: boolean;
  animateTextKey?: string | number;
  children?: React.ReactNode;
};

/**
 * Reusable info slide used by the four "Aha moment" steps + the daily report
 * and "why better" screens. Gradient hero panel with a centered SF symbol,
 * followed by eyebrow / title / body stack.
 */
export function AhaSlide({
  eyebrow,
  title,
  body,
  iconName,
  accentColors = [Brand.primary, Brand.primaryDark],
  hero,
  heroAfterEyebrow = false,
  animateTextKey,
  children,
}: AhaSlideProps) {
  const theme = useTheme();
  const heroNode = hero ? (
    hero
  ) : (
    <LinearGradient
      colors={[...accentColors] as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          height: 220,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        Shadows.assistantBubble,
      ]}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: 'rgba(255,255,255,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <SymbolView
          tintColor="#FFFFFF"
          name={iconName as any}
          size={44}
          weight="semibold"
        />
      </View>
    </LinearGradient>
  );

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 10 }}>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          className="font-semibold tracking-[1.2px]">
          {eyebrow.toUpperCase()}
        </ThemedText>
        {heroAfterEyebrow ? heroNode : null}
        {animateTextKey != null ? (
          <Animated.View
            key={`aha-text-${animateTextKey}`}
            entering={FadeInDown.duration(180)}
            exiting={FadeOutUp.duration(140)}
            style={{ gap: 20 }}>
            <ThemedText className="text-[28px] font-semibold leading-9">
              {title}
            </ThemedText>
            <ThemedText
              themeColor="textSecondary"
              className="text-[15px] leading-6">
              {body}
            </ThemedText>
          </Animated.View>
        ) : (
          <>
            <ThemedText className="text-[28px] font-semibold leading-9">
              {title}
            </ThemedText>
            <ThemedText
              themeColor="textSecondary"
              className="text-[15px] leading-6">
              {body}
            </ThemedText>
          </>
        )}
      </View>
      {!heroAfterEyebrow ? heroNode : null}
      {children ? <View>{children}</View> : null}
    </View>
  );
}
