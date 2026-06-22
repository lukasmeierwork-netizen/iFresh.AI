import {
  getFocusRangeBandEnter,
  getFocusRangeBandLeave,
  isWithinDisplayedFocusRange,
  NEAR_VISION_TARGET_CM,
} from '@/lib/vision/near-vision-config';

export type SightDistanceStatus = 'shortSighted' | 'longSighted' | 'normal';

/** Rolling window for median / outlier rejection. */
const SAMPLE_WINDOW = 14;
/** Ignore a frame if it jumps more than this from the recent median (hand on face). */
const MAX_SAMPLE_JUMP_CM = 11;
/** Jump limit while patching — reject spikes but allow gradual real movement. */
const PATCH_MAX_SAMPLE_JUMP_CM = 6;
/** Slightly wider window while patching. */
const PATCH_SAMPLE_WINDOW = 14;
/** Consecutive drift frames before re-basing the median window. */
const DRIFT_STREAK_TO_REBASE = 3;
/** EMA weight while distance is drifting but not yet re-based. */
const DRIFT_EMA_ALPHA = 0.45;
export const MIN_PLAUSIBLE_DISTANCE_CM = 28;
export const MAX_PLAUSIBLE_DISTANCE_CM = 88;
/** Minimum stabilized samples across a full test before classifying sight distance. */
export const MIN_SESSION_SAMPLES_FOR_SIGHT_CLASSIFICATION = 5;
/** EMA weight — lower = smoother distance readout during patching. */
const EMA_ALPHA = 0.2;
/** Brief face dropout: keep range + stabilized distance (ms). */
export const FACE_LOST_HOLD_MS = 750;
/** Small buffer so stabilized range does not flicker at the leave-band edge. */
const LEAVE_BAND_EXIT_BUFFER_CM = 2;

export type NearVisionDistanceState = {
  samples: number[];
  emaCm: number | null;
  /** Hysteresis: stays true until clearly outside leave band. */
  inRange: boolean;
  lastGoodSampleMs: number | null;
  outlierStreak: number;
};

export type IngestNearVisionDistanceOptions = {
  handPatchActive?: boolean;
};

