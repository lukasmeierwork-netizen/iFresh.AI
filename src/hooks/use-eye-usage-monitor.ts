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
  createFacePresenceState,
  resolveStableFaceVisible,
  type FacePresenceState,
} from "@/lib/usage/face-presence";
import {
  createDistanceSmootherState,
  ingestDistanceSample,
  peekDistanceMedian,
  type DistanceSmootherState,
} from "@/lib/usage/distance-smoother";
import {
  classifyEyeCoverInstant,
  createEyeCoverTimingState,
  createEyeCoverVoteState,
  isHandEyePatchActive,
  stabilizeEyeCoverState,
  type EyeCoverState,
} from "@/lib/usage/eye-cover-classifier";
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

const FACE_WIDTH_WINDOW = 8;

function medianOf(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

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
  const eyeCoverVotesRef = useRef(createEyeCoverVoteState());
  const eyeCoverStableRef = useRef<EyeCoverState>("unknown");
  const eyeCoverTimingRef = useRef(createEyeCoverTimingState());
  const faceWidthSamplesRef = useRef<number[]>([]);
  const wasHandPatchingRef = useRef(false);
  const facePresenceRef = useRef<FacePresenceState>(createFacePresenceState());

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
    const rawFaceDetected = faceWidthPx > 0 && frameWidthPx > 0;
    const hasEyeSignal =
      leftEyeOpenProbability != null || rightEyeOpenProbability != null;

    const handPatchActiveFromCover =
      isHandEyePatchActive(eyeCoverStableRef.current) ||
      (hasEyeSignal &&
        (leftEyeOpenProbability == null || rightEyeOpenProbability == null));

    const { faceVisible: stableFaceVisible, next: nextFacePresence } =
      resolveStableFaceVisible({
        prev: facePresenceRef.current,
        rawFaceDetected,
        timestampMs,
        handPatchActive: handPatchActiveFromCover,
        hasEyeSignal,
      });
    facePresenceRef.current = nextFacePresence;
    const faceVisible = stableFaceVisible;

    const classifierFacePresent = rawFaceDetected || hasEyeSignal;

    const { state: instantCover, timing: nextTiming } = classifyEyeCoverInstant({
      faceVisible: classifierFacePresent,
      leftEyeOpenProbability,
      rightEyeOpenProbability,
      timestampMs,
      timing: eyeCoverTimingRef.current,
    });
    eyeCoverTimingRef.current = nextTiming;
    const { votes, stable: eyeCoverState } = stabilizeEyeCoverState(
      instantCover,
      eyeCoverVotesRef.current,
      eyeCoverStableRef.current,
    );
    eyeCoverVotesRef.current = votes;
    eyeCoverStableRef.current = eyeCoverState;

    const handPatchActive =
      isHandEyePatchActive(instantCover) ||
      isHandEyePatchActive(eyeCoverState);

    if (handPatchActive && !wasHandPatchingRef.current && rawFaceDetected) {
      if (faceWidthSamplesRef.current.length < 3) {
        faceWidthSamplesRef.current = [faceWidthPx, faceWidthPx, faceWidthPx];
      }
    }
    wasHandPatchingRef.current = handPatchActive;

    const fov = horizontalFovDegRef.current;
    const ingestDistanceFromWidth = (widthPx: number): number => {
      const raw = estimateDistanceCm({
        faceWidthPx: widthPx,
        frameWidthPx,
        ...(fov != null ? { horizontalFovDeg: fov } : {}),
      });
      const { next, medianCm } = ingestDistanceSample(
        distanceRef.current,
        raw,
        { handPatchActive },
      );
      distanceRef.current = next;
      return medianCm;
    };

    let nextDistanceCm: number | null = null;
    if (rawFaceDetected) {
      faceWidthSamplesRef.current =
        faceWidthSamplesRef.current.length >= FACE_WIDTH_WINDOW
          ? [
              ...faceWidthSamplesRef.current.slice(
                faceWidthSamplesRef.current.length - FACE_WIDTH_WINDOW + 1,
              ),
              faceWidthPx,
            ]
          : [...faceWidthSamplesRef.current, faceWidthPx];
      nextDistanceCm = ingestDistanceFromWidth(faceWidthPx);
      faceMissingSinceRef.current = null;
    } else {
      if (faceMissingSinceRef.current == null) {
        faceMissingSinceRef.current = timestampMs;
      }
      const heldFaceWidthPx = medianOf(faceWidthSamplesRef.current);
      if (
        handPatchActive &&
        hasEyeSignal &&
        heldFaceWidthPx != null &&
        heldFaceWidthPx > 0 &&
        frameWidthPx > 0
      ) {
        nextDistanceCm = ingestDistanceFromWidth(heldFaceWidthPx);
      } else if (handPatchActive) {
        nextDistanceCm =
          peekDistanceMedian(distanceRef.current) ??
          getUsageSnapshot().distanceCm;
      } else {
        distanceRef.current = createDistanceSmootherState();
        faceWidthSamplesRef.current = [];
      }
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
      leftEyeOpenProbability,
      rightEyeOpenProbability,
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
    faceWidthSamplesRef.current = [];
    facePresenceRef.current = createFacePresenceState();
    wasHandPatchingRef.current = false;
    blinkRef.current = createBlinkDetectorState();
    continuousRef.current = createContinuousUseState();
    faceMissingSinceRef.current = null;
    eyeCoverVotesRef.current = createEyeCoverVoteState();
    eyeCoverStableRef.current = "unknown";
    eyeCoverTimingRef.current = createEyeCoverTimingState();
    updateUsage({
      distanceCm: null,
      blinkRate: null,
      continuousMinutes: 0,
      faceVisible: false,
      eyeCoverState: "unknown",
      leftEyeOpenProbability: null,
      rightEyeOpenProbability: null,
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
