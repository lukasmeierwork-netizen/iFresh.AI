/**
 * Rolling blink-rate estimator.
 *
 * Consumes `(eyesOpenProbability, timestampMs)` samples from ML Kit's
 * face detector classifications and returns blinks-per-minute over a
 * ~60 s rolling window. A blink is the transition:
 *   open -> closed (p drops below CLOSED_THRESHOLD)
 *   closed -> open (p rises above OPEN_THRESHOLD) within MAX_BLINK_MS
 * Closures longer than MAX_BLINK_MS are treated as "eyes closed on purpose"
 * and ignored.
 */

const CLOSED_THRESHOLD = 0.4;
const OPEN_THRESHOLD = 0.7;
const MIN_BLINK_MS = 60;
const MAX_BLINK_MS = 500;
const WINDOW_MS = 60_000;
/** Don't extrapolate before this much data has been seen. */
const MIN_OBSERVATION_MS = 8_000;

type EyeState = 'open' | 'closed';

export type BlinkDetectorState = {
  state: EyeState;
  closedSinceMs: number | null;
  /** Epoch-ms timestamps of confirmed blinks, oldest first. */
  events: number[];
  /** Timestamp of the first sample ever seen. */
  observedSinceMs: number | null;
};

export function createBlinkDetectorState(): BlinkDetectorState {
  return {
    state: 'open',
    closedSinceMs: null,
    events: [],
    observedSinceMs: null,
  };
}

/**
 * Ingest one sample. Returns the updated state and the current rolling
 * blinks-per-minute (or `null` if we haven't observed long enough).
 */
export function ingestBlinkSample(
  prev: BlinkDetectorState,
  eyesOpenProbability: number,
  timestampMs: number
): { next: BlinkDetectorState; blinksPerMinute: number | null } {
  const observedSinceMs = prev.observedSinceMs ?? timestampMs;

  let state = prev.state;
  let closedSinceMs = prev.closedSinceMs;
  let events = prev.events;

  if (state === 'open') {
    if (eyesOpenProbability < CLOSED_THRESHOLD) {
      state = 'closed';
      closedSinceMs = timestampMs;
    }
  } else {
    if (eyesOpenProbability > OPEN_THRESHOLD) {
      const duration = closedSinceMs == null ? 0 : timestampMs - closedSinceMs;
      state = 'open';
      closedSinceMs = null;
      if (duration >= MIN_BLINK_MS && duration <= MAX_BLINK_MS) {
        events = [...events, timestampMs];
      }
    } else if (closedSinceMs != null && timestampMs - closedSinceMs > MAX_BLINK_MS) {
      closedSinceMs = null;
    }
  }

  const cutoff = timestampMs - WINDOW_MS;
  if (events.length && events[0] < cutoff) {
    events = events.filter((t) => t >= cutoff);
  }

  const elapsed = timestampMs - observedSinceMs;
  let blinksPerMinute: number | null = null;
  if (elapsed >= MIN_OBSERVATION_MS) {
    const windowMs = Math.min(elapsed, WINDOW_MS);
    blinksPerMinute = (events.length / windowMs) * 60_000;
  }

  return {
    next: { state, closedSinceMs, events, observedSinceMs },
    blinksPerMinute,
  };
}
