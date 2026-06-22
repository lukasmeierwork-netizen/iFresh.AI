/**
 * Rolling-median smoother for distance samples.
 *
 * Face-width-based distance estimates jitter by ~1-3 cm frame to frame.
 * A median over the last N samples suppresses that noise without adding
 * latency to real movements. The window is small on purpose (~0.5 s at
 * 12 fps) so the indicator still feels responsive.
 *
 * While one eye is hand-patched, the face bounding box width becomes
 * unreliable. Patch mode tightens jump limits and never re-bases on spikes.
 */

const WINDOW = 10;
/** Slightly wider window while patching to damp hand noise without freezing. */
const PATCH_WINDOW = 12;
/** Ignore single-frame face-box spikes before they reach the usage store. */
const MAX_FRAME_JUMP_CM = 12;
/** Jump limit while patching — tight enough to reject spikes, loose enough to track movement. */
const PATCH_MAX_FRAME_JUMP_CM = 6;
/** Partial blend toward outlier samples during patching (keeps the readout moving). */
const PATCH_OUTLIER_BLEND = 0.22;
/** Consecutive outlier frames before treating the shift as real movement. */
const OUTLIER_STREAK_TO_REBASE = 3;

export type DistanceSmootherState = {
  samples: number[];
  outlierStreak: number;
};

export type IngestDistanceSampleOptions = {
  handPatchActive?: boolean;
};

function medianOf(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function createDistanceSmootherState(): DistanceSmootherState {
  return { samples: [], outlierStreak: 0 };
}

export function ingestDistanceSample(
  prev: DistanceSmootherState,
  distanceCm: number,
  options?: IngestDistanceSampleOptions,
): { next: DistanceSmootherState; medianCm: number } {
  const handPatchActive = options?.handPatchActive ?? false;
  const maxJumpCm = handPatchActive ? PATCH_MAX_FRAME_JUMP_CM : MAX_FRAME_JUMP_CM;
  const window = handPatchActive ? PATCH_WINDOW : WINDOW;
  const priorMedian = medianOf(prev.samples);

  if (priorMedian != null && Math.abs(distanceCm - priorMedian) > maxJumpCm) {
    const outlierStreak = prev.outlierStreak + 1;
    if (!handPatchActive && outlierStreak >= OUTLIER_STREAK_TO_REBASE) {
      return {
        next: { samples: [distanceCm], outlierStreak: 0 },
        medianCm: distanceCm,
      };
    }
    if (handPatchActive) {
      const softened =
        priorMedian + PATCH_OUTLIER_BLEND * (distanceCm - priorMedian);
      const samples =
        prev.samples.length >= window
          ? [...prev.samples.slice(prev.samples.length - window + 1), softened]
          : [...prev.samples, softened];
      const medianCm = medianOf(samples) ?? softened;
      return { next: { samples, outlierStreak: 0 }, medianCm };
    }
    return {
      next: { ...prev, outlierStreak },
      medianCm: priorMedian,
    };
  }

  const samples =
    prev.samples.length >= window
      ? [...prev.samples.slice(prev.samples.length - window + 1), distanceCm]
      : [...prev.samples, distanceCm];
  const medianCm = medianOf(samples) ?? distanceCm;

  return { next: { samples, outlierStreak: 0 }, medianCm };
}

export function resetDistanceSmoother(): DistanceSmootherState {
  return createDistanceSmootherState();
}

/** Median of buffered samples without ingesting (for brief face dropouts). */
export function peekDistanceMedian(prev: DistanceSmootherState): number | null {
  return medianOf(prev.samples);
}
