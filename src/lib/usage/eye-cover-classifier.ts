import type { Eye } from '@/lib/vision/snellen';

/** Aggregate cover state written to the usage store. */
export type EyeCoverState = 'leftCovered' | 'rightCovered' | 'neither' | 'unknown';

/** Per-eye status for near-vision UI copy. */
export type EyeSideStatus = 'open' | 'covered' | 'uncertain' | 'unableToCheck';

/** Minimum score to treat an eye as open (test eye / peer for null-as-covered). */
export const OPEN_EYE_THRESHOLD = 0.3;

/** Peer must be at least this open before a null score is treated as covered (0). */
export const CONFIDENT_OPEN_THRESHOLD = 0.35;

/** At or below this (including synthetic 0) the eye counts as covered. */
export const COVERED_EYE_MAX_THRESHOLD = 0.58;

export const EYE_GAP_THRESHOLD = 0.14;
/** Smaller gap for hand patch when both ML scores stay high. */
export const HAND_COVER_GAP_THRESHOLD = 0.08;
export const BOTH_EYES_DIFF_MAX = 0.22;
export const COVER_HOLD_MS = 320;
export const BOTH_OPEN_HOLD_MS = 160;

export type EyeCoverTimingState = {
  leftLowSinceMs: number | null;
  rightLowSinceMs: number | null;
  bothOpenSinceMs: number | null;
  oneSidedNullSinceMs: number | null;
  oneSidedNullCover: 'leftCovered' | 'rightCovered' | null;
};

export type EyeCoverVoteState = Record<EyeCoverState, number>;

export function createEyeCoverTimingState(): EyeCoverTimingState {
  return {
    leftLowSinceMs: null,
    rightLowSinceMs: null,
    bothOpenSinceMs: null,
    oneSidedNullSinceMs: null,
    oneSidedNullCover: null,
  };
}

export function createEyeCoverVoteState(): EyeCoverVoteState {
  return {
    leftCovered: 0,
    rightCovered: 0,
    neither: 0,
    unknown: 0,
  };
}

/** Hand or lid is blocking one eye — face-width distance becomes unreliable. */
export function isHandEyePatchActive(state: EyeCoverState): boolean {
  return state === 'leftCovered' || state === 'rightCovered';
}

export function getRequiredCoverState(activeEye: Eye): EyeCoverState {
  if (activeEye === 'right') return 'leftCovered';
  if (activeEye === 'left') return 'rightCovered';
  return 'neither';
}

export type EyeSide = 'left' | 'right';

/** Eye that must be covered (hand patch) for the current monocular step. */
export function getCoveredEyeForTest(activeEye: Eye): EyeSide | null {
  if (activeEye === 'right') return 'left';
  if (activeEye === 'left') return 'right';
  return null;
}

/** Eye whose acuity is being measured. */
export function getTestEyeForExam(activeEye: Eye): EyeSide | null {
  if (activeEye === 'both') return null;
  return activeEye;
}

/**
 * Non-test eye looks patched: ML score is null (hand blocking) or low (lid closed /
 * blocked). Null only counts when the test eye is confidently open.
 */
export function isNonTestEyeOccluded(
  side: EyeSide,
  leftRaw: number | null,
  rightRaw: number | null,
): boolean {
  const own = side === 'left' ? leftRaw : rightRaw;
  const peer = side === 'left' ? rightRaw : leftRaw;
  if (own == null) {
    return peer != null && peer >= CONFIDENT_OPEN_THRESHOLD;
  }
  if (peer != null && peer >= OPEN_EYE_THRESHOLD) {
    if (own <= COVERED_EYE_MAX_THRESHOLD) return true;
    // Hand cover: both scores can stay high; covered side is often lower.
    if (peer - own >= HAND_COVER_GAP_THRESHOLD) return true;
  }
  return false;
}

/** Test eye must remain visible to the classifier for the chart to run. */
export function isTestEyeOpenForExam(
  side: EyeSide,
  leftRaw: number | null,
  rightRaw: number | null,
): boolean {
  const own = side === 'left' ? leftRaw : rightRaw;
  const peer = side === 'left' ? rightRaw : leftRaw;
  if (own == null) return false;
  if (own >= OPEN_EYE_THRESHOLD) return true;
  if (peer != null && own - peer >= EYE_GAP_THRESHOLD && own >= OPEN_EYE_THRESHOLD) {
    return true;
  }
  return false;
}

