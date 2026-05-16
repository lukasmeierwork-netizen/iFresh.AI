/**
 * Tracks minutes of continuous presence in front of the camera.
 *
 * Each `ingestPresenceSample` call feeds a boolean "face visible" signal
 * plus an epoch-ms timestamp. The session advances while a face is seen,
 * and resets once the face has been absent for at least `GAP_RESET_MS`.
 * Short absences (e.g. the user glancing away) do NOT reset the counter.
 */

const GAP_RESET_MS = 15_000;

export type ContinuousUseState = {
  /** First timestamp at which the user became present (start of session). */
  sessionStartedAtMs: number | null;
  /** Last timestamp at which we had a face. */
  lastSeenAtMs: number | null;
  /** Last accumulated duration in ms (at `lastSeenAtMs`), so we don't re-add absence time. */
  accumulatedMs: number;
};

export function createContinuousUseState(): ContinuousUseState {
  return {
    sessionStartedAtMs: null,
    lastSeenAtMs: null,
    accumulatedMs: 0,
  };
}

export function ingestPresenceSample(
  prev: ContinuousUseState,
  faceVisible: boolean,
  timestampMs: number
): { next: ContinuousUseState; continuousMinutes: number } {
  if (faceVisible) {
    const gapMs =
      prev.lastSeenAtMs == null ? Infinity : timestampMs - prev.lastSeenAtMs;

    if (prev.sessionStartedAtMs == null || gapMs > GAP_RESET_MS) {
      const next: ContinuousUseState = {
        sessionStartedAtMs: timestampMs,
        lastSeenAtMs: timestampMs,
        accumulatedMs: 0,
      };
      return { next, continuousMinutes: 0 };
    }

    const accumulatedMs = timestampMs - prev.sessionStartedAtMs;
    const next: ContinuousUseState = {
      sessionStartedAtMs: prev.sessionStartedAtMs,
      lastSeenAtMs: timestampMs,
      accumulatedMs,
    };
    return { next, continuousMinutes: accumulatedMs / 60_000 };
  }

  if (prev.lastSeenAtMs != null && timestampMs - prev.lastSeenAtMs > GAP_RESET_MS) {
    return {
      next: createContinuousUseState(),
      continuousMinutes: 0,
    };
  }

  return { next: prev, continuousMinutes: prev.accumulatedMs / 60_000 };
}
