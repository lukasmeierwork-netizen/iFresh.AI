import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedLandoltOverlay } from '@/components/near-vision/animated-landolt-overlay';
import { NearVisionDistanceEvaluator } from '@/components/near-vision/near-vision-distance-evaluator';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useNearVisionTest } from '@/hooks/use-near-vision-test';
import { useNearVisionDisplayFormat } from '@/hooks/use-near-vision-display-format';
import { useTheme } from '@/hooks/use-theme';
import { useUsageField } from '@/hooks/use-usage-store';
import {
  isWithinFocusRange,
  NEAR_VISION_TARGET_CM,
  NEAR_VISION_TOLERANCE_CM,
} from '@/lib/vision/near-vision-config';
import { loadNearVisionInputMode, type NearVisionInputMode } from '@/lib/vision/near-vision-storage';
import { formatAcuityValue } from '@/lib/vision/snellen';

export default function NearVisionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const [inputMode, setInputMode] = useState<NearVisionInputMode>('swipe');
  const { displayFormat } = useNearVisionDisplayFormat();

  const {
    step,
    setStep,
    liveDistanceCm,
    handleLiveDistance,
    inValidFocusRange,
    landoltSizePx,
    landoltRotationDeg,
    landoltRotateProgress,
    landoltRotateSecondsRemaining,
    wrongSwipe,
    onLandoltSwipeEnd,
    submitLandoltAnswer,
    pendingEyeLabel,
    pendingEyeInstruction,
    activeEye,
    startPendingEye,
    rightResult,
    leftResult,
    bothResult,
  } = useNearVisionTest();
  const eyeCoverState = useUsageField('eyeCoverState');

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    }),
    [safeAreaInsets]
  );

  const contentPlatformStyle = {
    paddingTop: insets.top + Spacing.three,
    paddingBottom: insets.bottom,
  };

  const surface = theme.backgroundElement;
  const cardBg = theme.glassSurface;
  const divider = theme.glassBorderMuted;
  const cardBorder = theme.glassBorder;
  const labelMuted = theme.glassTextMuted;
  const bodyMuted = theme.glassTextSecondary;
  const heading = theme.glassTextPrimary;

  const pageBorderColor = useMemo(() => {
    if (liveDistanceCm == null) return theme.textSecondary;
    return isWithinFocusRange(liveDistanceCm) ? Brand.success : Brand.danger;
  }, [liveDistanceCm, theme.textSecondary]);

  const distanceLabel = useMemo(() => {
    if (liveDistanceCm == null || Number.isNaN(liveDistanceCm)) return t('nearVision.distanceUnknown');
    return t('nearVision.distanceCm', { cm: Math.round(liveDistanceCm) });
  }, [liveDistanceCm, t]);
  const validRange = useMemo(() => {
    const minCm = Math.max(1, Math.round(NEAR_VISION_TARGET_CM - NEAR_VISION_TOLERANCE_CM));
    const maxCm = Math.max(minCm, Math.round(NEAR_VISION_TARGET_CM + NEAR_VISION_TOLERANCE_CM));
    return { minCm, maxCm };
  }, []);
  const distanceGauge = useMemo(() => {
    const validSpan = Math.max(2, validRange.maxCm - validRange.minCm);
    const sidePaddingCm = Math.max(6, Math.round(validSpan * 0.75));
    const gaugeMinCm = Math.max(1, validRange.minCm - sidePaddingCm);
    const gaugeMaxCm = Math.max(gaugeMinCm + 1, validRange.maxCm + sidePaddingCm);
    const gaugeSpan = gaugeMaxCm - gaugeMinCm;
    const currentCm = liveDistanceCm ?? NEAR_VISION_TARGET_CM;
    const clampedCurrentCm = Math.max(gaugeMinCm, Math.min(gaugeMaxCm, currentCm));
    const markerRatio = (clampedCurrentCm - gaugeMinCm) / gaugeSpan;
    const validStartRatio = (validRange.minCm - gaugeMinCm) / gaugeSpan;
    const validEndRatio = (validRange.maxCm - gaugeMinCm) / gaugeSpan;
    return {
      gaugeMinCm,
      gaugeMaxCm,
      markerRatio,
      validStartRatio,
      validEndRatio,
    };
  }, [liveDistanceCm, validRange.maxCm, validRange.minCm]);
  const isDistanceWithinDisplayedValidRange = useMemo(() => {
    if (liveDistanceCm == null || Number.isNaN(liveDistanceCm)) return false;
    return liveDistanceCm >= validRange.minCm && liveDistanceCm <= validRange.maxCm;
  }, [liveDistanceCm, validRange.maxCm, validRange.minCm]);

  const requiredEyeCoverState =
    activeEye === 'right' ? 'leftCovered' : activeEye === 'left' ? 'rightCovered' : 'neither';
  const EYE_COVER_GRACE_MS = 2400;
  const EYE_COVER_MISMATCH_HOLD_MS = 1800;
  const lastEyeCoverMatchAtRef = useRef<number | null>(null);
  const lastEyeCoverMismatchAtRef = useRef<number | null>(null);
  const hasEverMatchedEyeCoverRef = useRef(false);

  useEffect(() => {
    const now = Date.now();
    if (eyeCoverState === requiredEyeCoverState) {
      lastEyeCoverMatchAtRef.current = now;
      lastEyeCoverMismatchAtRef.current = null;
      hasEverMatchedEyeCoverRef.current = true;
      return;
    }
    // Unknown is often a transient camera/classifier dropout while the eye
    // is still covered correctly, so do not immediately start mismatch timing.
    if (eyeCoverState === 'unknown') {
      return;
    }
    if (lastEyeCoverMismatchAtRef.current == null) {
      lastEyeCoverMismatchAtRef.current = now;
    }
  }, [eyeCoverState, requiredEyeCoverState]);

  const now = Date.now();
  const recentMatched =
    lastEyeCoverMatchAtRef.current != null && now - lastEyeCoverMatchAtRef.current <= EYE_COVER_GRACE_MS;
  const mismatchConfirmed =
    lastEyeCoverMismatchAtRef.current != null && now - lastEyeCoverMismatchAtRef.current >= EYE_COVER_MISMATCH_HOLD_MS;
  const eyeCoverMatches =
    eyeCoverState === requiredEyeCoverState ||
    (hasEverMatchedEyeCoverRef.current && (recentMatched || !mismatchConfirmed));
  const showLandolt = inValidFocusRange && eyeCoverMatches;
  const eyeCoverInstruction = useMemo(() => {
    if (requiredEyeCoverState === 'leftCovered') return t('nearVision.eyeCoverRequired.leftCovered');
    if (requiredEyeCoverState === 'rightCovered') return t('nearVision.eyeCoverRequired.rightCovered');
    return t('nearVision.eyeCoverRequired.neither');
  }, [requiredEyeCoverState, t]);
  const requiredEyeCoverLabel = useMemo(() => {
    if (requiredEyeCoverState === 'leftCovered') return t('nearVision.leftEye');
    if (requiredEyeCoverState === 'rightCovered') return t('nearVision.rightEye');
    if (requiredEyeCoverState === 'neither') return t('nearVision.bothEyes');
    return t('settings.permissionUnknown');
  }, [requiredEyeCoverState, t]);
  const detectedEyeCoverLabel = useMemo(() => {
    if (eyeCoverState === 'leftCovered') return t('nearVision.leftEye');
    if (eyeCoverState === 'rightCovered') return t('nearVision.rightEye');
    if (eyeCoverState === 'neither') return t('nearVision.bothEyes');
    return t('settings.permissionUnknown');
  }, [eyeCoverState, t]);

  const instructionOverlayLines = useMemo(() => {
    const lines: string[] = [];
    if (!inValidFocusRange) {
      lines.push(
        t('nearVision.holdDistanceBullet', {
          cm: NEAR_VISION_TARGET_CM,
          minCm: validRange.minCm,
          maxCm: validRange.maxCm,
        })
      );
    }
    if (!eyeCoverMatches) {
      lines.push(eyeCoverInstruction);
    }
    lines.push(t('nearVision.swipeWhenVisible'));
    return lines;
  }, [eyeCoverInstruction, eyeCoverMatches, inValidFocusRange, t, validRange.maxCm, validRange.minCm]);

  const landoltPanGesture = useMemo(
    () =>
      Gesture.Pan().onEnd((e) => {
        if (inputMode !== 'swipe') return;
        runOnJS(onLandoltSwipeEnd)(e.translationX, e.translationY);
      }),
    [inputMode, onLandoltSwipeEnd]
  );

  const directionGrid = useMemo(
    () => [
      [
        { octant: 5, glyph: '↖', a11y: t('nearVision.directionUpLeft') },
        { octant: 6, glyph: '↑', a11y: t('nearVision.directionUp') },
        { octant: 7, glyph: '↗', a11y: t('nearVision.directionUpRight') },
      ],
      [
        { octant: 4, glyph: '←', a11y: t('nearVision.directionLeft') },
        null,
        { octant: 0, glyph: '→', a11y: t('nearVision.directionRight') },
      ],
      [
        { octant: 3, glyph: '↙', a11y: t('nearVision.directionDownLeft') },
        { octant: 2, glyph: '↓', a11y: t('nearVision.directionDown') },
        { octant: 1, glyph: '↘', a11y: t('nearVision.directionDownRight') },
      ],
    ],
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const savedMode = await loadNearVisionInputMode();
      if (!cancelled) setInputMode(savedMode);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (step === 'test') {
    const showInstructionOverlay = !showLandolt;
    const showController = inputMode === 'controller';

    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
        <NearVisionDistanceEvaluator active targetDistanceCm={NEAR_VISION_TARGET_CM} toleranceCm={NEAR_VISION_TOLERANCE_CM} onDistanceEstimate={handleLiveDistance} />
        <View
          style={{
            flex: 1,
            borderWidth: 12,
            borderColor: pageBorderColor,
            backgroundColor: theme.background,
          }}>
          <GestureDetector gesture={landoltPanGesture}>
            <View
              accessibilityLabel={t('nearVision.landoltA11y')}
              accessibilityHint={
                inValidFocusRange
                  ? t('nearVision.landoltHintInRange')
                  : t('nearVision.landoltHintOutOfRange', { cm: NEAR_VISION_TARGET_CM })
              }
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 12,
                borderWidth: 3,
                borderColor: wrongSwipe ? Brand.danger : 'transparent',
                borderRadius: 16,
              }}>
              <AnimatedLandoltOverlay
                visible={showLandolt}
                rotationDeg={landoltRotationDeg}
                size={landoltSizePx}
                color={theme.text}
                backgroundColor={theme.background}
              />
              {showLandolt ? (
                <View
                  style={{ marginTop: 14, width: '100%', maxWidth: 280, paddingHorizontal: 4 }}
                  accessibilityRole="timer"
                  accessibilityLabel={t('nearVision.nextSymbolTimerA11y', {
                    seconds: landoltRotateSecondsRemaining,
                  })}>
                  <ThemedText
                    themeColor="textSecondary"
                    className="text-center text-[12px] leading-[16px] font-medium"
                    style={{ letterSpacing: 0.2 }}>
                    {t('nearVision.nextSymbolCountdown', { seconds: landoltRotateSecondsRemaining })}
                  </ThemedText>
                  <View
                    style={{
                      marginTop: 8,
                      height: 5,
                      width: '100%',
                      borderRadius: 3,
                      backgroundColor: divider,
                      overflow: 'hidden',
                    }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(1, landoltRotateProgress)) * 100}%`,
                        borderRadius: 3,
                        backgroundColor: Brand.success,
                      }}
                    />
                  </View>
                  <ThemedText
                    themeColor="textSecondary"
                    className="mt-3 px-1 text-center text-[12px] leading-[16px]"
                    style={{ maxWidth: 280 }}>
                    {showController ? t('nearVision.answerRecordHintController') : t('nearVision.answerRecordHintSwipe')}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </GestureDetector>

          {showInstructionOverlay ? (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, zIndex: 8 },
              ]}>
              <LinearGradient
                colors={['rgba(255, 232, 232, 0.94)', 'rgba(255, 205, 205, 0.9)', 'rgba(255, 220, 220, 0.92)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 22,
                  paddingVertical: 22,
                  paddingHorizontal: 20,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                }}>
                <ThemedText
                  className="mb-3 text-center text-[15px] font-semibold leading-5"
                  style={{ color: '#991B1B' }}>
                  {t('nearVision.followSteps')}
                </ThemedText>
                {instructionOverlayLines.map((line, i) => (
                  <ThemedText
                    key={`${i}-${line}`}
                    className="text-[13px] leading-[19px]"
                    style={{ color: '#7F1D1D', marginBottom: i === instructionOverlayLines.length - 1 ? 0 : 10 }}>
                    {`\u2022 ${line}`}
                  </ThemedText>
                ))}
              </LinearGradient>
            </View>
          ) : null}

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              top: safeAreaInsets.top + 10,
              zIndex: 10,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 22,
              // backgroundColor: theme.scheme === 'dark' ? 'rgba(17,24,39,0.9)' : '#FFFFFF',
              // borderWidth: 1,
              // borderColor: theme.scheme === 'dark' ? 'rgba(148,163,184,0.34)' : '#E5E7EB',
            }}>
            {/* <View style={{ paddingRight: 56 }}>
              <ThemedText
                className="text-[15px] font-semibold leading-[20px]"
                style={{ color: theme.scheme === 'dark' ? theme.glassTextPrimary : '#0F172A' }}>
                {distanceLabel}
              </ThemedText>
              <ThemedText
                className="mt-0.5 text-[12px] leading-[15px]"
                style={{ color: theme.scheme === 'dark' ? theme.glassTextSecondary : '#64748B' }}>
                {`${validRange.minCm}-${validRange.maxCm} cm`}
              </ThemedText>
            </View> */}
            <View className="mt-4 w-full">
              <View
                style={{
                  position: 'absolute',
                  left: `${distanceGauge.validStartRatio * 100}%`,
                  top: -12,
                  bottom: -22,
                  marginLeft: -0.5,
                  borderLeftWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: theme.scheme === 'dark' ? 'rgba(148,163,184,0.3)' : '#D1D5DB',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: `${distanceGauge.validEndRatio * 100}%`,
                  top: -12,
                  bottom: -22,
                  marginLeft: -0.5,
                  borderLeftWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: theme.scheme === 'dark' ? 'rgba(148,163,184,0.3)' : '#D1D5DB',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: `${distanceGauge.markerRatio * 100}%`,
                  top: -48,
                  marginLeft: -32,
                  minWidth: 64,
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: isDistanceWithinDisplayedValidRange ? Brand.success : '#EF4444',
                }}>
                <ThemedText className="text-[11px] font-semibold" style={{ color: '#FFFFFF' }}>
                  {distanceLabel}
                </ThemedText>
                <View
                  style={{
                    position: 'absolute',
                    bottom: -5,
                    left: '50%',
                    width: 10,
                    height: 10,
                    marginLeft: -5,
                    transform: [{ rotate: '45deg' }],
                    backgroundColor: isDistanceWithinDisplayedValidRange ? Brand.success : '#EF4444',
                  }}
                />
              </View>
              <View
                style={{
                  height: 11,
                  borderRadius: 999,
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(148,163,184,0.22)' : '#D1D5DB',
                  overflow: 'visible',
                }}>
                <View
                  style={{
                    position: 'absolute',
                    left: `${distanceGauge.validStartRatio * 100}%`,
                    width: `${Math.max(0, (distanceGauge.validEndRatio - distanceGauge.validStartRatio) * 100)}%`,
                    top: 0,
                    bottom: 0,
                    backgroundColor: Brand.success,
                    opacity: 1,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: `${distanceGauge.markerRatio * 100}%`,
                    top: -7,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    marginLeft: -12,
                    backgroundColor: isDistanceWithinDisplayedValidRange ? Brand.success : '#EF4444',
                    borderWidth: 4,
                    borderColor: theme.scheme === 'dark' ? '#F8FAFC' : '#FFFFFF',
                  }}
                />
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <ThemedText
                  className="text-[11px] font-semibold leading-[14px]"
                  style={{ color: theme.scheme === 'dark' ? theme.glassTextMuted : '#6B7280' }}>
                  {`${distanceGauge.gaugeMinCm}cm`}
                </ThemedText>
                <ThemedText className="text-[15px] font-semibold leading-[20px]" style={{ color: Brand.success }}>
                  {`${validRange.minCm}-${validRange.maxCm} cm`}
                </ThemedText>
                <ThemedText
                  className="text-[11px] font-semibold leading-[14px]"
                  style={{ color: theme.scheme === 'dark' ? theme.glassTextMuted : '#6B7280' }}>
                  {`${distanceGauge.gaugeMaxCm}cm`}
                </ThemedText>
              </View>
            </View>
            <View
              style={{
                marginTop: 14,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.scheme === 'dark' ? 'rgba(148,163,184,0.3)' : '#E5E7EB',
                paddingTop: 12,
                flexDirection: 'row',
                alignItems: 'stretch',
              }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.scheme === 'dark' ? 'rgba(34,197,94,0.18)' : '#DCFCE7',
                    marginRight: 8,
                  }}>
                  <SymbolView name={'eye.fill' as any} size={13} tintColor={Brand.success} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText
                    className="text-[13px] font-semibold leading-[16px]"
                    numberOfLines={2}
                    style={{ color: theme.scheme === 'dark' ? '#86EFAC' : '#16A34A' }}>
                    {requiredEyeCoverLabel}
                  </ThemedText>
                </View>
              </View>
              <View
                style={{
                  width: StyleSheet.hairlineWidth,
                  alignSelf: 'stretch',
                  backgroundColor: theme.scheme === 'dark' ? 'rgba(148,163,184,0.3)' : '#E5E7EB',
                  marginHorizontal: 10,
                }}
              />
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: eyeCoverMatches
                      ? theme.scheme === 'dark'
                        ? 'rgba(34,197,94,0.18)'
                        : '#DCFCE7'
                      : theme.scheme === 'dark'
                        ? 'rgba(239,68,68,0.16)'
                        : '#FEE2E2',
                    marginRight: 8,
                  }}>
                  <SymbolView
                    name={(eyeCoverMatches ? 'checkmark' : 'exclamationmark') as any}
                    size={13}
                    tintColor={eyeCoverMatches ? Brand.success : '#EF4444'}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText
                    className="text-[13px] font-semibold leading-[16px]"
                    numberOfLines={2}
                    style={{ color: eyeCoverMatches ? (theme.scheme === 'dark' ? '#86EFAC' : '#16A34A') : '#EF4444' }}>
                    {detectedEyeCoverLabel}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nearVision.closeA11y')}
            onPress={() => router.back()}
            style={({ pressed }) => [
              {
                position: 'absolute',
                top: safeAreaInsets.top + 12,
                right: 16,
                zIndex: 10,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: surface,
                opacity: pressed ? 0.84 : 1,
              },
            ]}>
            <SymbolView tintColor={theme.text} name={'xmark' as any} size={18} />
          </Pressable>

          {showController ? (
            <View
              style={{
                position: 'absolute',
                bottom: safeAreaInsets.bottom + 14,
                left: 0,
                right: 0,
                alignItems: 'center',
                zIndex: 11,
              }}>
              <View
                className="rounded-2xl border px-4 pb-4 pt-3"
                style={{ backgroundColor: theme.glassSurface, borderColor: theme.glassBorder }}>
                <ThemedText className="mb-3 text-center text-[12px] font-semibold" style={{ color: theme.glassTextSecondary }}>
                  {t('nearVision.directionButtonsTitle')}
                </ThemedText>
                <View className="gap-3">
                  {directionGrid.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row gap-3">
                      {row.map((button, colIndex) => {
                        if (!button) {
                          return (
                            <View
                              key={`center-${rowIndex}-${colIndex}`}
                              className="h-14 w-14 items-center justify-center rounded-xl border"
                              style={{
                                backgroundColor: theme.glassSurfaceRaised,
                                borderColor: theme.glassBorderMuted,
                              }}>
                              <View className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: theme.glassTextMuted }} />
                            </View>
                          );
                        }

                        return (
                          <Pressable
                            key={button.octant}
                            accessibilityRole="button"
                            accessibilityLabel={button.a11y}
                            accessibilityHint={t('nearVision.directionButtonHint')}
                            disabled={!showLandolt}
                            onPress={() => submitLandoltAnswer(button.octant)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.82 : showLandolt ? 1 : 0.45 }]}>
                            <View
                              className="h-14 w-14 items-center justify-center rounded-xl border"
                              style={{
                                backgroundColor: theme.glassSurfaceRaised,
                                borderColor: theme.glassBorderStrong,
                              }}>
                              <ThemedText className="text-[24px] font-semibold leading-7" style={{ color: theme.glassIcon }}>
                                {button.glyph}
                              </ThemedText>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    );
  }

  if (step === 'ready') {
    return (
      <TabGlassScreenRoot>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[{ flexDirection: 'row', justifyContent: 'center' }, contentPlatformStyle]}>
          <SafeAreaView className="w-full items-center justify-center px-6" style={{ maxWidth: MaxContentWidth }} edges={['left', 'right']}>
            <View className="w-full max-w-[420px] gap-4">
              <View className="flex-row items-center justify-between gap-4">
                <View className="gap-1">
                  <ThemedText type="small" className="font-semibold tracking-[1.2px]" style={{ color: labelMuted }}>
                    {t('common.brand')}
                  </ThemedText>
                  <ThemedText className="text-[30px] font-semibold leading-[38px]" style={{ color: heading }}>
                    {t('nearVision.title')}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('nearVision.goBackA11y')}
                  onPress={() => router.back()}
                  style={({ pressed }) => [
                    {
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.glassSurfaceRaised,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: cardBorder,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}>
                  <SymbolView tintColor={theme.glassIcon} name={'chevron.left' as any} size={18} />
                </Pressable>
              </View>

              <View className="rounded-3xl border p-5" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <View className="mb-4 flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: Brand.primary }} />
                  <View className="h-2.5 w-2.5 rounded-full bg-white/25" />
                  <View className="h-2.5 w-2.5 rounded-full bg-white/25" />
                </View>
                <ThemedText className="text-[21px] font-semibold leading-7" style={{ color: heading }}>
                  {pendingEyeLabel}
                </ThemedText>
                <ThemedText className="mt-2 text-[14px] leading-[20px]" style={{ color: bodyMuted }}>
                  {pendingEyeInstruction}
                </ThemedText>
                <View
                  className="mt-3 rounded-2xl border px-4 py-3"
                  style={{ backgroundColor: theme.glassSurfaceRaised, borderColor: cardBorder }}>
                  <ThemedText type="small" className="leading-5" style={{ color: bodyMuted }}>
                    {t('nearVision.readyHint')}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('nearVision.startEyeTestA11y', { label: pendingEyeLabel })}
                  onPress={startPendingEye}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginTop: 10 }]}>
                  <View className="flex-row mt-4 items-center justify-center gap-2 rounded-2xl px-4 py-3.5" style={{ backgroundColor: Brand.primary }}>
                    <SymbolView tintColor="#FFFFFF" name={'play.fill' as any} size={13} />
                    <ThemedText className="text-[15px] font-semibold" style={{ color: '#FFFFFF' }}>
                      {t('nearVision.start')}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
      </TabGlassScreenRoot>
    );
  }

  return (
    <TabGlassScreenRoot>
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[{ flexDirection: 'row', justifyContent: 'center' }, contentPlatformStyle]}>
        <SafeAreaView className="w-full items-center justify-center px-6" style={{ maxWidth: MaxContentWidth }} edges={['left', 'right']}>
          <View className="w-full max-w-[420px] gap-4">
            <View className="flex-row items-center justify-between gap-4">
              <View className="gap-1">
                <ThemedText type="small" className="font-semibold tracking-[1.2px]" style={{ color: labelMuted }}>
                  {t('common.brand')}
                </ThemedText>
                <ThemedText className="text-[30px] font-semibold leading-[38px]" style={{ color: heading }}>
                  {t('nearVision.title')}
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('nearVision.goBackA11y')}
                onPress={() => router.back()}
                style={({ pressed }) => [
                  {
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.glassSurfaceRaised,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: cardBorder,
                    opacity: pressed ? 0.84 : 1,
                  },
                ]}>
                <SymbolView tintColor={theme.glassIcon} name={'chevron.left' as any} size={18} />
              </Pressable>
            </View>

            <View className="gap-2 rounded-3xl border px-5 py-5" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <ThemedText className="text-[18px] font-semibold" style={{ color: heading }}>
                {t('nearVision.beforeStartTitle')}
              </ThemedText>
              <ThemedText className="text-[14px] leading-[20px]" style={{ color: bodyMuted }}>
                {t('nearVision.beforeStartBody', {
                  cm: NEAR_VISION_TARGET_CM,
                  inches: Math.round(NEAR_VISION_TARGET_CM / 2.54),
                })}
              </ThemedText>
            </View>

            {step === 'results' ? (
              <View className="gap-4 rounded-3xl border p-5" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <View className="gap-1">
                  <ThemedText className="text-[24px] font-semibold leading-8" style={{ color: heading }}>
                    {t('nearVision.resultsTitle')}
                  </ThemedText>
                  <ThemedText className="text-[14px] leading-[20px]" style={{ color: bodyMuted }}>
                    {t('nearVision.resultsBody', { cm: NEAR_VISION_TARGET_CM })}
                  </ThemedText>
                </View>

                <View className="overflow-hidden rounded-2xl border" style={{ borderColor: divider }}>
                  <View className="flex-row items-center justify-between px-4 py-4" style={{ backgroundColor: theme.glassSurfaceRaised }}>
                    <ThemedText className="text-[14px] font-semibold" style={{ color: heading }}>
                      {t('nearVision.rightEye')}
                    </ThemedText>
                    <ThemedText className="text-[16px] font-semibold" style={{ color: heading }}>
                      {formatAcuityValue(rightResult, displayFormat)}
                    </ThemedText>
                  </View>
                  <View className="h-px" style={{ backgroundColor: divider }} />
                  <View className="flex-row items-center justify-between px-4 py-4" style={{ backgroundColor: theme.glassSurfaceRaised }}>
                    <ThemedText className="text-[14px] font-semibold" style={{ color: heading }}>
                      {t('nearVision.leftEye')}
                    </ThemedText>
                    <ThemedText className="text-[16px] font-semibold" style={{ color: heading }}>
                      {formatAcuityValue(leftResult, displayFormat)}
                    </ThemedText>
                  </View>
                  <View className="h-px" style={{ backgroundColor: divider }} />
                  <View className="flex-row items-center justify-between px-4 py-4" style={{ backgroundColor: theme.glassSurfaceRaised }}>
                    <ThemedText className="text-[14px] font-semibold" style={{ color: heading }}>
                      {t('nearVision.bothEyes')}
                    </ThemedText>
                    <ThemedText className="text-[16px] font-semibold" style={{ color: heading }}>
                      {formatAcuityValue(bothResult, displayFormat)}
                    </ThemedText>
                  </View>
                </View>

                <View className="gap-3">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('nearVision.runAgainA11y')}
                    onPress={() => setStep('ready')}
                    style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
                    <View className="items-center rounded-2xl px-4 py-4" style={{ backgroundColor: Brand.primary }}>
                      <ThemedText className="text-[15px] font-semibold" style={{ color: '#FFFFFF' }}>
                        {t('nearVision.testAgain')}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('nearVision.doneResultsA11y')}
                    onPress={() => router.back()}
                    style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
                    <View
                      className="items-center rounded-2xl border px-4 py-4"
                      style={{ backgroundColor: theme.glassSurfaceRaised, borderColor: cardBorder }}>
                      <ThemedText className="text-[15px] font-semibold" style={{ color: heading }}>
                        {t('nearVision.done')}
                      </ThemedText>
                    </View>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}
