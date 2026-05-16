import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PixelRatio,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { OnboardingDraft } from '@/lib/onboarding/types';
import { estimatePpiFromPixelRatio, mmToPixels, ppiToPixelsPerMm, RULER_REFERENCE_MM } from '@/lib/vision/near-vision-calibration';
import {
  loadNearVisionCalibration,
  saveNearVisionCalibration,
} from '@/lib/vision/near-vision-storage';

const CALIBRATION_MIN = 0;
const CALIBRATION_MAX = 100;
const HERO_HEIGHT = 216;

function CornerFrame({ size = 22, thickness = 2.5 }: { size?: number; thickness?: number }) {
  const c = 'rgba(255,255,255,0.92)';
  return (
    <>
      <View
        style={[
          styles.cornerBase,
          {
            top: 18,
            left: 18,
            width: size,
            height: size,
            borderTopWidth: thickness,
            borderLeftWidth: thickness,
            borderColor: c,
          },
        ]}
      />
      <View
        style={[
          styles.cornerBase,
          {
            top: 18,
            right: 18,
            width: size,
            height: size,
            borderTopWidth: thickness,
            borderRightWidth: thickness,
            borderColor: c,
          },
        ]}
      />
      <View
        style={[
          styles.cornerBase,
          {
            bottom: 18,
            left: 18,
            width: size,
            height: size,
            borderBottomWidth: thickness,
            borderLeftWidth: thickness,
            borderColor: c,
          },
        ]}
      />
      <View
        style={[
          styles.cornerBase,
          {
            bottom: 18,
            right: 18,
            width: size,
            height: size,
            borderBottomWidth: thickness,
            borderRightWidth: thickness,
            borderColor: c,
          },
        ]}
      />
    </>
  );
}

type StepNearVisionCalibrationProps = {
  draft?: OnboardingDraft;
  setAnswer?: (patch: Partial<OnboardingDraft>) => void;
};

/**
 * Onboarding step: match the on-screen reference bar to a real 20 mm ruler.
 * Persists via the same storage as Settings → Near vision calibration.
 * Also mirrors the value into the onboarding draft (`calibrate`) so it is
 * upserted to the Supabase `onboarding.calibrate` column at account creation.
 */
