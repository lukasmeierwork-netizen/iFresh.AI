import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  classifyEyeCoverInstant,
  createEyeCoverTimingState,
  createEyeCoverVoteState,
  evaluateNearVisionEyeCover,
  getTestEyeForExam,
  isHandEyePatchActive,
  isTestEyeOpenForExam,
  stabilizeEyeCoverState,
  type EyeCoverState,
  type NearVisionEyeCoverEvaluation,
} from '@/lib/usage/eye-cover-classifier';
import { HAND_PATCH_FACE_VISIBLE_HOLD_MS } from '@/lib/usage/face-presence';
import type { Eye } from '@/lib/vision/snellen';

/** Keep chart visible through brief ML dropout while the user is patching. */
const EYE_COVER_GRACE_MS = 3200;
const EYE_COVER_MISMATCH_HOLD_MS = 2000;
/** Delay before clearing cover classifier state after a face dropout. */
const FACE_LOST_CLASSIFIER_RESET_MS = 1800;

export type UseNearVisionEyeCoverGateParams = {
  activeEye: Eye;
  faceVisible: boolean;
  leftEyeOpenProbability: number | null;
  rightEyeOpenProbability: number | null;
  inValidFocusRange: boolean;
};

export type UseNearVisionEyeCoverGateResult = {
  evaluation: NearVisionEyeCoverEvaluation;
  eyeCoverMatches: boolean;
  showLandolt: boolean;
  needsCoverInstruction: boolean;
  needsTestEyeVisible: boolean;
  needsCoveredEyeHidden: boolean;
  needsFaceVisible: boolean;
  /** Stabilized face presence for UI (tolerates brief detector dropouts). */
  effectiveFaceVisible: boolean;
  /** User confirmed hand patch when the camera could not verify it. */
  manualPatchConfirmed: boolean;
  showManualPatchButton: boolean;
  confirmManualPatch: () => void;
};

/**
 * Near-vision gating: re-runs cover classification from live per-eye scores,
 * applies grace for brief unknown dropouts, and controls when the Landolt chart shows.
 */