/**
 * Monocular near-vision setup: non-test eye occluded + test eye open.
 * Primary signal for smooth patching (hand → null/low on covered side only).
 */
export function isMonocularTestSetupReady(
  activeEye: Eye,
  faceVisible: boolean,
  leftRaw: number | null,
  rightRaw: number | null,
): boolean {
  if (!faceVisible || activeEye === 'both') return false;
  const testEye = getTestEyeForExam(activeEye);
  const coveredEye = getCoveredEyeForTest(activeEye);
  if (testEye == null || coveredEye == null) return false;
  return (
    isTestEyeOpenForExam(testEye, leftRaw, rightRaw) &&
    isNonTestEyeOccluded(coveredEye, leftRaw, rightRaw)
  );
}

export function isBothEyesTestSetupReady(
  faceVisible: boolean,
  leftRaw: number | null,
  rightRaw: number | null,
): boolean {
  if (!faceVisible) return false;
  return (
    isTestEyeOpenForExam('left', leftRaw, rightRaw) &&
    isTestEyeOpenForExam('right', leftRaw, rightRaw)
  );
}

/**
 * Cover-only interpretation of a per-eye score. Does not mutate blink inputs.
 * Returns synthetic 0 when ML Kit omits one eye but the other is confidently open.
 */
export function scoreForCoverAnalysis(
  side: 'left' | 'right',
  leftRaw: number | null,
  rightRaw: number | null,
): number | null {
  const own = side === 'left' ? leftRaw : rightRaw;
  const peer = side === 'left' ? rightRaw : leftRaw;
  if (own != null) return own;
  if (peer != null && peer >= CONFIDENT_OPEN_THRESHOLD) return 0;
  return null;
}

export function perEyeStatusFromScore(score: number | null): EyeSideStatus {
  if (score == null) return 'unableToCheck';
  if (score <= COVERED_EYE_MAX_THRESHOLD) return 'covered';
  if (score >= OPEN_EYE_THRESHOLD) return 'open';
  return 'uncertain';
}

/** Per-eye status for near-vision UI (uses monocular roles when testing one eye). */
export function perEyeStatusForExam(
  side: EyeSide,
  activeEye: Eye,
  leftRaw: number | null,
  rightRaw: number | null,
): EyeSideStatus {
  if (activeEye === 'both') {
    return perEyeStatusFromScore(
      scoreForCoverAnalysis(side, leftRaw, rightRaw),
    );
  }
  const coveredEye = getCoveredEyeForTest(activeEye);
  const testEye = getTestEyeForExam(activeEye);
  if (coveredEye == null || testEye == null) return 'unableToCheck';

  if (side === coveredEye && isNonTestEyeOccluded(side, leftRaw, rightRaw)) {
    return 'covered';
  }
  if (side === testEye && isTestEyeOpenForExam(side, leftRaw, rightRaw)) {
    return 'open';
  }

  const own = side === 'left' ? leftRaw : rightRaw;
  if (own == null) return 'unableToCheck';
  return perEyeStatusFromScore(scoreForCoverAnalysis(side, leftRaw, rightRaw));
}

/** i18n key under `nearVision.eyeCheck.*` for a side + status. */
export function eyeCheckTranslationKey(
  side: EyeSide,
  status: EyeSideStatus,
): string {
  const prefix = side === 'left' ? 'left' : 'right';
  switch (status) {
    case 'unableToCheck':
      return `nearVision.eyeCheck.${prefix}Unable`;
    case 'covered':
      return `nearVision.eyeCheck.${prefix}Hidden`;
    case 'open':
      return `nearVision.eyeCheck.${prefix}Visible`;
    case 'uncertain':
      return `nearVision.eyeCheck.${prefix}Uncertain`;
  }
}

function resetOneSidedNullHold(timing: EyeCoverTimingState): EyeCoverTimingState {
  if (timing.oneSidedNullSinceMs == null && timing.oneSidedNullCover == null) {
    return timing;
  }
  return {
    ...timing,
    oneSidedNullSinceMs: null,
    oneSidedNullCover: null,
  };
}

function startOneSidedNullHold(
  timing: EyeCoverTimingState,
  cover: 'leftCovered' | 'rightCovered',
  timestampMs: number,
): EyeCoverTimingState {
  if (
    timing.oneSidedNullCover === cover &&
    timing.oneSidedNullSinceMs != null
  ) {
    return timing;
  }
  return {
    ...timing,
    oneSidedNullSinceMs: timestampMs,
    oneSidedNullCover: cover,
  };
}

