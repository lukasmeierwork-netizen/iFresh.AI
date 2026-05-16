import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientButton } from '@/components/ui/gradient-button';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isVisionCameraAvailable } from '@/lib/usage/vision-camera-availability';
import type { OnboardingDraft } from '@/lib/onboarding/types';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
  onGranted: () => void;
};

type VisionCameraModule = {
  Camera: {
    requestCameraPermission: () => Promise<'granted' | 'denied' | 'restricted' | 'not-determined'>;
  };
};

function FocusFrame({ children, color }: { children: React.ReactNode; color: string }) {
  const len = 22;
  const thick = 3;
  const corner = (position: 'tl' | 'tr' | 'bl' | 'br') => {
    const base = { position: 'absolute' as const, backgroundColor: color };
    switch (position) {
      case 'tl':
        return (
          <>
            <View style={[base, { top: 0, left: 0, width: len, height: thick }]} />
            <View style={[base, { top: 0, left: 0, width: thick, height: len }]} />
          </>
        );
      case 'tr':
        return (
          <>
            <View style={[base, { top: 0, right: 0, width: len, height: thick }]} />
            <View style={[base, { top: 0, right: 0, width: thick, height: len }]} />
          </>
        );
      case 'bl':
        return (
          <>
            <View style={[base, { bottom: 0, left: 0, width: len, height: thick }]} />
            <View style={[base, { bottom: 0, left: 0, width: thick, height: len }]} />
          </>
        );
      case 'br':
        return (
          <>
            <View style={[base, { bottom: 0, right: 0, width: len, height: thick }]} />
            <View style={[base, { bottom: 0, right: 0, width: thick, height: len }]} />
          </>
        );
    }
  };

  return (
    <View
      style={{
        width: 118,
        height: 86,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {corner('tl')}
      {corner('tr')}
      {corner('bl')}
      {corner('br')}
      {children}
    </View>
  );
}

function HeroMetric({
  icon,
  label,
  dotBg,
  iconTint,
}: {
  icon: string;
  label: string;
  dotBg: string;
  iconTint: string;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 6, maxWidth: 76 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: dotBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(30, 136, 255, 0.22)',
          ...Shadows.assistantBubble,
        }}>
        <SymbolView tintColor={iconTint} name={icon as any} size={20} weight="semibold" />
      </View>
      <ThemedText
        themeColor="textSecondary"
        className="text-[10px] font-semibold leading-3 text-center uppercase tracking-wide">
        {label}
      </ThemedText>
    </View>
  );
}

/**
 * Native camera permission step. Triggers the VisionCamera permission prompt
 * on press and records the result on the draft. OS-level permission state is
 * persistent (by iOS/Android design) — only the onboarding draft is reset on
 * unmount.
 *
 * Vision Camera throws synchronously at module-load when its native pod is
 * missing (e.g. running in Expo Go). We lazy-require inside the handler and
 * guard with `isVisionCameraAvailable()` so this screen still renders — we
 * simply treat the tap as a "granted" user intent and advance.
 */