export function useNearVisionEyeCoverGate(
  params: UseNearVisionEyeCoverGateParams,
): UseNearVisionEyeCoverGateResult {
  const {
    activeEye,
    faceVisible,
    leftEyeOpenProbability,
    rightEyeOpenProbability,
    inValidFocusRange,
  } = params;

  const timingRef = useRef(createEyeCoverTimingState());
  const votesRef = useRef(createEyeCoverVoteState());
  const stableRef = useRef<EyeCoverState>('unknown');
  const lastMatchAtRef = useRef<number | null>(null);
  const lastMismatchAtRef = useRef<number | null>(null);
  const hasEverMatchedRef = useRef(false);
  const lastFaceVisibleAtRef = useRef<number | null>(null);
  const [classifierTick, setClassifierTick] = useState(0);
  const [manualPatchConfirmed, setManualPatchConfirmed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setClassifierTick((n) => n + 1), 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    timingRef.current = createEyeCoverTimingState();
    votesRef.current = createEyeCoverVoteState();
    stableRef.current = 'unknown';
    lastMatchAtRef.current = null;
    lastMismatchAtRef.current = null;
    hasEverMatchedRef.current = false;
    setManualPatchConfirmed(false);
  }, [activeEye]);

  useEffect(() => {
    if (faceVisible) {
      lastFaceVisibleAtRef.current = Date.now();
      return;
    }
    const timeout = setTimeout(() => {
      timingRef.current = createEyeCoverTimingState();
      votesRef.current = createEyeCoverVoteState();
      stableRef.current = 'unknown';
    }, FACE_LOST_CLASSIFIER_RESET_MS);
    return () => clearTimeout(timeout);
  }, [faceVisible]);

  const hasEyeSignal =
    leftEyeOpenProbability != null || rightEyeOpenProbability != null;
  const classifierFacePresent = faceVisible || hasEyeSignal;

  const inferredCoverState = useMemo(() => {
    void classifierTick;
    const timestampMs = Date.now();
    const { state: instant, timing } = classifyEyeCoverInstant({
      faceVisible: classifierFacePresent,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
      timestampMs,
      timing: timingRef.current,
    });
    timingRef.current = timing;
    const { votes, stable } = stabilizeEyeCoverState(
      instant,
      votesRef.current,
      stableRef.current,
    );
    votesRef.current = votes;
    stableRef.current = stable;
    return stable;
  }, [
    classifierFacePresent,
    classifierTick,
    leftEyeOpenProbability,
    rightEyeOpenProbability,
  ]);

  const evaluation = useMemo(
    () =>
      evaluateNearVisionEyeCover({
        activeEye,
        faceVisible: classifierFacePresent,
        leftEyeOpenProbability,
        rightEyeOpenProbability,
        inferredCoverState,
      }),
    [
      activeEye,
      classifierFacePresent,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
      inferredCoverState,
    ],
  );

  const now = Date.now();
  if (evaluation.eyeCoverMatches) {
    lastMatchAtRef.current = now;
    lastMismatchAtRef.current = null;
    hasEverMatchedRef.current = true;
  } else if (evaluation.inferredCoverState !== 'unknown') {
    if (lastMismatchAtRef.current == null) {
      lastMismatchAtRef.current = now;
    }
  }

  const withinGrace =
    hasEverMatchedRef.current &&
    lastMatchAtRef.current != null &&
    now - lastMatchAtRef.current <= EYE_COVER_GRACE_MS &&
    (evaluation.inferredCoverState === 'unknown' ||
      lastMismatchAtRef.current == null ||
      now - lastMismatchAtRef.current < EYE_COVER_MISMATCH_HOLD_MS);

  const cameraCoverMatches =
    evaluation.eyeCoverMatches || withinGrace;
  const eyeCoverMatches = cameraCoverMatches || manualPatchConfirmed;

  const patchLikely =
    manualPatchConfirmed ||
    isHandEyePatchActive(inferredCoverState) ||
    (hasEyeSignal &&
      (leftEyeOpenProbability == null || rightEyeOpenProbability == null));
  const faceHoldMs = patchLikely
    ? HAND_PATCH_FACE_VISIBLE_HOLD_MS
    : FACE_LOST_CLASSIFIER_RESET_MS;
  const effectiveFaceVisible =
    faceVisible ||
    (lastFaceVisibleAtRef.current != null &&
      now - lastFaceVisibleAtRef.current <= faceHoldMs) ||
    (patchLikely && hasEyeSignal);

  const needsFaceVisible = !effectiveFaceVisible;

  const testEye = getTestEyeForExam(activeEye);
  const testEyeOpen =
    testEye != null &&
    isTestEyeOpenForExam(
      testEye,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
    );

  const showManualPatchButton =
    activeEye !== 'both' &&
    effectiveFaceVisible &&
    inValidFocusRange &&
    testEyeOpen &&
    !cameraCoverMatches &&
    !manualPatchConfirmed &&
    (evaluation.needsCoverInstruction || evaluation.needsCoveredEyeHidden);

  const showLandolt =
    inValidFocusRange &&
    effectiveFaceVisible &&
    (evaluation.setupReady ||
      manualPatchConfirmed ||
      (withinGrace && hasEverMatchedRef.current));

  const confirmManualPatch = useCallback(() => {
    setManualPatchConfirmed(true);
    hasEverMatchedRef.current = true;
    lastMatchAtRef.current = Date.now();
    lastMismatchAtRef.current = null;
  }, []);

  return {
    evaluation,
    eyeCoverMatches,
    showLandolt,
    needsCoverInstruction:
      evaluation.needsCoverInstruction && !withinGrace && !manualPatchConfirmed,
    needsTestEyeVisible:
      evaluation.needsTestEyeVisible && !manualPatchConfirmed,
    needsCoveredEyeHidden:
      evaluation.needsCoveredEyeHidden && !manualPatchConfirmed,
    needsFaceVisible,
    effectiveFaceVisible,
    manualPatchConfirmed,
    showManualPatchButton,
    confirmManualPatch,
  };
}
