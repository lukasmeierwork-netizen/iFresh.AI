/**
 * App-wide eye-usage store.
 *
 * A single foreground monitor writes here; every screen reads via
 * `useUsageStore`. The store is intentionally a plain module-level object
 * (no React context) so the camera hook can update it from effects and
 * frame-processor JS-callbacks without dragging a provider tree around.
 *
 * Only one camera session is allowed at a time on iOS. Any feature that
 * needs a short-lived camera (photo capture, etc.) must first call
 * `pauseMonitoring()` and call `resumeMonitoring()` on completion so the
 * hidden usage camera releases the hardware.
 */

export type UsageSnapshot = {
  /** Current median distance from the front camera in cm, or `null` when no face is seen. */
  distanceCm: number | null;
  /** Rolling blink rate over the last ~60 s, extrapolated when less data is available. */
  blinkRate: number | null;
  /** Minutes of continuous presence in front of the camera (resets after a face gap). */
  continuousMinutes: number;
  /** Whether a face is currently detected. */
  faceVisible: boolean;
  /** Best-effort eye-cover classification from eye-open probabilities. */
  eyeCoverState: 'leftCovered' | 'rightCovered' | 'neither' | 'unknown';
  /** Per-eye open scores (user left/right, after front-camera mirroring). */
  leftEyeOpenProbability: number | null;
  rightEyeOpenProbability: number | null;
  /** Epoch ms of the last raw detection that updated the store. */
  lastUpdatedAt: number | null;
  /** User preference: whether the background camera monitor is allowed to run. */
  monitoringEnabled: boolean;
  /** Whether a downstream feature (e.g. near-vision capture) is consuming the camera instead. */
  monitoringPaused: boolean;
};

const INITIAL_SNAPSHOT: UsageSnapshot = {
  distanceCm: null,
  blinkRate: null,
  continuousMinutes: 0,
  faceVisible: false,
  eyeCoverState: 'unknown',
  leftEyeOpenProbability: null,
  rightEyeOpenProbability: null,
  lastUpdatedAt: null,
  monitoringEnabled: false,
  monitoringPaused: false,
};

let currentSnapshot: UsageSnapshot = INITIAL_SNAPSHOT;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Replace the snapshot with a new object and notify subscribers. */
function setSnapshot(next: UsageSnapshot) {
  if (next === currentSnapshot) return;
  currentSnapshot = next;
  emit();
}

/** Subscribe to snapshot changes. Returns an unsubscribe function. */
export function subscribeUsage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Latest immutable snapshot. Safe to call in render or effects. */
export function getUsageSnapshot(): UsageSnapshot {
  return currentSnapshot;
}

/** Write a partial update, preserving unspecified fields. */
export function updateUsage(patch: Partial<UsageSnapshot>) {
  setSnapshot({ ...currentSnapshot, ...patch });
}

/** Toggle whether the monitor is allowed to run at all. */
export function setMonitoringEnabled(enabled: boolean) {
  if (currentSnapshot.monitoringEnabled === enabled) return;
  setSnapshot({
    ...currentSnapshot,
    monitoringEnabled: enabled,
    ...(enabled
      ? {}
      : {
          distanceCm: null,
          blinkRate: null,
          continuousMinutes: 0,
          faceVisible: false,
          eyeCoverState: 'unknown',
          leftEyeOpenProbability: null,
          rightEyeOpenProbability: null,
        }),
  });
}

/**
 * Temporarily stop monitoring so another feature can acquire the camera.
 * The monitoring preference is preserved; pairs with `resumeMonitoring`.
 */
export function pauseMonitoring() {
  if (currentSnapshot.monitoringPaused) return;
  setSnapshot({ ...currentSnapshot, monitoringPaused: true });
}

export function resumeMonitoring() {
  if (!currentSnapshot.monitoringPaused) return;
  setSnapshot({ ...currentSnapshot, monitoringPaused: false });
}

/** Reset distance/blink/continuous state without disabling the monitor. */
export function resetUsageMetrics() {
  setSnapshot({
    ...currentSnapshot,
    distanceCm: null,
    blinkRate: null,
    continuousMinutes: 0,
    faceVisible: false,
    eyeCoverState: 'unknown',
    leftEyeOpenProbability: null,
    rightEyeOpenProbability: null,
    lastUpdatedAt: null,
  });
}