export function StepNearVisionCalibration({ draft, setAnswer }: StepNearVisionCalibrationProps = {}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const [nearVisionCalibration, setNearVisionCalibration] = useState(
    draft?.calibrate ?? 100
  );
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTriggeredRef = useRef(false);
  const orientation = height >= width ? 'portrait' : 'landscape';
  const deviceId = Device.modelId ?? Device.modelName ?? 'ios-device';
  const calibrationDeviceId = `${deviceId}:${orientation}`;
  const estimatedPpi = useMemo(() => estimatePpiFromPixelRatio(PixelRatio.get()), []);

  const saveCalibrationValue = useCallback(
    async (value: number) => {
      await saveNearVisionCalibration({
        deviceId: calibrationDeviceId,
        orientation,
        correctionScale: value / 100,
        estimatedPpi,
      });
    },
    [calibrationDeviceId, estimatedPpi, orientation]
  );

  const adjustCalibration = useCallback(
    (delta: number) => {
      setNearVisionCalibration((prev) => {
        const next = Math.max(CALIBRATION_MIN, Math.min(CALIBRATION_MAX, prev + delta));
        if (next !== prev) {
          void saveCalibrationValue(next);
          setAnswer?.({ calibrate: next });
        }
        return next;
      });
    },
    [saveCalibrationValue, setAnswer]
  );

  const stopContinuousAdjust = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdTriggeredRef.current = false;
  }, []);

  const startContinuousAdjust = useCallback(
    (delta: number) => {
      stopContinuousAdjust();
      holdTimeoutRef.current = setTimeout(() => {
        holdTriggeredRef.current = true;
        adjustCalibration(delta);
        holdIntervalRef.current = setInterval(() => {
          adjustCalibration(delta);
        }, 90);
      }, 220);
    },
    [adjustCalibration, stopContinuousAdjust]
  );

  useEffect(() => {
    void (async () => {
      try {
        const calibration = await loadNearVisionCalibration();
        const initial =
          calibration && calibration.deviceId === calibrationDeviceId
            ? Math.max(
                CALIBRATION_MIN,
                Math.min(CALIBRATION_MAX, Math.round(calibration.correctionScale * 100))
              )
            : 100;
        setNearVisionCalibration(initial);
        setAnswer?.({ calibrate: initial });
      } catch {
        setNearVisionCalibration(100);
        setAnswer?.({ calibrate: 100 });
      }
    })();
  }, [calibrationDeviceId, setAnswer]);

  useEffect(() => stopContinuousAdjust, [stopContinuousAdjust]);

  const referenceBarPx = useMemo(() => {
    const pixelsPerMm = ppiToPixelsPerMm(estimatedPpi);
    return Math.round(mmToPixels(RULER_REFERENCE_MM, pixelsPerMm, nearVisionCalibration / 100));
  }, [estimatedPpi, nearVisionCalibration]);

  const cardBg = theme.scheme === 'dark' ? theme.glassSurfaceRaised : '#FFFFFF';
  const cardBorder = theme.scheme === 'dark' ? theme.glassBorder : 'rgba(15, 23, 42, 0.08)';
  const cardShadow =
    theme.scheme === 'dark'
      ? { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }
      : { shadowColor: 'rgba(15, 23, 42, 0.12)', shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 };

  return (
    <View style={styles.screenGap}>
      <View style={[styles.heroWrap, Shadows.assistantBubble]}>
        <LinearGradient
          colors={[Brand.primary, '#2563EB', Brand.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            {[200, 152, 112].map((d, i) => (
              <View
                key={d}
                style={{
                  position: 'absolute',
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  borderWidth: 1,
                  borderColor: `rgba(255,255,255,${0.14 - i * 0.035})`,
                }}
              />
            ))}
          </View>

          <CornerFrame />

          <Svg width="100%" height={HERO_HEIGHT} style={StyleSheet.absoluteFill}>
            <Line
              x1="8%"
              y1={HERO_HEIGHT / 2}
              x2="92%"
              y2={HERO_HEIGHT / 2}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={1.5}
              strokeDasharray="7 6"
            />
            <Circle cx="28%" cy={HERO_HEIGHT / 2} r={4} fill="rgba(255,255,255,0.95)" />
            <Circle cx="72%" cy={HERO_HEIGHT / 2} r={4} fill="rgba(255,255,255,0.95)" />
          </Svg>

          <View style={styles.heroCenter}>
            <View style={styles.heroCircle}>
              <SymbolView
                tintColor="#FFFFFF"
                name={'ruler.fill' as any}
                size={40}
                weight="semibold"
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={{ gap: 12 }}>
        <ThemedText className="text-[28px] font-semibold leading-9" style={{ color: theme.text }}>
          {t('onboarding.nearVisionTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.nearVisionBody')}
        </ThemedText>
        <View className="mt-1 flex-row items-center gap-2">
          <SymbolView tintColor={Brand.primary} name={'slider.horizontal.3' as any} size={18} weight="semibold" />
          <ThemedText className="flex-1 text-[14px] leading-5" style={{ color: Brand.primary }}>
            {t('onboarding.nearVisionSettingsHint')}
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.calibrationCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            ...cardShadow,
          },
        ]}>
        <View style={styles.referenceBarWrap} accessibilityRole="none" accessibilityLabel={t('onboarding.nearVisionReferenceA11y')}>
          <View
            style={[
              styles.referenceBar,
              {
                width: referenceBarPx,
                backgroundColor: Brand.primary,
              },
            ]}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.nearVisionDecreaseA11y')}
            onPressIn={() => startContinuousAdjust(-1)}
            onPressOut={stopContinuousAdjust}
            onPress={() => {
              if (!holdTriggeredRef.current) adjustCalibration(-1);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.stepperOuter,
              { opacity: nearVisionCalibration <= CALIBRATION_MIN ? 0.45 : pressed ? 0.84 : 1 },
            ]}>
            <View
              style={[
                styles.stepperBtn,
                theme.scheme === 'dark' ? styles.stepperBtnDark : styles.stepperBtnLight,
                { borderColor: theme.glassBorder },
              ]}>
              <SymbolView tintColor={theme.text} name={'minus' as any} size={15} weight="semibold" />
            </View>
          </Pressable>

          <View className="items-center px-2">
            <View className="flex-row items-baseline gap-1">
              <ThemedText className="text-[36px] font-bold leading-none" style={{ color: theme.text }}>
                {nearVisionCalibration}
              </ThemedText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.nearVisionIncreaseA11y')}
            onPressIn={() => startContinuousAdjust(1)}
            onPressOut={stopContinuousAdjust}
            onPress={() => {
              if (!holdTriggeredRef.current) adjustCalibration(1);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.stepperOuter,
              { opacity: nearVisionCalibration >= CALIBRATION_MAX ? 0.45 : pressed ? 0.84 : 1 },
            ]}>
            <View
              style={[
                styles.stepperBtn,
                theme.scheme === 'dark' ? styles.stepperBtnDark : styles.stepperBtnLight,
                { borderColor: theme.glassBorder },
              ]}>
              <SymbolView tintColor={theme.text} name={'plus' as any} size={15} weight="semibold" />
            </View>
          </Pressable>
        </View>

        <View style={styles.rangeOkRow}>
          <SymbolView tintColor={Brand.success} name={'checkmark.circle.fill' as any} size={18} weight="semibold" />
          <ThemedText className="text-[13px] font-semibold" style={{ color: Brand.success }}>
            {t('onboarding.nearVisionRangeOk')}
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.whyBox,
          {
            backgroundColor:
              theme.scheme === 'dark' ? 'rgba(30, 136, 255, 0.12)' : 'rgba(30, 136, 255, 0.10)',
          },
        ]}>
        <View className="flex-row items-start gap-3">
          <View style={[styles.whyIconCircle, { backgroundColor: theme.scheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)' }]}>
            <SymbolView tintColor={Brand.primary} name={'ruler.fill' as any} size={18} weight="semibold" />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <ThemedText className="text-[15px] font-bold leading-5" style={{ color: theme.text }}>
              {t('onboarding.nearVisionWhyTitle')}
            </ThemedText>
            <ThemedText themeColor="textSecondary" className="text-[13px] leading-[20px]">
              {t('onboarding.nearVisionWhyBody')}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenGap: {
    gap: 24,
  },
  heroWrap: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroGradient: {
    height: HERO_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBase: {
    position: 'absolute',
    borderRadius: 1,
  },
  heroCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrationCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  referenceBarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 4,
    paddingBottom: 20,
    overflow: 'visible',
  },
  referenceBar: {
    height: 6,
    borderRadius: 999,
  },
  stepperOuter: {},
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(15, 23, 42, 0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepperBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  rangeOkRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whyBox: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  whyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
