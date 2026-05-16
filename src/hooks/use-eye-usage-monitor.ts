import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  Camera,
  runAtTargetFps,
  Templates,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
  type CameraDeviceFormat,
  type CameraPermissionStatus,
} from "react-native-vision-camera";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

import {
  createBlinkDetectorState,
  ingestBlinkSample,
  type BlinkDetectorState,
} from "@/lib/usage/blink-detector";
import {
  createContinuousUseState,
  ingestPresenceSample,
  type ContinuousUseState,
} from "@/lib/usage/continuous-use-tracker";
import {
  resolveDeviceCapability,
  type DeviceCapability,
} from "@/lib/usage/device-capability";
import { estimateDistanceCm } from "@/lib/usage/distance-estimator";
import {
  createDistanceSmootherState,
  ingestDistanceSample,
  type DistanceSmootherState,
} from "@/lib/usage/distance-smoother";
import { getUsageSnapshot, updateUsage } from "@/lib/usage/usage-store";
import { useUsageField } from "@/hooks/use-usage-store";

type FrameSample = {
  faceWidthPx: number;
  frameWidthPx: number;
  eyesOpenProbability: number | null;
  leftEyeOpenProbability: number | null;
  rightEyeOpenProbability: number | null;
  timestampMs: number;
};

type EyeCoverState = "leftCovered" | "rightCovered" | "neither" | "unknown";

type MonitorDeps = {
  device: ReturnType<typeof useCameraDevice>;
  /** Stream format whose `fieldOfView` matches distance math; pass to `<Camera format={...} />`. */
  format: CameraDeviceFormat | undefined;
  frameProcessor: ReturnType<typeof useFrameProcessor> | undefined;
  isActive: boolean;
  permission: CameraPermissionStatus;
  capability: DeviceCapability;
};

/**
 * Drives the app-wide eye-usage monitor: owns the hidden front camera,
 * requests permission once, feeds frames into the derivers, and writes
 * the results into the shared usage store.
 *
 * The hook must be mounted exactly once (see `UsageMonitorRoot`). The
 * returned object is for the mount component to render the camera.
 */