/**
 * Instant cover state from raw ML Kit probabilities (user left/right, mirrored).
 */
export function classifyEyeCoverInstant(params: {
  faceVisible: boolean;
  leftEyeOpenProbability: number | null;
  rightEyeOpenProbability: number | null;
  timestampMs: number;
  timing: EyeCoverTimingState;
}): { state: EyeCoverState; timing: EyeCoverTimingState } {
  const { faceVisible, leftEyeOpenProbability, rightEyeOpenProbability, timestampMs } =
    params;
  let timing = params.timing;

  if (!faceVisible) {
    return {
      state: 'unknown',
      timing: createEyeCoverTimingState(),
    };
  }

  const leftRaw = leftEyeOpenProbability;
  const rightRaw = rightEyeOpenProbability;

  // Both missing — classifier dropout; never guess cover.
  if (leftRaw == null && rightRaw == null) {
    return { state: 'unknown', timing: createEyeCoverTimingState() };
  }

  // Guarded one-sided null: hand on non-test eye → immediate cover (peer must be open).
  if (leftRaw == null && rightRaw != null) {
    if (rightRaw >= CONFIDENT_OPEN_THRESHOLD) {
      timing = startOneSidedNullHold(timing, 'leftCovered', timestampMs);
      return { state: 'leftCovered', timing };
    }
    return { state: 'unknown', timing: createEyeCoverTimingState() };
  }

  if (rightRaw == null && leftRaw != null) {
    if (leftRaw >= CONFIDENT_OPEN_THRESHOLD) {
      timing = startOneSidedNullHold(timing, 'rightCovered', timestampMs);
      return { state: 'rightCovered', timing };
    }
    return { state: 'unknown', timing: createEyeCoverTimingState() };
  }

  if (leftRaw == null || rightRaw == null) {
    return { state: 'unknown', timing: createEyeCoverTimingState() };
  }

  timing = resetOneSidedNullHold(timing);

  const left = scoreForCoverAnalysis('left', leftRaw, rightRaw)!;
  const right = scoreForCoverAnalysis('right', leftRaw, rightRaw)!;

  const leftOpen = left >= OPEN_EYE_THRESHOLD;
  const rightOpen = right >= OPEN_EYE_THRESHOLD;
  const leftLikelyCovered = left <= COVERED_EYE_MAX_THRESHOLD;
  const rightLikelyCovered = right <= COVERED_EYE_MAX_THRESHOLD;
  const leftCoverCandidate =
    rightOpen &&
    right - left >= EYE_GAP_THRESHOLD &&
    (leftLikelyCovered || left < right);
  const rightCoverCandidate =
    leftOpen &&
    left - right >= EYE_GAP_THRESHOLD &&
    (rightLikelyCovered || right < left);
  const bothOpenCandidate =
    leftOpen && rightOpen && Math.abs(left - right) <= BOTH_EYES_DIFF_MAX;

  let leftLowSinceMs = timing.leftLowSinceMs;
  let rightLowSinceMs = timing.rightLowSinceMs;
  let bothOpenSinceMs = timing.bothOpenSinceMs;

  if (leftCoverCandidate) {
    if (leftLowSinceMs == null) leftLowSinceMs = timestampMs;
  } else {
    leftLowSinceMs = null;
  }

  if (rightCoverCandidate) {
    if (rightLowSinceMs == null) rightLowSinceMs = timestampMs;
  } else {
    rightLowSinceMs = null;
  }

  if (bothOpenCandidate) {
    if (bothOpenSinceMs == null) bothOpenSinceMs = timestampMs;
  } else {
    bothOpenSinceMs = null;
  }

  timing = {
    ...timing,
    leftLowSinceMs,
    rightLowSinceMs,
    bothOpenSinceMs,
  };

  if (
    leftLowSinceMs != null &&
    timestampMs - leftLowSinceMs >= COVER_HOLD_MS
  ) {
    return { state: 'leftCovered', timing };
  }
  if (
    rightLowSinceMs != null &&
    timestampMs - rightLowSinceMs >= COVER_HOLD_MS
  ) {
    return { state: 'rightCovered', timing };
  }
  if (
    bothOpenSinceMs != null &&
    timestampMs - bothOpenSinceMs >= BOTH_OPEN_HOLD_MS
  ) {
    return { state: 'neither', timing };
  }

  if (left + EYE_GAP_THRESHOLD < right && rightOpen) {
    return { state: 'leftCovered', timing };
  }
  if (right + EYE_GAP_THRESHOLD < left && leftOpen) {
    return { state: 'rightCovered', timing };
  }

  return { state: 'unknown', timing };
}