export function createNearVisionDistanceState(): NearVisionDistanceState {
  return {
    samples: [],
    emaCm: null,
    inRange: false,
    lastGoodSampleMs: null,
    outlierStreak: 0,
  };
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isWithinLeaveBandWithBuffer(
  distanceCm: number,
  bufferCm: number,
): boolean {
  const { minCm, maxCm } = getFocusRangeBandLeave();
  return (
    distanceCm >= minCm - bufferCm && distanceCm <= maxCm + bufferCm
  );
}

function applyHysteresis(prevInRange: boolean, stabilizedCm: number | null): boolean {
  if (stabilizedCm == null) return false;
  if (!prevInRange) {
    return isWithinDisplayedFocusRange(stabilizedCm);
  }
  return isWithinLeaveBandWithBuffer(
    stabilizedCm,
    LEAVE_BAND_EXIT_BUFFER_CM,
  );
}

function ingestGoodSample(
  prev: NearVisionDistanceState,
  raw: number,
  timestampMs: number,
  options?: IngestNearVisionDistanceOptions,
): { next: NearVisionDistanceState; stabilizedCm: number } {
  const handPatchActive = options?.handPatchActive ?? false;
  const maxJumpCm = handPatchActive ? PATCH_MAX_SAMPLE_JUMP_CM : MAX_SAMPLE_JUMP_CM;
  const sampleWindow = handPatchActive ? PATCH_SAMPLE_WINDOW : SAMPLE_WINDOW;

  let samples = prev.samples;
  let outlierStreak = prev.outlierStreak;
  const recentMedian = median(samples);

  const plausible =
    raw >= MIN_PLAUSIBLE_DISTANCE_CM && raw <= MAX_PLAUSIBLE_DISTANCE_CM;
  const isOutlier =
    plausible &&
    recentMedian != null &&
    Math.abs(raw - recentMedian) > maxJumpCm;

  if (!plausible) {
    outlierStreak = 0;
  } else if (isOutlier) {
    outlierStreak += 1;
    if (!handPatchActive && outlierStreak >= DRIFT_STREAK_TO_REBASE) {
      samples = [raw];
      outlierStreak = 0;
    }
  } else {
    samples =
      samples.length >= sampleWindow
        ? [...samples.slice(samples.length - sampleWindow + 1), raw]
        : [...samples, raw];
    outlierStreak = 0;
  }

  const med = median(samples);
  const blendSource = med ?? raw;
  const alpha =
    isOutlier && outlierStreak > 0 && outlierStreak < DRIFT_STREAK_TO_REBASE
      ? DRIFT_EMA_ALPHA
      : EMA_ALPHA;
  const emaCm =
    prev.emaCm == null
      ? blendSource
      : prev.emaCm + alpha * (blendSource - prev.emaCm);

  const stabilizedCm = (() => {
    if (isOutlier && outlierStreak > 0 && outlierStreak < DRIFT_STREAK_TO_REBASE) {
      return prev.emaCm == null ? raw : prev.emaCm + DRIFT_EMA_ALPHA * (raw - prev.emaCm);
    }
    if (med == null) return emaCm;
    return emaCm * 0.55 + med * 0.45;
  })();

  const inRange = applyHysteresis(prev.inRange, stabilizedCm);

  return {
    stabilizedCm,
    next: {
      samples,
      emaCm: stabilizedCm,
      inRange,
      lastGoodSampleMs: timestampMs,
      outlierStreak,
    },
  };
}

/**
 * Ingest one raw face-width distance sample. Returns stabilized cm and hysteresis in-range.
 */
export function ingestNearVisionDistance(
  prev: NearVisionDistanceState,
  rawDistanceCm: number | null,
  timestampMs: number,
  options?: IngestNearVisionDistanceOptions,
): {
  next: NearVisionDistanceState;
  stabilizedCm: number | null;
  inRange: boolean;
} {
  if (rawDistanceCm == null || !Number.isFinite(rawDistanceCm)) {
    const held =
      prev.lastGoodSampleMs != null &&
      timestampMs - prev.lastGoodSampleMs <= FACE_LOST_HOLD_MS;

    if (held && prev.emaCm != null) {
      const inRange = applyHysteresis(prev.inRange, prev.emaCm);
      return {
        next: { ...prev, inRange },
        stabilizedCm: prev.emaCm,
        inRange,
      };
    }

    return {
      next: createNearVisionDistanceState(),
      stabilizedCm: null,
      inRange: false,
    };
  }

  const { stabilizedCm, next } = ingestGoodSample(
    prev,
    rawDistanceCm,
    timestampMs,
    options,
  );
  return { next, stabilizedCm, inRange: next.inRange };
}

/**
 * Optotype scale vs nominal target (legacy helper — prefer chart distance in landoltDiameterPxForN).
 */
export function nearVisionDistanceScaleFactor(
  stabilizedDistanceCm: number | null,
  inRange: boolean,
): number {
  if (!inRange || stabilizedDistanceCm == null) return 1;
  const ratio = stabilizedDistanceCm / NEAR_VISION_TARGET_CM;
  return clamp(ratio, 0.88, 1.15);
}

/** Distance used for Landolt geometry during an active in-range test. */
export function nearVisionChartDistanceCm(
  stabilizedDistanceCm: number | null,
  inRange: boolean,
): number {
  if (inRange && stabilizedDistanceCm != null) {
    return clamp(
      stabilizedDistanceCm,
      NEAR_VISION_TARGET_CM * 0.88,
      NEAR_VISION_TARGET_CM * 1.15,
    );
  }
  return NEAR_VISION_TARGET_CM;
}

export function isPlausibleNearVisionDistanceCm(distanceCm: number): boolean {
  return (
    Number.isFinite(distanceCm) &&
    distanceCm >= MIN_PLAUSIBLE_DISTANCE_CM &&
    distanceCm <= MAX_PLAUSIBLE_DISTANCE_CM
  );
}

/** Mean viewing distance across an entire near-vision session (all eyes). */
export function averageDistanceFromSessionSamples(samples: number[]): number | null {
  if (samples.length < MIN_SESSION_SAMPLES_FOR_SIGHT_CLASSIFICATION) return null;
  const sum = samples.reduce((acc, value) => acc + value, 0);
  return sum / samples.length;
}

/**
 * Classify how the user held the phone vs the nominal focus band.
 * Farther than normal → long sighted; closer → short sighted; within band → normal.
 */
export function classifySightFromAverageDistance(
  averageDistanceCm: number,
): SightDistanceStatus {
  const { minCm, maxCm } = getFocusRangeBandEnter();
  if (averageDistanceCm > maxCm) return 'longSighted';
  if (averageDistanceCm < minCm) return 'shortSighted';
  return 'normal';
}

export function computeSessionSightMetrics(samples: number[]): {
  averageDistanceCm: number | null;
  sightDistanceStatus: SightDistanceStatus | null;
} {
  const averageDistanceCm = averageDistanceFromSessionSamples(samples);
  if (averageDistanceCm == null) {
    return { averageDistanceCm: null, sightDistanceStatus: null };
  }
  return {
    averageDistanceCm,
    sightDistanceStatus: classifySightFromAverageDistance(averageDistanceCm),
  };
}