export function StepCameraPermission({ setAnswer, onGranted }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleAllow = useCallback(async () => {
    if (!isVisionCameraAvailable()) {
      setAnswer({ cameraPermissionGranted: true });
      onGranted();
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('react-native-vision-camera') as VisionCameraModule;
      const status = await mod.Camera.requestCameraPermission();
      setAnswer({ cameraPermissionGranted: status === 'granted' });
    } catch {
      setAnswer({ cameraPermissionGranted: false });
    } finally {
      onGranted();
    }
  }, [onGranted, setAnswer]);

  const privacyRows = useMemo(
    () => [
      {
        title: t('onboarding.cameraPrivacyPrivateTitle'),
        body: t('onboarding.cameraPrivacyPrivateBody'),
      },
      {
        title: t('onboarding.cameraPrivacyOnDeviceTitle'),
        body: t('onboarding.cameraPrivacyOnDeviceBody'),
      },
      {
        title: t('onboarding.cameraPrivacyNeverUploadedTitle'),
        body: t('onboarding.cameraPrivacyNeverUploadedBody'),
      },
    ],
    [t]
  );

  const isLight = theme.scheme === 'light';
  const heroColors = isLight
    ? (['#D6EBFF', '#EEF6FF', '#F9FCFF'] as const)
    : (['rgba(30, 136, 255, 0.28)', 'rgba(15, 23, 42, 0.92)', 'rgba(0, 0, 0, 0.35)'] as const);
  const metricDotBg = isLight ? '#FFFFFF' : 'rgba(255,255,255,0.14)';
  const metricIconTint = isLight ? Brand.primary : '#93C5FD';
  const eyeAccent = isLight ? Brand.primary : '#FFFFFF';
  const cameraBadgeBg = isLight ? '#FFFFFF' : 'rgba(255,255,255,0.12)';
  const privacyCardBg = isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.06)';
  const privacyBorder = isLight ? '#E5E7EB' : theme.backgroundSelected;

  return (
    <View style={{ gap: 22 }}>
      <View
        style={[
          {
            height: 292,
            borderRadius: 24,
            overflow: 'hidden',
          },
          Shadows.assistantBubble,
        ]}>
        <LinearGradient
          colors={[...heroColors] as [string, string, ...string[]]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ flex: 1 }}>
          <View style={{ position: 'absolute', left: 14, top: 72 }}>
            <HeroMetric
              icon="ruler.fill"
              label={t('onboarding.cameraMetricDistance')}
              dotBg={metricDotBg}
              iconTint={metricIconTint}
            />
          </View>
          <View style={{ position: 'absolute', right: 18, top: 36 }}>
            <HeroMetric
              icon="eye"
              label={t('onboarding.cameraMetricMovement')}
              dotBg={metricDotBg}
              iconTint={metricIconTint}
            />
          </View>
          <View style={{ position: 'absolute', right: 22, bottom: 52 }}>
            <HeroMetric
              icon="eye.slash"
              label={t('onboarding.cameraMetricBlinking')}
              dotBg={metricDotBg}
              iconTint={metricIconTint}
            />
          </View>

          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 48, top: 28, opacity: isLight ? 0.45 : 0.35 }}>
            <SymbolView tintColor={Brand.primary} name={'sparkles' as any} size={14} weight="semibold" />
          </View>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', right: 100, bottom: 100, opacity: isLight ? 0.35 : 0.28 }}>
            <SymbolView tintColor={Brand.primary} name={'sparkles' as any} size={12} weight="semibold" />
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
            <FocusFrame color={eyeAccent}>
              <SymbolView tintColor={eyeAccent} name={'eye' as any} size={38} weight="semibold" />
            </FocusFrame>
            <View
              style={{
                marginTop: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: cameraBadgeBg,
                borderWidth: 1,
                borderColor: isLight ? 'rgba(30, 136, 255, 0.18)' : 'rgba(255,255,255,0.12)',
              }}>
              <SymbolView tintColor={Brand.primary} name={'camera.fill' as any} size={30} weight="semibold" />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">{t('onboarding.cameraHeadline')}</ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.cameraSubhead')}
        </ThemedText>
      </View>

      <View
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: privacyBorder,
          backgroundColor: privacyCardBg,
          overflow: 'hidden',
          ...Shadows.assistantBubble,
        }}>
        {privacyRows.map((row, index) => (
          <View key={row.title}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16, paddingHorizontal: 16 }}>
              <SymbolView
                tintColor={Brand.success}
                name={'checkmark.shield.fill' as any}
                size={26}
                weight="semibold"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText className="text-[15px] font-semibold leading-5">{row.title}</ThemedText>
                <ThemedText themeColor="textSecondary" className="text-[13px] leading-5">
                  {row.body}
                </ThemedText>
              </View>
            </View>
            {index < privacyRows.length - 1 ? (
              <View style={{ height: 1, marginLeft: 56, backgroundColor: privacyBorder }} />
            ) : null}
          </View>
        ))}
      </View>

      <GradientButton
        label={t('onboarding.allowCamera')}
        colors={[Brand.primary, Brand.primaryDark]}
        onPress={handleAllow}
        radius={18}
        leading={
          <SymbolView tintColor="#FFFFFF" name={'camera.fill' as any} size={20} weight="semibold" />
        }
      />
    </View>
  );
}
