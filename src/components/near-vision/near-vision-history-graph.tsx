import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { NearVisionHistoryEntry } from '@/lib/vision/near-vision-storage';
import { formatAcuityValue, N_TO_SNELLEN, type NearVisionDisplayFormat } from '@/lib/vision/snellen';
import type { NearVisionInsight } from '@/lib/vision/near-vision-results-api';

type NearVisionHistoryGraphProps = {
  history: NearVisionHistoryEntry[];
  isMockData?: boolean;
  insight?: NearVisionInsight | null;
  insightLoading?: boolean;
  loading?: boolean;
  displayFormat?: NearVisionDisplayFormat;
};

type EyeFilter = 'both' | 'right' | 'left';
type ChartEntry = NearVisionHistoryEntry & { nSize: number; approxSnellen: string };
type VisionStatusKey = 'normal' | 'slight' | 'moderate' | 'severe';

const CHART_HEIGHT = 132;
const PADDING_X = 10;
const CARD_HORIZONTAL_PADDING = 24;
const MAX_POINTS_RENDERED = 80;
const CHART_TOP_PADDING = 8;
const CHART_BOTTOM_PADDING = 18;
const Y_TICK_COUNT = 4;

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
}

function downsampleHistory(history: NearVisionHistoryEntry[], maxPoints: number): NearVisionHistoryEntry[] {
  if (history.length <= maxPoints) return history;
  const stride = (history.length - 1) / (maxPoints - 1);
  const sampled: NearVisionHistoryEntry[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round(i * stride);
    sampled.push(history[Math.min(history.length - 1, idx)]);
  }
  return sampled;
}

function nToSnellen(n: number): string {
  const exact = N_TO_SNELLEN[n];
  if (exact) return exact;
  const keys = Object.keys(N_TO_SNELLEN).map(Number);
  if (keys.length === 0) return '—';
  let bestKey = keys[0];
  let bestDiff = Math.abs(n - bestKey);
  for (const k of keys) {
    const d = Math.abs(n - k);
    if (d < bestDiff) {
      bestKey = k;
      bestDiff = d;
    }
  }
  return N_TO_SNELLEN[bestKey] ?? '—';
}

function formatFromNSize(n: number, displayFormat: NearVisionDisplayFormat): string {
  const approxSnellen = nToSnellen(n);
  return formatAcuityValue(
    {
      eye: 'both',
      nSize: n,
      approxSnellen,
    },
    displayFormat
  );
}

function resolveEntryForEye(entry: NearVisionHistoryEntry, eye: EyeFilter): ChartEntry | null {
  const selected = eye === 'both' ? entry.both : eye === 'right' ? entry.right : entry.left;
  if (selected && typeof selected.nSize === 'number' && typeof selected.approxSnellen === 'string') {
    return { ...entry, nSize: selected.nSize, approxSnellen: selected.approxSnellen };
  }
  if (typeof entry.nSize === 'number' && typeof entry.approxSnellen === 'string') {
    // Backward compatibility for legacy history entries without per-eye fields.
    return { ...entry, nSize: entry.nSize, approxSnellen: entry.approxSnellen };
  }
  return null;
}

function buildCurvedPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x} ${points[0].y}`;
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function colorForNSize(nSize: number): string {
  if (nSize <= 6) return Brand.primary;
  if (nSize <= 8) return Brand.info;
  if (nSize <= 12) return Brand.success;
  if (nSize <= 19) return Brand.warnAmber;
  if (nSize <= 24) return Brand.warn;
  return Brand.danger;
}

export function NearVisionHistoryGraph({
  history,
  isMockData = false,
  insight = null,
  insightLoading = false,
  loading = false,
  displayFormat = 'snellen',
}: NearVisionHistoryGraphProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isLight = theme.scheme === 'light';

  const chartGrid = isLight ? 'rgba(51, 65, 85, 0.16)' : 'rgba(148, 163, 184, 0.22)';
  const chartLine = Brand.primary;
  const chartDotMuted = isLight ? 'rgba(15, 23, 42, 0.34)' : 'rgba(191, 219, 254, 0.9)';

  const rangeChipActiveBg = isLight ? 'rgba(30, 136, 255, 0.2)' : 'rgba(30, 136, 255, 0.34)';
  const rangeChipInactiveBg = theme.glassSurfaceRaised;
  const rangeChipActiveText = isLight ? Brand.primaryDark : '#DBEAFE';
  const captionMuted = theme.glassTextMuted;
  const headlineText = theme.glassTextPrimary;
  const eyeFilterBg = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(15, 23, 42, 0.38)';
  const chartPanelBg = isLight ? 'rgba(255, 255, 255, 0.72)' : 'rgba(2, 9, 24, 0.56)';
  const chartPanelBorder = isLight ? 'rgba(148, 163, 184, 0.24)' : 'rgba(148, 163, 184, 0.2)';
  const skeletonColor = isLight ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.20)';

  const [width, setWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [eyeFilter, setEyeFilter] = useState<EyeFilter>('both');
  const chartScrollRef = useRef<ScrollView | null>(null);

  const chartHistory = useMemo(() => {
    const eyeSpecific = history
      .map((entry) => resolveEntryForEye(entry, eyeFilter))
      .filter((entry): entry is ChartEntry => entry != null);
    return downsampleHistory(eyeSpecific, MAX_POINTS_RENDERED);
  }, [eyeFilter, history]);

  useEffect(() => {
    // Always show the latest result when new history arrives.
    setSelectedIdx(null);
  }, [chartHistory.length, chartHistory[chartHistory.length - 1]?.savedAt, eyeFilter]);

  useEffect(() => {
    if (chartHistory.length <= 1) return;
    // Keep viewport pinned to the newest point when data/filter changes.
    requestAnimationFrame(() => {
      chartScrollRef.current?.scrollToEnd({ animated: false });
    });
  }, [chartHistory.length, chartHistory[chartHistory.length - 1]?.savedAt, eyeFilter, width]);

  const viewportWidth = Math.max(80, width - CARD_HORIZONTAL_PADDING);
  const chartWidth = Math.max(viewportWidth, chartHistory.length * 24);

  const yScale = useMemo(() => {
    if (chartHistory.length === 0) return { minN: 5, maxN: 12 };
    const minN = Math.min(5, ...chartHistory.map((h) => h.nSize));
    const maxN = Math.max(12, ...chartHistory.map((h) => h.nSize));
    return { minN, maxN };
  }, [chartHistory]);

  const resolvedSelectedIdx = useMemo(() => {
    if (chartHistory.length === 0) return null;
    if (selectedIdx == null) return chartHistory.length - 1;
    return Math.max(0, Math.min(selectedIdx, chartHistory.length - 1));
  }, [selectedIdx, chartHistory.length]);

  const selectedEntry = resolvedSelectedIdx == null ? null : chartHistory[resolvedSelectedIdx];
  const selectedStatus = useMemo(() => {
    const n = selectedEntry?.nSize;
    if (n == null || n <= 6) return { key: 'normal', color: Brand.success };
    if (n <= 10) return { key: 'slight', color: Brand.warnAmber };
    if (n <= 15) return { key: 'moderate', color: Brand.warn };
    return { key: 'severe', color: Brand.danger };
  }, [selectedEntry?.nSize]) as { key: VisionStatusKey; color: string };
  const goodVisionColor = selectedStatus.color;
  const xSpacing = useMemo(() => {
    if (chartHistory.length <= 1) return Math.max(28, chartWidth - PADDING_X * 2);
    return Math.max(18, (chartWidth - PADDING_X * 2) / (chartHistory.length - 1));
  }, [chartHistory.length, chartWidth]);

  const ySpan = Math.max(1, yScale.maxN - yScale.minN);
  const innerHeight = Math.max(1, CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING);
  const yTicks = useMemo(
    () =>
      Array.from({ length: Y_TICK_COUNT }, (_, idx) => {
        const ratio = idx / Math.max(1, Y_TICK_COUNT - 1);
        const n = yScale.minN + ratio * ySpan;
        const y = CHART_TOP_PADDING + ratio * innerHeight;
        return {
          y,
          label: formatFromNSize(Math.round(n), displayFormat),
        };
      }),
    [displayFormat, innerHeight, yScale.minN, ySpan]
  );
  const points = useMemo(
    () =>
      chartHistory.map((entry, idx) => {
        const x = PADDING_X + idx * xSpacing;
        const yRatio = (entry.nSize - yScale.minN) / ySpan;
        const y = CHART_TOP_PADDING + yRatio * innerHeight;
        return { x, y };
      }),
    [chartHistory, innerHeight, xSpacing, yScale.minN, ySpan]
  );
  const selectedPoint = resolvedSelectedIdx == null ? null : points[resolvedSelectedIdx];
  const selectedPointColor = selectedEntry ? colorForNSize(selectedEntry.nSize) : chartLine;

  const linePath = useMemo(() => {
    return buildCurvedPath(points);
  }, [points]);
  const lineGradientStops = useMemo(() => {
    if (chartHistory.length === 0 || points.length === 0 || chartWidth <= 0) return [];
    return chartHistory.map((entry, idx) => {
      const x = points[idx]?.x ?? 0;
      const offset = Math.max(0, Math.min(100, (x / chartWidth) * 100));
      return {
        key: `line-stop-${idx}`,
        offset: `${offset}%`,
        color: colorForNSize(entry.nSize),
      };
    });
  }, [chartHistory, chartWidth, points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baseY = CHART_HEIGHT - CHART_BOTTOM_PADDING;
    return `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }, [linePath, points]);

  const handleChartTouch = (locationX: number) => {
    if (points.length === 0) return;
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < points.length; i += 1) {
      const d = Math.abs(locationX - points[i].x);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    setSelectedIdx(bestIdx);
  };

  if (loading) {
    return (
      <View className="gap-3">
        <View
          className="flex-row items-center gap-2 rounded-full border p-1"
          style={{ borderColor: theme.glassBorder }}>
          {[0, 1, 2].map((idx) => (
            <View
              key={`skeleton-chip-${idx}`}
              className="flex-1 rounded-full"
              style={{ height: 34, backgroundColor: skeletonColor }}
            />
          ))}
        </View>

        <View className="rounded-[20px] px-3 py-3">
          <View className="mb-3 gap-2">
            <View style={{ width: 96, height: 10, borderRadius: 999, backgroundColor: skeletonColor }} />
            <View style={{ width: 140, height: 42, borderRadius: 12, backgroundColor: skeletonColor }} />
            <View style={{ width: 120, height: 12, borderRadius: 999, backgroundColor: skeletonColor }} />
          </View>
          <View
            className="rounded-[14px] border"
            style={{ height: CHART_HEIGHT + 24, borderColor: chartPanelBorder, backgroundColor: chartPanelBg }}
          />
        </View>

        <View
          className="flex-row items-start gap-2 rounded-[14px] border px-3.5 py-3"
          style={{
            backgroundColor: theme.glassSurface,
            borderColor: theme.glassBorderMuted,
          }}>
          <View
            className="h-8 w-8 rounded-full"
            style={{ backgroundColor: skeletonColor }}
          />
          <View className="min-w-0 flex-1 gap-2">
            <View style={{ width: '75%', height: 14, borderRadius: 999, backgroundColor: skeletonColor }} />
            <View style={{ width: '95%', height: 13, borderRadius: 999, backgroundColor: skeletonColor }} />
          </View>
        </View>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View className="rounded-[18px] px-4 py-4" style={{ backgroundColor: theme.glassSurface }}>
        <ThemedText className="text-[13px] leading-5" style={{ color: captionMuted }}>
          {t('scan.noHistory' as any)}
        </ThemedText>
      </View>
    );
  }

  if (chartHistory.length === 0) {
    return (
      <View className="rounded-[18px] px-4 py-4" style={{ backgroundColor: theme.glassSurface }}>
        <ThemedText className="text-[13px] leading-5" style={{ color: captionMuted }}>
          {t('scan.noEyeHistory' as any, {
            eye: eyeFilter === 'right' ? t('nearVision.rightEye') : t('nearVision.leftEye'),
          })}
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View
        className="flex-row items-center gap-2 rounded-full border p-1"
        style={{ borderColor: theme.glassBorder }}
      >
        {(
          [
            ['both', t('nearVision.bothEyes')],
            ['right', t('nearVision.rightEye')],
            ['left', t('nearVision.leftEye')],
          ] as const
        ).map(([key, label]) => {
          const active = key === eyeFilter;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={t('scan.filterByEyeA11y' as any, { eye: label })}
              onPress={() => {
                setEyeFilter(key);
                setSelectedIdx(null);
              }}
              className="min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-3 py-2"
              style={{ backgroundColor: active ? rangeChipActiveBg : 'transparent' }}>
              <SymbolView
                tintColor={active ? rangeChipActiveText : theme.glassTextSecondary}
                name={'eye.fill' as any}
                size={13}
              />
              <ThemedText
                className="text-[13px] font-semibold"
                style={{ color: active ? rangeChipActiveText : theme.glassTextSecondary }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View
        onLayout={(e) => setWidth(Math.max(0, e.nativeEvent.layout.width))}
        className="rounded-[20px] px-3 py-3"
      // style={{ backgroundColor: chartPanelBg }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <ThemedText className="text-[11px] font-semibold tracking-[1px]" style={{ color: captionMuted }}>
              {t('scan.currentVision' as any)}
            </ThemedText>
            <View className="mt-0.5 flex-row items-end gap-1.5">
              <ThemedText className="text-[40px] font-bold leading-[42px]" style={{ color: headlineText }}>
                {selectedEntry
                  ? formatAcuityValue(
                    {
                      eye: 'both',
                      nSize: selectedEntry.nSize,
                      approxSnellen: selectedEntry.approxSnellen,
                    },
                    displayFormat
                  )
                  : '—'}
              </ThemedText>
              <ThemedText className="pb-1 text-[16px] font-semibold" style={{ color: chartLine }}>
                {selectedEntry ? `N${selectedEntry.nSize}` : ''}
              </ThemedText>
            </View>
            <View className="mt-1 flex-row items-center gap-1.5">
              <SymbolView tintColor={goodVisionColor} name={'checkmark.circle.fill' as any} size={14} />
              <ThemedText className="text-[13px] font-semibold" style={{ color: goodVisionColor }}>
                {t(
                  ({
                    normal: 'scan.visionStatus.normal',
                    slight: 'scan.visionStatus.slight',
                    moderate: 'scan.visionStatus.moderate',
                    severe: 'scan.visionStatus.severe',
                  } as const)[selectedStatus.key]
                )}
              </ThemedText>
            </View>
          </View>
          {/* <View className="rounded-full px-3 py-2" style={{ backgroundColor: rangeChipActiveBg }}>
            <ThemedText className="text-[12px] font-semibold" style={{ color: rangeChipActiveText }}>
              {eyeFilter === 'both' ? 'Both eyes' : eyeFilter === 'right' ? 'Right eye' : 'Left eye'}
            </ThemedText>
          </View> */}
        </View>

        {width > 0 ? (
          <View>
            <View className="flex-row gap-2">
              <View className="h-[132px] justify-between pb-5 pt-1">
                {yTicks.map((tick, idx) => (
                  <ThemedText key={`yt-${idx}`} className="text-[10px] font-semibold" style={{ color: captionMuted }}>
                    {tick.label}
                  </ThemedText>
                ))}
              </View>

              <ScrollView
                ref={chartScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}>
                <View style={{ width: chartWidth }}>
                  <View
                    style={{ width: chartWidth, height: CHART_HEIGHT }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) => handleChartTouch(e.nativeEvent.locationX)}
                    onResponderMove={(e) => handleChartTouch(e.nativeEvent.locationX)}>
                    <Svg width={chartWidth} height={CHART_HEIGHT}>
                      <Defs>
                        <LinearGradient id="nearVisionFill" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0%" stopColor={chartLine} stopOpacity={0.3} />
                          <Stop offset="100%" stopColor={chartLine} stopOpacity={0.05} />
                        </LinearGradient>
                        <LinearGradient id="nearVisionLine" x1="0" y1="0" x2={String(chartWidth)} y2="0" gradientUnits="userSpaceOnUse">
                          {lineGradientStops.map((stop) => (
                            <Stop key={stop.key} offset={stop.offset} stopColor={stop.color} />
                          ))}
                        </LinearGradient>
                      </Defs>

                      {yTicks.map((tick, idx) => (
                        <Line
                          key={`grid-${idx}`}
                          x1={0}
                          y1={tick.y}
                          x2={chartWidth}
                          y2={tick.y}
                          stroke={chartGrid}
                          strokeDasharray={idx === yTicks.length - 1 ? undefined : '3 4'}
                        />
                      ))}

                      {areaPath ? <Path d={areaPath} fill="url(#nearVisionFill)" /> : null}
                      {linePath ? <Path d={linePath} stroke="url(#nearVisionLine)" strokeWidth={1.6} fill="none" /> : null}

                      {selectedPoint && selectedEntry ? (
                        <>
                          <Line
                            x1={selectedPoint.x}
                            y1={CHART_TOP_PADDING}
                            x2={selectedPoint.x}
                            y2={CHART_HEIGHT - CHART_BOTTOM_PADDING}
                            stroke={selectedPointColor}
                            strokeWidth={1.5}
                            strokeDasharray="4 5"
                          />
                        </>
                      ) : null}

                      {points.map((p, idx) => {
                        const isSelected = idx === resolvedSelectedIdx;
                        const isLatest = idx === points.length - 1;
                        const isEmphasis = isSelected || isLatest;
                        const pointColor = colorForNSize(chartHistory[idx].nSize);
                        const radius = isSelected ? 5 : isLatest ? 4.5 : 3;
                        const color = isEmphasis ? pointColor : chartDotMuted;
                        return (
                          <React.Fragment key={`dot-${idx}`}>
                            {isEmphasis ? (
                              <Circle
                                cx={p.x}
                                cy={p.y}
                                r={isSelected ? 10 : 8}
                                fill={pointColor}
                                opacity={isSelected ? 0.2 : 0.14}
                              />
                            ) : null}
                            {isEmphasis ? (
                              <Circle
                                cx={p.x}
                                cy={p.y}
                                r={isSelected ? 6.4 : 5.2}
                                fill={theme.glassSurface}
                                opacity={0.95}
                              />
                            ) : null}
                            <Circle cx={p.x} cy={p.y} r={radius} fill={color} />
                          </React.Fragment>
                        );
                      })}
                    </Svg>
                  </View>
                  <View
                    className="absolute"
                    style={{
                      width: chartWidth,
                      top: CHART_HEIGHT - CHART_BOTTOM_PADDING + 2,
                      height: 14,
                    }}>
                    {(() => {
                      let previousLabel = '';
                      return chartHistory.map((entry, idx) => {
                        const label = formatDateLabel(entry.savedAt);
                        if (label === previousLabel) return null;
                        previousLabel = label;
                        const x = points[idx]?.x ?? PADDING_X;
                        return (
                          <View
                            key={`x-label-${entry.savedAt}-${idx}`}
                            className="absolute -ml-4 w-8 items-center"
                            style={{ left: x }}>
                            <ThemedText className="text-[9px] font-semibold" style={{ color: captionMuted }}>
                              {label}
                            </ThemedText>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={{ height: CHART_HEIGHT }} />
        )}
      </View>

      <View
        className="flex-row items-start gap-2 rounded-[14px] border px-3.5 py-3"
        style={{
          backgroundColor: theme.glassSurface,
          borderColor: theme.glassBorderMuted,
        }}>
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.glassSurfaceRaised }}>
          <SymbolView tintColor={theme.glassTextSecondary} name={'chart.xyaxis.line' as any} size={14} />
        </View>
        <View className="min-w-0 flex-1">
          <ThemedText className="text-[15px] font-semibold leading-5" style={{ color: headlineText }}>
            {insight?.title?.trim() ? insight.title : t('scan.insightTitle' as any)}
          </ThemedText>
          <ThemedText className="mt-0.5 text-[13px] leading-[18px]" style={{ color: captionMuted }}>
            {insightLoading
              ? t('scan.insightLoading')
              : insight?.body?.trim()
                ? insight.body
                : t('scan.insightBody' as any)}
            {chartWidth > viewportWidth ? ` ${t('scan.swipeMoreDates' as any)}` : ''}
            {isMockData ? ` ${t('scan.sampleData' as any)}` : ''}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
