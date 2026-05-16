import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type DimensionValue } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useNearVisionDisplayFormat } from '@/hooks/use-near-vision-display-format';
import { useNearVisionLastResult } from '@/hooks/use-near-vision-last-result';
import { useTheme } from '@/hooks/use-theme';
import { formatAcuityValue, type NearAcuityResult } from '@/lib/vision/snellen';

type EyeKey = 'both' | 'right' | 'left';

type EyeRow = {
  key: EyeKey;
  label: string;
  result: NearAcuityResult | null;
};

/** Smaller N on chart ≈ sharper near acuity (see `N_TO_SNELLEN` in snellen). */
type AcuityBand = 'good' | 'fair' | 'poor';

function acuityBandFromNSize(nSize: number): AcuityBand {
  if (nSize <= 10) return 'good';
  if (nSize <= 20) return 'fair';
  return 'poor';
}

function accentColorForBand(band: AcuityBand): string {
  switch (band) {
    case 'good':
      return Brand.success;
    case 'fair':
      return Brand.warnAmber;
    case 'poor':
      return Brand.danger;
  }
}

/** Convert a `#RRGGBB` hex into `rgba(r, g, b, a)`. Returns input unchanged for non-hex strings. */
function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function acuityAccentColor(result: NearAcuityResult | null, fallback: string): string {
  if (!result) return fallback;
  return accentColorForBand(acuityBandFromNSize(result.nSize));
}

function SkeletonBlock({
  width,
  height,
  borderRadius = 8,
  color,
}: {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  color: string;
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: color,
      }}
    />
  );
}

function EyeMonogram({
  letter,
  accent,
  hasResult,
  fallback,
}: {
  letter: string;
  accent: string;
  hasResult: boolean;
  fallback: string;
}) {
  const ringColor = hasResult ? withAlpha(accent, 0.32) : fallback;
  const fillColor = hasResult ? withAlpha(accent, 0.14) : 'transparent';
  const textColor = hasResult ? accent : fallback;
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: 26,
        height: 26,
        backgroundColor: fillColor,
        borderWidth: 1,
        borderColor: ringColor,
      }}>
      <ThemedText
        className="text-[11px] font-extrabold"
        style={{ color: textColor, letterSpacing: 0.2 }}>
        {letter}
      </ThemedText>
    </View>
  );
}

type PerEyeRowProps = {
  letter: string;
  title: string;
  result: NearAcuityResult | null;
  valueText: string;
  fallbackColor: string;
  labelMuted: string;
  labelStrong: string;
};

function PerEyeRow({
  letter,
  title,
  result,
  valueText,
  fallbackColor,
  labelMuted,
  labelStrong,
}: PerEyeRowProps) {
  const accent = acuityAccentColor(result, fallbackColor);
  return (
    <View className="flex-row items-center justify-start gap-2.5">
      <EyeMonogram
        letter={letter}
        accent={accent}
        hasResult={result !== null}
        fallback={fallbackColor}
      />
      <View className="min-w-0 items-start">
        <ThemedText
          numberOfLines={1}
          className="text-[10px] font-semibold uppercase tracking-[0.85px]"
          style={{ color: labelMuted }}>
          {title}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          className="text-[20px] font-bold tabular-nums tracking-tight"
          style={{ color: labelStrong }}>
          {valueText}
        </ThemedText>
      </View>
    </View>
  );
}