const VOTE_STATES: EyeCoverState[] = [
  'leftCovered',
  'rightCovered',
  'neither',
  'unknown',
];

/** Temporal voting so single-frame noise does not flip cover state. */
export function stabilizeEyeCoverState(
  instant: EyeCoverState,
  votes: EyeCoverVoteState,
  stable: EyeCoverState,
): { votes: EyeCoverVoteState; stable: EyeCoverState } {
  const nextVotes = { ...votes };
  for (const state of VOTE_STATES) {
    if (state === instant) {
      nextVotes[state] = Math.min(8, nextVotes[state] + 2);
    } else {
      nextVotes[state] = Math.max(0, nextVotes[state] - 1);
    }
  }
  const leader = VOTE_STATES.reduce(
    (best, state) => (nextVotes[state] > nextVotes[best] ? state : best),
    stable,
  );
  const nextStable = nextVotes[leader] >= 4 ? leader : stable;
  return { votes: nextVotes, stable: nextStable };
}

export type NearVisionEyeCoverEvaluation = {
  requiredCoverState: EyeCoverState;
  inferredCoverState: EyeCoverState;
  leftStatus: EyeSideStatus;
  rightStatus: EyeSideStatus;
  /** Non-test eye occluded + test eye open (monocular) or both open. */
  monocularSetupReady: boolean;
  setupReady: boolean;
  eyeCoverMatches: boolean;
  needsCoverInstruction: boolean;
  needsTestEyeVisible: boolean;
  needsCoveredEyeHidden: boolean;
};

export function evaluateNearVisionEyeCover(params: {
  activeEye: Eye;
  faceVisible: boolean;
  leftEyeOpenProbability: number | null;
  rightEyeOpenProbability: number | null;
  inferredCoverState: EyeCoverState;
}): NearVisionEyeCoverEvaluation {
  const {
    activeEye,
    faceVisible,
    leftEyeOpenProbability,
    rightEyeOpenProbability,
    inferredCoverState,
  } = params;

  const requiredCoverState = getRequiredCoverState(activeEye);
  const leftStatus = faceVisible
    ? perEyeStatusForExam(
        'left',
        activeEye,
        leftEyeOpenProbability,
        rightEyeOpenProbability,
      )
    : 'unableToCheck';
  const rightStatus = faceVisible
    ? perEyeStatusForExam(
        'right',
        activeEye,
        leftEyeOpenProbability,
        rightEyeOpenProbability,
      )
    : 'unableToCheck';

  const monocularSetupReady = isMonocularTestSetupReady(
    activeEye,
    faceVisible,
    leftEyeOpenProbability,
    rightEyeOpenProbability,
  );
  const bothEyesSetupReady =
    activeEye === 'both' &&
    isBothEyesTestSetupReady(
      faceVisible,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
    );
  const aggregateMatches =
    inferredCoverState !== 'unknown' &&
    inferredCoverState === requiredCoverState;

  const eyeCoverMatches =
    faceVisible &&
    (monocularSetupReady || bothEyesSetupReady || aggregateMatches);

  const testEye = getTestEyeForExam(activeEye);
  const coveredEye = getCoveredEyeForTest(activeEye);

  const needsTestEyeVisible =
    faceVisible &&
    testEye != null &&
    !isTestEyeOpenForExam(
      testEye,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
    ) &&
    !monocularSetupReady;

  const coveredStatus =
    coveredEye === 'left'
      ? leftStatus
      : coveredEye === 'right'
        ? rightStatus
        : null;
  const needsCoveredEyeHidden =
    faceVisible &&
    coveredEye != null &&
    !monocularSetupReady &&
    (coveredStatus === 'open' || coveredStatus === 'uncertain');

  const needsCoverInstruction =
    faceVisible &&
    !eyeCoverMatches &&
    !needsTestEyeVisible &&
    !needsCoveredEyeHidden;

  const setupReady =
    eyeCoverMatches && !needsTestEyeVisible && !needsCoveredEyeHidden;

  return {
    requiredCoverState,
    inferredCoverState,
    leftStatus,
    rightStatus,
    monocularSetupReady,
    setupReady,
    eyeCoverMatches,
    needsCoverInstruction,
    needsTestEyeVisible,
    needsCoveredEyeHidden,
  };
}
