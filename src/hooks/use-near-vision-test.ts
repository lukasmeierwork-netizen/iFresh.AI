import * as Device from "expo-device";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PixelRatio, useWindowDimensions } from "react-native";

import {
  angleToOctant,
  randomLandoltOctant,
  SWIPE_MIN_DISTANCE_PX,
} from "@/lib/vision/landolt";
import {
  estimatePpiFromPixelRatio,
  landoltDiameterPxForN,
  mmToPixels,
  ppiToPixelsPerMm,
  RULER_REFERENCE_MM,
  uniformLandoltLadderScale,
} from "@/lib/vision/near-vision-calibration";
import {
  loadNearVisionCalibration,
} from "@/lib/vision/near-vision-storage";
import { uploadNearVisionResults } from "@/lib/vision/near-vision-results-api";
import {
  isWithinFocusRange,
  NEAR_VISION_TARGET_CM,
} from "@/lib/vision/near-vision-config";
import {
  N_TO_SNELLEN,
  SNELLEN_TO_DECIMAL,
  TEST_SIZES_N,
  type Eye,
  type NearAcuityResult,
} from "@/lib/vision/snellen";

export type NearVisionStep = "ready" | "test" | "results";
type AdaptivePhase = "fast-jump" | "bracketing" | "confirmation";

const START_INDEX = 6; // 20/50
const INITIAL_STEP = 2;
const MIN_LEVELS_EXPLORED = 3;
const MAX_ACUITY_INDEX = TEST_SIZES_N.length - 1;
/** Rotate to a fresh Landolt orientation this long after each display to reduce memorization bias. */
const LANDOLT_AUTO_ADVANCE_MS = 5000;

/**
 * Near-vision test state machine. Owns calibration, per-eye progression,
 * trial counts, and pan-gesture scoring so the screen component can stay focused
 * on layout.
 */
