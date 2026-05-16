/**
 * Rolling-median smoother for distance samples.
 *
 * Face-width-based distance estimates jitter by ~1-3 cm frame to frame.
 * A median over the last N samples suppresses that noise without adding
 * latency to real movements. The window is small on purpose (~0.5 s at
 * 12 fps) so the indicator still feels responsive.
 */

const WINDOW = 6;

export type DistanceSmootherState = {
  samples: number[];
};

export function createDistanceSmootherState(): DistanceSmootherState {
  return { samples: [] };
}

export function ingestDistanceSample(
  prev: DistanceSmootherState,
  distanceCm: number
): { next: DistanceSmootherState; medianCm: number } {
  const samples = prev.samples.length >= WINDOW
    ? [...prev.samples.slice(prev.samples.length - WINDOW + 1), distanceCm]
    : [...prev.samples, distanceCm];

  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianCm =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return { next: { samples }, medianCm };
}

export function resetDistanceSmoother(): DistanceSmootherState {
  return createDistanceSmootherState();
}
