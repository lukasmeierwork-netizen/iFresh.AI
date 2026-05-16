import { N_TO_SNELLEN } from '@/lib/vision/snellen';

const MM_PER_INCH = 25.4;
const IOS_POINT_BASELINE_PPI = 160;

/** First-run ruler target length shown in calibration UI. */
export const RULER_REFERENCE_MM = 20;

/** Landolt C total optotype height is 5x the stroke/gap width. */
const LANDOLT_TOTAL_TO_GAP_RATIO = 5;

/** RN's point baseline (160) provides a practical PPI estimate before user correction. */
export function estimatePpiFromPixelRatio(pixelRatio: number): number {
  return Math.max(120, Math.min(720, pixelRatio * IOS_POINT_BASELINE_PPI));
}

export function ppiToPixelsPerMm(ppi: number): number {
  return ppi / MM_PER_INCH;
}

export function mmToPixels(mm: number, pixelsPerMm: number, correctionScale = 1): number {
  return mm * pixelsPerMm * correctionScale;
}

export function pixelsToMm(px: number, pixelsPerMm: number, correctionScale = 1): number {
  const denom = pixelsPerMm * correctionScale;
  if (denom <= 0) return 0;
  return px / denom;
}

function arcMinutesToRadians(arcMinutes: number): number {
  return (arcMinutes / 60) * (Math.PI / 180);
}

/** Convert visual angle to physical size at a given distance. */
export function arcMinutesToMm(arcMinutes: number, distanceCm: number): number {
  const distanceMm = distanceCm * 10;
  const theta = arcMinutesToRadians(arcMinutes);
  return 2 * distanceMm * Math.tan(theta / 2);
}

function parseSnellenDenominator(snellen: string): number | null {
  const m = snellen.match(/^\s*\d+\s*\/\s*(\d+)\s*$/);
  if (!m) return null;
  const value = Number(m[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Returns Landolt total diameter + gap width in mm for the target N line.
 * Uses Snellen equivalence where full optotype subtends 5 * MAR.
 */
export function landoltGeometryMmForN(nSize: number, distanceCm: number): {
  totalDiameterMm: number;
  gapWidthMm: number;
} {
  const snellen = N_TO_SNELLEN[nSize];
  const denominator = parseSnellenDenominator(snellen ?? '');
  const optotypeArcMin = denominator != null ? denominator / 4 : 10;
  const totalDiameterMm = arcMinutesToMm(optotypeArcMin, distanceCm);
  return {
    totalDiameterMm,
    gapWidthMm: totalDiameterMm / LANDOLT_TOTAL_TO_GAP_RATIO,
  };
}

/** Calibrated diameter in px (no ladder / screen clamps). */
export function landoltDiameterPxForN(
  nSize: number,
  distanceCm: number,
  pixelsPerMm: number,
  correctionScale = 1,
): number {
  const { totalDiameterMm } = landoltGeometryMmForN(nSize, distanceCm);
  return mmToPixels(totalDiameterMm, pixelsPerMm, correctionScale);
}

export type UniformLadderUiScaleOptions = {
  /** Largest row may occupy at most this fraction of the shorter window side. */
  maxDiameterFraction?: number;
};

/**
 * Uniform scale for the entire acuity ladder so row-to-row angular ratios are preserved on screen.
 * Avoids applying `min(rowPx, viewportCap)` per row, which makes many difficulty levels visually identical.
 */
export function uniformLandoltLadderScale(
  calibratedDiametersPx: number[],
  minWindowDimension: number,
  options?: UniformLadderUiScaleOptions,
): number {
  if (calibratedDiametersPx.length === 0 || minWindowDimension <= 0) return 1;
  let maxRaw = 0;
  for (const px of calibratedDiametersPx) {
    if (Number.isFinite(px) && px > 0) {
      maxRaw = Math.max(maxRaw, px);
    }
  }
  if (maxRaw <= 0) return 1;

  const maxFrac = options?.maxDiameterFraction ?? 0.42;
  const maxFitPx = Math.max(minWindowDimension * maxFrac, 48);

  /**
   * Shrink uniformly so the easiest (largest calibrated) row fits the window.
   * Cap at scale 1 (do not enlarge past ruler/PPI-adjusted calibrated mm → px mapping).
   */
  const viewportScale = maxFitPx / maxRaw;
  return Math.min(1, Math.max(Number.EPSILON, viewportScale));
}