export function useNearVisionTest() {
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const orientation = windowHeight >= windowWidth ? "portrait" : "landscape";
  const deviceId = Device.modelId ?? Device.modelName ?? "ios-device";
  const calibrationDeviceId = `${deviceId}:${orientation}`;

  const [step, setStep] = useState<NearVisionStep>("ready");
  const [liveDistanceCm, setLiveDistanceCm] = useState<number | null>(null);
  const [correctionScale, setCorrectionScale] = useState(1);

  const [eye, setEye] = useState<Eye>("right");
  const [pendingEye, setPendingEye] = useState<Eye>("right");
  const [index, setIndex] = useState(START_INDEX);
  const [landoltOctant, setLandoltOctant] = useState(() =>
    randomLandoltOctant(),
  );
  const [landoltRotateProgress, setLandoltRotateProgress] = useState(0);
  const [landoltRotateSecondsRemaining, setLandoltRotateSecondsRemaining] =
    useState(0);

  const [rightResult, setRightResult] = useState<NearAcuityResult | null>(null);
  const [leftResult, setLeftResult] = useState<NearAcuityResult | null>(null);
  const [bothResult, setBothResult] = useState<NearAcuityResult | null>(null);
  const [wrongSwipe, setWrongSwipe] = useState(false);

  const [trialCount, setTrialCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<AdaptivePhase>("fast-jump");
  const [stepSize, setStepSize] = useState(INITIAL_STEP);
  const [lastOutcome, setLastOutcome] = useState<"pass" | "fail" | null>(null);
  const [lastPassedIndex, setLastPassedIndex] = useState<number | null>(null);
  const [firstFailedIndex, setFirstFailedIndex] = useState<number | null>(null);
  const [upperBoundary, setUpperBoundary] = useState<number | null>(null);
  const [lowerBoundary, setLowerBoundary] = useState<number | null>(null);
  const [confirmationCandidate, setConfirmationCandidate] = useState<
    number | null
  >(null);
  const [exploredIndices, setExploredIndices] = useState<number[]>([]);
  /** Synchronous explored count — avoids stale `exploredIndices` after `rememberExplored` in one tick. */
  const exploredLevelsRef = useRef<Set<number>>(new Set());

  const prevInValidFocusRef = useRef(false);
  const lostValidFocusOnceRef = useRef(false);
  const landoltOctantRef = useRef(landoltOctant);
  const inValidFocusRef = useRef(false);
  const handleAnswerRef = useRef<(isCorrect: boolean) => void>(() => {});

  useEffect(() => {
    landoltOctantRef.current = landoltOctant;
  }, [landoltOctant]);

  const estimatedPpi = useMemo(
    () => estimatePpiFromPixelRatio(PixelRatio.get()),
    [],
  );
  const pixelsPerMm = useMemo(
    () => ppiToPixelsPerMm(estimatedPpi),
    [estimatedPpi],
  );
  const referenceBarPx = useMemo(
    () =>
      Math.round(mmToPixels(RULER_REFERENCE_MM, pixelsPerMm, correctionScale)),
    [pixelsPerMm, correctionScale],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadNearVisionCalibration();
      if (cancelled) return;
      if (saved && saved.deviceId === calibrationDeviceId) {
        setCorrectionScale(saved.correctionScale);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [calibrationDeviceId]);

  const currentN = TEST_SIZES_N[Math.min(index, TEST_SIZES_N.length - 1)];

  /** Full ladder calibrated at nominal test distance → uniform viewport scale preserves step-to-step ratios. */
  const ladderDiameterPxNominal = useMemo(
    () =>
      TEST_SIZES_N.map((n) =>
        landoltDiameterPxForN(
          n,
          NEAR_VISION_TARGET_CM,
          pixelsPerMm,
          correctionScale,
        ),
      ),
    [pixelsPerMm, correctionScale],
  );

  const ladderUniformScale = useMemo(() => {
    const minDim = Math.min(windowWidth, windowHeight);
    return uniformLandoltLadderScale(ladderDiameterPxNominal, minDim);
  }, [ladderDiameterPxNominal, windowWidth, windowHeight]);

  const landoltRotationDeg = landoltOctant * 45;

  const inValidFocusRange =
    step === "test" &&
    liveDistanceCm != null &&
    isWithinFocusRange(liveDistanceCm);

  const landoltSizePx = useMemo(() => {
    const pxNominal = landoltDiameterPxForN(
      currentN,
      NEAR_VISION_TARGET_CM,
      pixelsPerMm,
      correctionScale,
    );
    /** Keep optotype size fixed during each test level; distance only gates focus validity. */
    const scaled = pxNominal * ladderUniformScale;
    /** No per-row viewport min() cap; smallest rows may legitimately subtend few px. */
    return Math.max(4, Math.round(scaled));
  }, [correctionScale, currentN, ladderUniformScale, pixelsPerMm]);

  useEffect(() => {
    inValidFocusRef.current = inValidFocusRange;
  }, [inValidFocusRange]);

  useEffect(() => {
    if (step !== "test") return;

    if (inValidFocusRange) {
      if (!prevInValidFocusRef.current) {
        if (lostValidFocusOnceRef.current) {
          setLandoltOctant((prev) => randomLandoltOctant(prev));
          lostValidFocusOnceRef.current = false;
        }
      }
      prevInValidFocusRef.current = true;
    } else {
      if (prevInValidFocusRef.current) {
        lostValidFocusOnceRef.current = true;
      }
      prevInValidFocusRef.current = false;
    }
  }, [step, inValidFocusRange]);

  useEffect(() => {
    if (step !== "test" || !inValidFocusRange) {
      setLandoltRotateProgress(0);
      setLandoltRotateSecondsRemaining(0);
      return;
    }

    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= LANDOLT_AUTO_ADVANCE_MS) {
        /**
         * Timeout counts as a missed response so adaptive difficulty can move and
         * icon size updates along with the resolved test level.
         */
        handleAnswerRef.current(false);
        return;
      }
      setLandoltRotateProgress(elapsed / LANDOLT_AUTO_ADVANCE_MS);
      setLandoltRotateSecondsRemaining(
        Math.max(1, Math.ceil((LANDOLT_AUTO_ADVANCE_MS - elapsed) / 1000)),
      );
    };

    const id = setInterval(tick, 50);
    tick();
    return () => clearInterval(id);
  }, [step, inValidFocusRange, landoltOctant]);

  const handleLiveDistance = useCallback(
    (estimate: { distanceCm: number } | null) => {
      setLiveDistanceCm(estimate?.distanceCm ?? null);
    },
    [],
  );

  const clampIndex = useCallback(
    (value: number) => Math.max(0, Math.min(value, TEST_SIZES_N.length - 1)),
    [],
  );

  const rememberExplored = useCallback((levelIndex: number) => {
    exploredLevelsRef.current.add(levelIndex);
    setExploredIndices((prev) =>
      prev.includes(levelIndex) ? prev : [...prev, levelIndex],
    );
  }, []);

  const resetEyeState = useCallback(() => {
    setLiveDistanceCm(null);
    prevInValidFocusRef.current = false;
    lostValidFocusOnceRef.current = false;
    setWrongSwipe(false);
    setIndex(START_INDEX);
    setTrialCount(0);
    setCorrectCount(0);
    setPhase("fast-jump");
    setStepSize(INITIAL_STEP);
    setLastOutcome(null);
    setLastPassedIndex(null);
    setFirstFailedIndex(null);
    setUpperBoundary(null);
    setLowerBoundary(null);
    setConfirmationCandidate(null);
    setExploredIndices([]);
    exploredLevelsRef.current = new Set();
    setLandoltOctant((prev) => randomLandoltOctant(prev));
  }, []);

  const beginTestFlow = useCallback(() => {
    setLiveDistanceCm(null);
    prevInValidFocusRef.current = false;
    lostValidFocusOnceRef.current = false;
    setWrongSwipe(false);
    setEye("right");
    setPendingEye("right");
    setIndex(START_INDEX);
    setLandoltOctant(randomLandoltOctant());
    setRightResult(null);
    setLeftResult(null);
    setBothResult(null);
    setTrialCount(0);
    setCorrectCount(0);
    setPhase("fast-jump");
    setStepSize(INITIAL_STEP);
    setLastOutcome(null);
    setLastPassedIndex(null);
    setFirstFailedIndex(null);
    setUpperBoundary(null);
    setLowerBoundary(null);
    setConfirmationCandidate(null);
    setExploredIndices([]);
    exploredLevelsRef.current = new Set();
    setStep("ready");
  }, []);

  const adjustCalibration = useCallback((delta: number) => {
    setCorrectionScale((prev) =>
      Math.max(0.45, Math.min(1.5, Math.round((prev + delta) * 1000) / 1000)),
    );
  }, []);

  const startPendingEye = useCallback(() => {
    setEye(pendingEye);
    resetEyeState();
    setStep("test");
  }, [pendingEye, resetEyeState]);

  const finishEye = useCallback(
    (result: NearAcuityResult | null) => {
      if (eye === "right") setRightResult(result);
      if (eye === "left") setLeftResult(result);
      if (eye === "both") setBothResult(result);

      if (eye === "right") {
        setPendingEye("left");
        setStep("ready");
        return;
      }

      if (eye === "left") {
        setPendingEye("both");
        setStep("ready");
        return;
      }

      setStep("results");
    },
    [eye],
  );

  const finishWithPassedIndex = useCallback(
    (passedIndex: number) => {
      const resolvedIndex = Math.max(
        0,
        Math.min(passedIndex, TEST_SIZES_N.length - 1),
      );
      const nSize = TEST_SIZES_N[resolvedIndex];
      const approxSnellen = N_TO_SNELLEN[nSize] ?? "—";
      const result: NearAcuityResult = {
        eye,
        nSize,
        approxSnellen,
        decimalAcuity: SNELLEN_TO_DECIMAL[approxSnellen],
      };
      finishEye(result);
    },
    [eye, finishEye],
  );

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const targetTrials =
        phase === "confirmation" ? 5 : phase === "bracketing" ? 3 : 2;
      const nextTrials = trialCount + 1;
      const nextCorrect = correctCount + (isCorrect ? 1 : 0);

      setLandoltOctant((prev) => randomLandoltOctant(prev));
      setTrialCount(nextTrials);
      setCorrectCount(nextCorrect);

      if (nextTrials < targetTrials) return;

      rememberExplored(index);
      const levelsExploredCount = exploredLevelsRef.current.size;
      setTrialCount(0);
      setCorrectCount(0);

      if (phase === "confirmation") {
        const passed = nextCorrect >= 3;
        const candidate = confirmationCandidate ?? index;
        const fallback = clampIndex(candidate - 1);
        const finalIndex = passed ? candidate : fallback;
        finishWithPassedIndex(finalIndex);
        return;
      }

      if (phase === "bracketing") {
        if (upperBoundary == null || lowerBoundary == null) {
          finishWithPassedIndex(lastPassedIndex ?? clampIndex(index - 1));
          return;
        }
        const passed = nextCorrect >= 2;
        const nextUpper = passed ? index : upperBoundary;
        const nextLower = passed ? lowerBoundary : index;
        setUpperBoundary(nextUpper);
        setLowerBoundary(nextLower);

        if (nextLower - nextUpper > 1) {
          setIndex(Math.floor((nextUpper + nextLower) / 2));
          return;
        }

        setPhase("confirmation");
        setConfirmationCandidate(nextUpper);
        setIndex(nextUpper);
        return;
      }

      // Phase 1: Fast Jump / Fine Search
      if (nextCorrect === 2) {
        const priorOutcome = lastOutcome;
        setLastPassedIndex(index);

        // Best line (20/20): always enter confirmation — no higher level exists.
        if (index >= MAX_ACUITY_INDEX) {
          setPhase("confirmation");
          setConfirmationCandidate(MAX_ACUITY_INDEX);
          setIndex(MAX_ACUITY_INDEX);
          setLastOutcome("pass");
          return;
        }

        if (priorOutcome === "fail") {
          const boundaryUpper = index;
          const boundaryLower = firstFailedIndex ?? clampIndex(index + 1);
          setUpperBoundary(boundaryUpper);
          setLowerBoundary(boundaryLower);
          if (
            boundaryLower !== boundaryUpper &&
            levelsExploredCount >= MIN_LEVELS_EXPLORED &&
            boundaryUpper < boundaryLower
          ) {
            setPhase("bracketing");
            setIndex(Math.floor((boundaryUpper + boundaryLower) / 2));
            setLastOutcome("pass");
            return;
          }
        }
        setLastOutcome("pass");
        const moveBy = clampIndex(index + stepSize);
        setIndex(moveBy);
        setStepSize((prev) => Math.max(1, prev - 1));
        return;
      }

      if (nextCorrect === 0) {
        const priorOutcome = lastOutcome;

        // Easiest line (20/200): cannot show a larger optotype — finalize at floor.
        if (index <= 0) {
          finishWithPassedIndex(0);
          return;
        }

        if (firstFailedIndex == null) setFirstFailedIndex(index);
        if (priorOutcome === "pass") {
          const boundaryUpper = lastPassedIndex ?? clampIndex(index - 1);
          const boundaryLower = index;
          setUpperBoundary(boundaryUpper);
          setLowerBoundary(boundaryLower);
          if (
            boundaryUpper < boundaryLower &&
            levelsExploredCount >= MIN_LEVELS_EXPLORED
          ) {
            setPhase("bracketing");
            setIndex(Math.floor((boundaryUpper + boundaryLower) / 2));
            setLastOutcome("fail");
            return;
          }
        }
        setLastOutcome("fail");
        const moveBy = clampIndex(index - stepSize);
        setIndex(moveBy);
        setStepSize((prev) => Math.max(1, prev - 1));
        return;
      }

      // 1/2 answers: enter fine search with step=1.
      setStepSize(1);
      const direction = lastOutcome === "fail" ? -1 : 1;
      setIndex(clampIndex(index + direction));
    },
    [
      trialCount,
      correctCount,
      phase,
      index,
      confirmationCandidate,
      upperBoundary,
      lowerBoundary,
      lastPassedIndex,
      firstFailedIndex,
      lastOutcome,
      stepSize,
      clampIndex,
      rememberExplored,
      finishWithPassedIndex,
    ],
  );

  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  const submitLandoltAnswer = useCallback(
    (guessedOctant: number) => {
      if (!inValidFocusRef.current) return;
      if (guessedOctant === landoltOctantRef.current) {
        setWrongSwipe(false);
        handleAnswer(true);
      } else {
        setWrongSwipe(true);
        setTimeout(() => setWrongSwipe(false), 420);
        handleAnswer(false);
      }
    },
    [handleAnswer],
  );

  const onLandoltSwipeEnd = useCallback(
    (dx: number, dy: number) => {
      if (!inValidFocusRef.current) return;
      if (Math.hypot(dx, dy) < SWIPE_MIN_DISTANCE_PX) return;
      const guessed = angleToOctant(dx, dy);
      submitLandoltAnswer(guessed);
    },
    [submitLandoltAnswer],
  );

  const pendingEyeLabel = useMemo(() => {
    if (pendingEye === "right") return t("nearVision.rightEye");
    if (pendingEye === "left") return t("nearVision.leftEye");
    return t("nearVision.bothEyes");
  }, [pendingEye, t]);

  const pendingEyeInstruction = useMemo(() => {
    const cm = NEAR_VISION_TARGET_CM;
    if (pendingEye === "right")
      return t("nearVision.pendingInstructionRight", { cm });
    if (pendingEye === "left")
      return t("nearVision.pendingInstructionLeft", { cm });
    return t("nearVision.pendingInstructionBoth", { cm });
  }, [pendingEye, t]);

  useEffect(() => {
    if (step !== "results") return;
    if (!rightResult && !leftResult && !bothResult) return;
    const capturedAt = new Date().toISOString();
    void (async () => {
      try {
        await uploadNearVisionResults({
          right: rightResult,
          left: leftResult,
          both: bothResult,
          capturedAt,
        });
      } catch (error) {
        console.warn(
          "[near-vision] Failed to upload results",
          error instanceof Error ? error.message : error,
        );
      }
    })();
  }, [step, rightResult, leftResult, bothResult]);

  return {
    step,
    setStep,
    correctionScale,
    referenceBarPx,
    adjustCalibration,

    liveDistanceCm,
    handleLiveDistance,
    inValidFocusRange,

    landoltSizePx,
    landoltRotationDeg,
    landoltRotateProgress,
    landoltRotateSecondsRemaining,
    wrongSwipe,
    onLandoltSwipeEnd,
    submitLandoltAnswer,

    pendingEyeLabel,
    pendingEyeInstruction,
    activeEye: eye,
    startPendingEye,
    beginTestFlow,

    rightResult,
    leftResult,
    bothResult,
  };
}