export function useEyeUsageMonitor(): MonitorDeps {
  const monitoringEnabled = useUsageField("monitoringEnabled");
  const monitoringPaused = useUsageField("monitoringPaused");
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const [permission, setPermission] =
    useState<CameraPermissionStatus>("not-determined");

  const capability = useMemo(() => resolveDeviceCapability(), []);
  const device = useCameraDevice("front");
  const format = useCameraFormat(device, Templates.FrameProcessing);
  const horizontalFovDegRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const v = format?.fieldOfView;
    horizontalFovDegRef.current =
      typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
  }, [format]);

  const distanceRef = useRef<DistanceSmootherState>(
    createDistanceSmootherState(),
  );
  const blinkRef = useRef<BlinkDetectorState>(createBlinkDetectorState());
  const continuousRef = useRef<ContinuousUseState>(createContinuousUseState());
  const faceMissingSinceRef = useRef<number | null>(null);
  const eyeCoverVotesRef = useRef<Record<EyeCoverState, number>>({
    leftCovered: 0,
    rightCovered: 0,
    neither: 0,
    unknown: 0,
  });
  const eyeCoverStableRef = useRef<EyeCoverState>("unknown");
  const leftLowSinceRef = useRef<number | null>(null);
  const rightLowSinceRef = useRef<number | null>(null);
  const bothOpenSinceRef = useRef<number | null>(null);

  const isActive =
    monitoringEnabled &&
    !monitoringPaused &&
    appState === "active" &&
    permission === "granted";

  const faceDetectorOptions = useMemo(
    () =>
      ({
        performanceMode: "fast",
        landmarkMode: "none",
        contourMode: "none",
        classificationMode: capability.enableBlinkClassification
          ? "all"
          : "none",
        minFaceSize: 0.2,
      }) as const,
    [capability.enableBlinkClassification],
  );
  const { detectFaces } = useFaceDetector(faceDetectorOptions);

  const onSampleRef = useRef<(sample: FrameSample) => void>(() => {});
  onSampleRef.current = (sample: FrameSample) => {
    const {
      faceWidthPx,
      frameWidthPx,
      eyesOpenProbability,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
      timestampMs,
    } = sample;
    const faceVisible = faceWidthPx > 0 && frameWidthPx > 0;
    // Eye-open probabilities are noisy by device/lighting.
    // Use softer thresholds so monocular tests do not require "barely open" eyes.
    const OPEN_EYE_THRESHOLD = 0.3;
    const COVERED_EYE_MAX_THRESHOLD = 0.58;
    const EYE_GAP_THRESHOLD = 0.14;
    const BOTH_EYES_DIFF_MAX = 0.22;
    const COVER_HOLD_MS = 320;
    const BOTH_OPEN_HOLD_MS = 160;

    const resolveInstantEyeCoverState = (): EyeCoverState => {
      if (!faceVisible) return "unknown";

      // Missing one eye probability is a strong signal of occlusion.
      if (leftEyeOpenProbability == null && rightEyeOpenProbability != null) {
        return rightEyeOpenProbability >= OPEN_EYE_THRESHOLD
          ? "leftCovered"
          : "unknown";
      }
      if (rightEyeOpenProbability == null && leftEyeOpenProbability != null) {
        return leftEyeOpenProbability >= OPEN_EYE_THRESHOLD
          ? "rightCovered"
          : "unknown";
      }
      if (leftEyeOpenProbability == null || rightEyeOpenProbability == null) {
        return "unknown";
      }

      const left = leftEyeOpenProbability;
      const right = rightEyeOpenProbability;
      const leftOpen = left >= OPEN_EYE_THRESHOLD;
      const rightOpen = right >= OPEN_EYE_THRESHOLD;
      const leftLikelyCovered = left <= COVERED_EYE_MAX_THRESHOLD;
      const rightLikelyCovered = right <= COVERED_EYE_MAX_THRESHOLD;
      const leftCoverCandidate =
        leftLikelyCovered && rightOpen && right - left >= EYE_GAP_THRESHOLD;
      const rightCoverCandidate =
        rightLikelyCovered && leftOpen && left - right >= EYE_GAP_THRESHOLD;
      const bothOpenCandidate =
        leftOpen && rightOpen && Math.abs(left - right) <= BOTH_EYES_DIFF_MAX;

      if (leftCoverCandidate) {
        if (leftLowSinceRef.current == null)
          leftLowSinceRef.current = timestampMs;
      } else {
        leftLowSinceRef.current = null;
      }

      if (rightCoverCandidate) {
        if (rightLowSinceRef.current == null)
          rightLowSinceRef.current = timestampMs;
      } else {
        rightLowSinceRef.current = null;
      }

      if (bothOpenCandidate) {
        if (bothOpenSinceRef.current == null)
          bothOpenSinceRef.current = timestampMs;
      } else {
        bothOpenSinceRef.current = null;
      }

      if (
        leftLowSinceRef.current != null &&
        timestampMs - leftLowSinceRef.current >= COVER_HOLD_MS
      ) {
        return "leftCovered";
      }
      if (
        rightLowSinceRef.current != null &&
        timestampMs - rightLowSinceRef.current >= COVER_HOLD_MS
      ) {
        return "rightCovered";
      }
      if (
        bothOpenSinceRef.current != null &&
        timestampMs - bothOpenSinceRef.current >= BOTH_OPEN_HOLD_MS
      ) {
        return "neither";
      }

      // Fallback asymmetric rule when classifier hovers around thresholds.
      if (left + EYE_GAP_THRESHOLD < right && rightOpen) return "leftCovered";
      if (right + EYE_GAP_THRESHOLD < left && leftOpen) return "rightCovered";
      return "unknown";
    };

    const instantEyeCoverState = resolveInstantEyeCoverState();
    const votes = eyeCoverVotesRef.current;
    const allStates: EyeCoverState[] = [
      "leftCovered",
      "rightCovered",
      "neither",
      "unknown",
    ];
    for (const state of allStates) {
      if (state === instantEyeCoverState) {
        votes[state] = Math.min(8, votes[state] + 2);
      } else {
        votes[state] = Math.max(0, votes[state] - 1);
      }
    }
    const stabilized = allStates.reduce(
      (best, state) => (votes[state] > votes[best] ? state : best),
      eyeCoverStableRef.current,
    );
    const eyeCoverState =
      votes[stabilized] >= 4 ? stabilized : eyeCoverStableRef.current;
    eyeCoverStableRef.current = eyeCoverState;

    let nextDistanceCm: number | null = null;
    if (faceVisible) {
      const fov = horizontalFovDegRef.current;
      const raw = estimateDistanceCm({
        faceWidthPx,
        frameWidthPx,
        ...(fov != null ? { horizontalFovDeg: fov } : {}),
      });
      const { next, medianCm } = ingestDistanceSample(distanceRef.current, raw);
      distanceRef.current = next;
      nextDistanceCm = medianCm;
      faceMissingSinceRef.current = null;
    } else {
      if (faceMissingSinceRef.current == null) {
        faceMissingSinceRef.current = timestampMs;
      }
      distanceRef.current = createDistanceSmootherState();
    }

    let nextBlinkRate: number | null = getUsageSnapshot().blinkRate;
    if (eyesOpenProbability != null && faceVisible) {
      const { next, blinksPerMinute } = ingestBlinkSample(
        blinkRef.current,
        eyesOpenProbability,
        timestampMs,
      );
      blinkRef.current = next;
      if (blinksPerMinute != null) nextBlinkRate = blinksPerMinute;
    }

    const { next: nextContinuous, continuousMinutes } = ingestPresenceSample(
      continuousRef.current,
      faceVisible,
      timestampMs,
    );
    continuousRef.current = nextContinuous;

    updateUsage({
      distanceCm: nextDistanceCm,
      blinkRate: nextBlinkRate,
      continuousMinutes,
      faceVisible,
      eyeCoverState,
      lastUpdatedAt: timestampMs,
    });
  };

  const setSampleOnJS = useMemo(
    () =>
      Worklets.createRunOnJS((sample: FrameSample) =>
        onSampleRef.current(sample),
      ),
    [],
  );

  const targetFps = capability.targetFps;
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      runAtTargetFps(targetFps, () => {
        "worklet";
        const faces = detectFaces(frame) || [];
        const frameWidthPx = (frame as any).width ?? 0;
        if (!faces.length) {
          setSampleOnJS({
            faceWidthPx: 0,
            frameWidthPx,
            eyesOpenProbability: null,
            leftEyeOpenProbability: null,
            rightEyeOpenProbability: null,
            timestampMs: Date.now(),
          });
          return;
        }
        const face = faces[0] as any;
        const bounds = face?.bounds ?? face?.boundingBox ?? null;
        const faceWidthPx = bounds?.width ?? 0;
        // Front camera preview and ML labels can be mirrored relative to user-facing
        // instructions. Swap eye probabilities so "leftCovered/rightCovered" map to
        // the user's own left/right eye in the near-vision flow.
        const leftEye =
          typeof face?.rightEyeOpenProbability === "number"
            ? face.rightEyeOpenProbability
            : null;
        const rightEye =
          typeof face?.leftEyeOpenProbability === "number"
            ? face.leftEyeOpenProbability
            : null;

        let eyesOpenProbability: number | null = null;
        if (leftEye != null && rightEye != null) {
          eyesOpenProbability = (leftEye + rightEye) / 2;
        } else if (leftEye != null) {
          eyesOpenProbability = leftEye;
        } else if (rightEye != null) {
          eyesOpenProbability = rightEye;
        }

        setSampleOnJS({
          faceWidthPx,
          frameWidthPx,
          eyesOpenProbability,
          leftEyeOpenProbability: leftEye,
          rightEyeOpenProbability: rightEye,
          timestampMs: Date.now(),
        });
      });
    },
    [detectFaces, setSampleOnJS, targetFps],
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const current = await Camera.getCameraPermissionStatus();
        if (cancelled) return;
        setPermission(current);
        if (!monitoringEnabled) return;
        if (current !== "granted") {
          const next = await Camera.requestCameraPermission();
          if (cancelled) return;
          setPermission(next);
        }
      } catch {
        if (cancelled) return;
        setPermission("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monitoringEnabled]);

  useEffect(() => {
    if (isActive) return;
    distanceRef.current = createDistanceSmootherState();
    blinkRef.current = createBlinkDetectorState();
    continuousRef.current = createContinuousUseState();
    faceMissingSinceRef.current = null;
    eyeCoverVotesRef.current = {
      leftCovered: 0,
      rightCovered: 0,
      neither: 0,
      unknown: 0,
    };
    eyeCoverStableRef.current = "unknown";
    leftLowSinceRef.current = null;
    rightLowSinceRef.current = null;
    bothOpenSinceRef.current = null;
    updateUsage({
      distanceCm: null,
      blinkRate: null,
      continuousMinutes: 0,
      faceVisible: false,
      eyeCoverState: "unknown",
    });
  }, [isActive]);

  return {
    device,
    format,
    frameProcessor: isActive ? frameProcessor : undefined,
    isActive,
    permission,
    capability,
  };
}
