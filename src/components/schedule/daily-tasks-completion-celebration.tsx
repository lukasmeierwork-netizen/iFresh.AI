import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOLD_MS = 2800;
const FADE_IN_MS = 420;
const FADE_OUT_MS = 720;

const PETAL_COLORS = [
  Brand.success,
  Brand.primary,
  Brand.warnAmber,
  Brand.violet,
  Brand.info,
  '#F9A8D4',
  '#FDA4AF',
  '#FDE68A',
];

type DailyTasksCompletionCelebrationProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function DailyTasksCompletionCelebration({
  visible,
  onDismiss,
}: DailyTasksCompletionCelebrationProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.94);

  const confettiKey = useMemo(
    () => (visible ? `celebration-${Date.now()}` : 'celebration-hidden'),
    [visible],
  );

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = 0;
      cardScale.value = 0.94;
      return;
    }

    overlayOpacity.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
    cardScale.value = withTiming(1, {
      duration: FADE_IN_MS + 80,
      easing: Easing.out(Easing.back(1.15)),
    });

    const fadeOutTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onDismiss)();
        },
      );
    }, HOLD_MS);

    return () => clearTimeout(fadeOutTimer);
  }, [cardScale, onDismiss, overlayOpacity, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <Animated.View
        pointerEvents="none"
        className="flex-1 items-center justify-center px-8"
        style={[
          {
            backgroundColor: theme.scheme === 'light' ? 'rgba(15, 23, 42, 0.28)' : 'rgba(0, 0, 0, 0.45)',
          },
          overlayStyle,
        ]}>
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
          <ConfettiCannon
            key={`${confettiKey}-center`}
            count={90}
            origin={{ x: width / 2, y: -16 }}
            autoStart
            fadeOut
            colors={PETAL_COLORS}
            explosionSpeed={420}
            fallSpeed={3200}
          />
          <ConfettiCannon
            key={`${confettiKey}-left`}
            count={70}
            origin={{ x: width * 0.18, y: -12 }}
            autoStart
            fadeOut
            colors={PETAL_COLORS}
            explosionSpeed={360}
            fallSpeed={3000}
          />
          <ConfettiCannon
            key={`${confettiKey}-right`}
            count={70}
            origin={{ x: width * 0.82, y: -12 }}
            autoStart
            fadeOut
            colors={PETAL_COLORS}
            explosionSpeed={360}
            fallSpeed={3000}
          />
          <ConfettiCannon
            key={`${confettiKey}-rise-left`}
            count={55}
            origin={{ x: -12, y: height * 0.72 }}
            autoStart
            fadeOut
            colors={PETAL_COLORS}
            explosionSpeed={520}
            fallSpeed={3400}
          />
          <ConfettiCannon
            key={`${confettiKey}-rise-right`}
            count={55}
            origin={{ x: width + 12, y: height * 0.72 }}
            autoStart
            fadeOut
            colors={PETAL_COLORS}
            explosionSpeed={520}
            fallSpeed={3400}
          />
        </View>

        <Animated.View
          accessibilityRole="alert"
          accessibilityLabel={t('task.allCompleteTitle')}
          style={[
            {
              width: '100%',
              maxWidth: 340,
              borderRadius: 28,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.glassBorderStrong,
              backgroundColor: theme.glassSurface,
            },
            Shadows.userBubble,
            cardStyle,
          ]}>
          <LinearGradient
            colors={[Brand.success, Brand.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.22)',
              }}>
              <SymbolView tintColor="#FFFFFF" name={'sparkles' as any} size={34} weight="semibold" />
            </View>
          </LinearGradient>

          <View className="gap-2 px-6 py-6">
            <ThemedText
              className="text-center text-[22px] font-bold leading-7"
              style={{ color: theme.glassTextPrimary }}>
              {t('task.allCompleteTitle')}
            </ThemedText>
            <ThemedText
              className="text-center text-[15px] leading-6"
              style={{ color: theme.glassTextSecondary }}>
              {t('task.allCompleteBody')}
            </ThemedText>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
