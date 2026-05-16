const parsePositiveFloat = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const NEAR_VISION_TARGET_CM = parsePositiveFloat(
  process.env.EXPO_PUBLIC_NEAR_VISION_TARGET_CM,
  40,
);

export const NEAR_VISION_TOLERANCE_CM = parsePositiveFloat(
  process.env.EXPO_PUBLIC_NEAR_VISION_TOLERANCE_CM,
  4,
);

export const isWithinFocusRange = (distanceCm: number): boolean =>
  Math.abs(distanceCm - NEAR_VISION_TARGET_CM) <= NEAR_VISION_TOLERANCE_CM;
