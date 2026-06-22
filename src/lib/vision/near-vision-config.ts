const parsePositiveFloat = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const NEAR_VISION_TARGET_CM = parsePositiveFloat(
  process.env.EXPO_PUBLIC_NEAR_VISION_TARGET_CM,
  40,
);

/** Tight band to enter “in range” (green). */
export const NEAR_VISION_ENTER_TOLERANCE_CM = parsePositiveFloat(
  process.env.EXPO_PUBLIC_NEAR_VISION_TOLERANCE_CM,
  3,
);

/** Wider band to leave “in range” — reduces flicker when patching one eye. */
export const NEAR_VISION_LEAVE_TOLERANCE_CM = parsePositiveFloat(
  process.env.EXPO_PUBLIC_NEAR_VISION_LEAVE_TOLERANCE_CM,
  6,
);

/** @deprecated Use enter tolerance; kept for imports that expect a single tolerance. */
export const NEAR_VISION_TOLERANCE_CM = NEAR_VISION_ENTER_TOLERANCE_CM;

export const isWithinFocusRange = (distanceCm: number): boolean =>
  Math.abs(distanceCm - NEAR_VISION_TARGET_CM) <= NEAR_VISION_ENTER_TOLERANCE_CM;

export function getFocusRangeBandEnter(): {
  minCm: number;
  maxCm: number;
  targetCm: number;
} {
  return {
    targetCm: NEAR_VISION_TARGET_CM,
    minCm: Math.max(
      1,
      Math.round(NEAR_VISION_TARGET_CM - NEAR_VISION_ENTER_TOLERANCE_CM),
    ),
    maxCm: Math.round(NEAR_VISION_TARGET_CM + NEAR_VISION_ENTER_TOLERANCE_CM),
  };
}

export function getFocusRangeBandLeave(): {
  minCm: number;
  maxCm: number;
  targetCm: number;
} {
  const leave = Math.max(
    NEAR_VISION_LEAVE_TOLERANCE_CM,
    NEAR_VISION_ENTER_TOLERANCE_CM,
  );
  return {
    targetCm: NEAR_VISION_TARGET_CM,
    minCm: Math.max(1, Math.round(NEAR_VISION_TARGET_CM - leave)),
    maxCm: Math.round(NEAR_VISION_TARGET_CM + leave),
  };
}

/** UI label band (leave band = what users see as acceptable while patching). */
export function getFocusRangeBand(): {
  minCm: number;
  maxCm: number;
  targetCm: number;
} {
  return getFocusRangeBandLeave();
}

/** Matches the green zone shown on the near-vision distance gauge (leave band). */
export function isWithinDisplayedFocusRange(
  distanceCm: number | null | undefined,
): boolean {
  if (distanceCm == null || !Number.isFinite(distanceCm)) {
    return false;
  }
  const { minCm, maxCm } = getFocusRangeBandLeave();
  return distanceCm >= minCm && distanceCm <= maxCm;
}
