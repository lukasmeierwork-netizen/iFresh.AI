/**
 * Pinhole-camera distance estimator.
 *
 * Given the pixel width of a detected face within a camera frame, the
 * frame's horizontal resolution, and the camera's horizontal field of
 * view, compute approximate eye-to-camera distance in centimetres.
 *
 * Default face width (140 mm) is a population median and is accurate to
 * roughly +-10-15 % without a per-user calibration step.
 */

const DEFAULT_FACE_WIDTH_MM = 140;
const DEFAULT_HORIZONTAL_FOV_DEG = 60;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function estimateDistanceCm(params: {
  faceWidthPx: number;
  frameWidthPx: number;
  assumedFaceWidthMm?: number;
  horizontalFovDeg?: number;
}): number {
  const assumedFaceWidthMm = params.assumedFaceWidthMm ?? DEFAULT_FACE_WIDTH_MM;
  const fovDeg = clamp(
    params.horizontalFovDeg ?? DEFAULT_HORIZONTAL_FOV_DEG,
    35,
    95
  );

  const faceWidthPx = Math.max(1, params.faceWidthPx);
  const frameWidthPx = Math.max(1, params.frameWidthPx);

  const fovRad = (fovDeg * Math.PI) / 180;
  const focalLengthPx = frameWidthPx / 2 / Math.tan(fovRad / 2);
  const distanceMm = (assumedFaceWidthMm * focalLengthPx) / faceWidthPx;
  return distanceMm / 10;
}
