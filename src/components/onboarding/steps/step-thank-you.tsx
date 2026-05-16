import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import { View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';

type StepThankYouProps = {
  onFireworksComplete?: () => void;
};

const FIREWORKS_MS = 3500;

export function StepThankYou({ onFireworksComplete }: StepThankYouProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    setShowConfetti(true);
    const hide = setTimeout(() => {
      setShowConfetti(false);
      onFireworksComplete?.();
    }, FIREWORKS_MS);
    return () => clearTimeout(hide);
  }, [onFireworksComplete]);

  return (
    <View style={{ gap: 24, alignItems: 'center' }}>
      {showConfetti ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 20 }}>
          <ConfettiCannon
            count={80}
            origin={{ x: -12, y: height + 12 }}
            autoStart
            fadeOut
            explosionSpeed={480}
            fallSpeed={3400}
          />
          <ConfettiCannon
            count={100}
            origin={{ x: width + 12, y: height + 12 }}
            autoStart
            fadeOut
            explosionSpeed={80}
            fallSpeed={3400}
          />
        </View>
      ) : null}
      <LinearGradient
        colors={[Brand.success, Brand.info]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            width: '100%',
            height: 220,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
          },
          Shadows.assistantBubble,
        ]}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SymbolView
            tintColor="#FFFFFF"
            name={'heart.fill' as any}
            size={44}
            weight="semibold"
          />
        </View>
      </LinearGradient>

      <View style={{ gap: 12, alignItems: 'center' }}>
        <ThemedText className="text-[28px] font-semibold leading-9 text-center">
          {t('onboarding.thankYouTitle')}
        </ThemedText>
        <ThemedText
          themeColor="textSecondary"
          className="text-[15px] leading-6 text-center">
          {t('onboarding.thankYouBody')}
        </ThemedText>
      </View>
    </View>
  );
}
