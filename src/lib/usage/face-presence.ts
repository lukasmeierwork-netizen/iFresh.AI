/**
 * Temporal stabilization for face presence during near-vision testing.
 *
 * ML Kit can drop the face bounding box for a frame when a hand occludes one
 * eye, even though per-eye classifiers still run. Refresh presence from eye
 * signals while patching and hold the last good reading briefly otherwise.
 */

/** Brief dropout tolerance during normal tracking. */
export const FACE_VISIBLE_HOLD_MS = 700;
/** Longer hold while a hand occludes part of the face box. */
export const HAND_PATCH_FACE_VISIBLE_HOLD_MS = 2600;

export type FacePresenceState = {
  lastPresentMs: number | null;
};

export function createFacePresenceState(): FacePresenceState {
  return { lastPresentMs: null };
}

export function resolveStableFaceVisible(params: {
  prev: FacePresenceState;
  rawFaceDetected: boolean;
  timestampMs: number;
  handPatchActive: boolean;
  hasEyeSignal: boolean;
}): { next: FacePresenceState; faceVisible: boolean } {
  const {
    prev,
    rawFaceDetected,
    timestampMs,
    handPatchActive,
    hasEyeSignal,
  } = params;

  const presenceSignal =
    rawFaceDetected || (handPatchActive && hasEyeSignal);

  const lastPresentMs = presenceSignal
    ? timestampMs
    : prev.lastPresentMs;

  const holdMs = handPatchActive
    ? HAND_PATCH_FACE_VISIBLE_HOLD_MS
    : FACE_VISIBLE_HOLD_MS;

  const faceVisible =
    lastPresentMs != null && timestampMs - lastPresentMs <= holdMs;

  return {
    next: { lastPresentMs },
    faceVisible,
  };
}