export function HeroCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { value, loading } = useNearVisionLastResult();
  const { displayFormat } = useNearVisionDisplayFormat();

  const heroSource = useMemo<EyeRow | null>(() => {
    if (value?.both) return { key: 'both', label: t('hero.bothEyesShort'), result: value.both as NearAcuityResult };
    if (value?.right) return { key: 'right', label: t('hero.rightEyeShort'), result: value.right as NearAcuityResult };
    if (value?.left) return { key: 'left', label: t('hero.leftEyeShort'), result: value.left as NearAcuityResult };
    return null;
  }, [value?.both, value?.right, value?.left, t]);

  const hasLatestResult = heroSource !== null;
  const representative = heroSource?.result ?? null;

  const currentAccent = useMemo(
    () =>
      representative
        ? accentColorForBand(acuityBandFromNSize(representative.nSize))
        : Brand.warn,
    [representative],
  );

  const sourceLabel = heroSource
    ? heroSource.key === 'both'
      ? t('hero.bothEyes')
      : heroSource.key === 'right'
        ? t('hero.rightEye')
        : t('hero.leftEye')
    : '';

  return (
    <View className="px-5 py-7">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-row items-center gap-2">
          <SymbolView
            tintColor={theme.glassTextSecondary}
            name={'eye.fill' as any}
            size={14}
          />
          <ThemedText
            numberOfLines={1}
            className="text-[13px] font-semibold"
            style={{ color: theme.glassTextSecondary, letterSpacing: 0.2 }}>
            {t('hero.nearVision')}
          </ThemedText>
        </View>

        {hasLatestResult ? (
          <View
            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: withAlpha(currentAccent, 0.1),
              borderWidth: 1,
              borderColor: withAlpha(currentAccent, 0.24),
            }}>
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: currentAccent }}
            />
            <ThemedText
              numberOfLines={1}
              className="text-[10px] font-bold uppercase tabular-nums tracking-[0.9px]"
              style={{ color: currentAccent }}>
              N{representative?.nSize ?? '—'}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View className="mt-6 flex-row items-stretch">
          <View className="min-w-0 flex-[7] justify-between pr-2">
            <SkeletonBlock width={96} height={11} borderRadius={999} color={theme.glassWell} />
            <View className="mt-3">
              <SkeletonBlock width={162} height={58} borderRadius={14} color={theme.glassWell} />
            </View>
            <View className="mt-3">
              <SkeletonBlock width={64} height={3} borderRadius={999} color={theme.glassWell} />
            </View>
            <View className="mt-3">
              <SkeletonBlock width={82} height={10} borderRadius={999} color={theme.glassWell} />
            </View>
          </View>

          <View className="flex-row items-stretch justify-center gap-3 pl-1 pr-2">
            <View
              className="self-stretch"
              style={{
                width: 1,
                backgroundColor: theme.glassGrid,
              }}
            />
          </View>

          <View className="min-w-0 flex-[4] justify-center gap-5 pl-3">
            <View className="flex-row items-center justify-start gap-2.5">
              <SkeletonBlock width={26} height={26} borderRadius={999} color={theme.glassWell} />
              <View className="items-start gap-1.5">
                <SkeletonBlock width={62} height={9} borderRadius={999} color={theme.glassWell} />
                <SkeletonBlock width={52} height={20} borderRadius={6} color={theme.glassWell} />
              </View>
            </View>
            <View className="flex-row items-center justify-start gap-2.5">
              <SkeletonBlock width={26} height={26} borderRadius={999} color={theme.glassWell} />
              <View className="items-start gap-1.5">
                <SkeletonBlock width={62} height={9} borderRadius={999} color={theme.glassWell} />
                <SkeletonBlock width={52} height={20} borderRadius={6} color={theme.glassWell} />
              </View>
            </View>
          </View>
        </View>
      ) : !hasLatestResult ? (
        <View className="mt-6">
          <ThemedText
            numberOfLines={2}
            className="text-[15px] font-medium leading-6"
            style={{ color: theme.glassTextFaint }}>
            {t('hero.noTestYet')}
          </ThemedText>
          <View
            className="mt-6 flex-row items-center justify-between gap-3 border-t pt-4"
            style={{ borderColor: theme.glassBorderMuted }}>
            <ThemedText
              numberOfLines={1}
              className="min-w-0 flex-1 text-[13px] font-medium"
              style={{ color: theme.glassTextMuted }}>
              {t('hero.takeTest')}
            </ThemedText>
            <SymbolView
              tintColor={theme.glassIconMuted}
              name={'chevron.right' as any}
              size={13}
            />
          </View>
        </View>
      ) : (
        <View className="mt-6 flex-row items-stretch">
          <View className="min-w-0 flex-[6] justify-between pr-2">
            <View className="flex-row items-center gap-1.5">
              <View
                className="rounded-sm"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: currentAccent,
                }}
              />
              <ThemedText
                numberOfLines={1}
                className="text-[10px] font-bold uppercase tracking-[1.35px]"
                style={{ color: currentAccent }}>
                {t('hero.currentResult')}
              </ThemedText>
            </View>

            <ThemedText
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.62}
              className="mt-3 tabular-nums"
              style={{
                color: theme.glassTextPrimary,
                fontSize: 56,
                lineHeight: 58,
                fontWeight: '700',
                letterSpacing: -2.2,
              }}>
              {formatAcuityValue(representative, displayFormat)}
            </ThemedText>

            <LinearGradient
              colors={[currentAccent, withAlpha(currentAccent, 0)]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                marginTop: 10,
                height: 3,
                width: 72,
                borderRadius: 999,
              }}
            />

            <ThemedText
              numberOfLines={1}
              className="mt-3 text-[10px] font-semibold uppercase tracking-[1.1px]"
              style={{ color: theme.glassTextFaint }}>
              {sourceLabel}
            </ThemedText>
          </View>

          <View className="flex-row items-stretch justify-center pl-1 pr-2">
            <LinearGradient
              colors={[
                withAlpha(currentAccent, 0),
                theme.glassGrid,
                theme.glassGrid,
                withAlpha(currentAccent, 0),
              ]}
              locations={[0, 0.18, 0.82, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{ width: 1, alignSelf: 'stretch' }}
            />
          </View>

          <View className="min-w-0 flex-[4] justify-center gap-5 pl-3">
            <PerEyeRow
              letter="R"
              title={t('hero.rightEye')}
              result={value?.right ?? null}
              valueText={formatAcuityValue(value?.right ?? null, displayFormat)}
              fallbackColor={theme.glassTrack}
              labelMuted={theme.glassTextFaint}
              labelStrong={theme.glassTextPrimary}
            />
            <PerEyeRow
              letter="L"
              title={t('hero.leftEye')}
              result={value?.left ?? null}
              valueText={formatAcuityValue(value?.left ?? null, displayFormat)}
              fallbackColor={theme.glassTrack}
              labelMuted={theme.glassTextFaint}
              labelStrong={theme.glassTextPrimary}
            />
          </View>
        </View>
      )}
    </View>
  );
}
