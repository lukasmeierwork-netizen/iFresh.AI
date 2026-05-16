/** Animation durations (ms) for the Landolt overlay enter/exit. */
export const LANDOLT_ENTER_MS = 360;
export const LANDOLT_EXIT_MS = 200;

/** Minimum swipe length (px) to count as a direction answer. */
export const SWIPE_MIN_DISTANCE_PX = 28;

/**
 * Trials per line size. We score performance across multiple attempts and only
 * decide pass/fail (and final acuity) once enough evidence is collected.
 */
export const TRIALS_PER_SIZE = 3;
export const MIN_CORRECT_TO_PASS = 2;

/** Random Landolt gap direction (8 orientations). Optionally avoid repeating the previous octant. */
export function randomLandoltOctant(exclude?: number): number {
  if (exclude === undefined) {
    return Math.floor(Math.random() * 8);
  }
  const next = Math.floor(Math.random() * 8);
  return next !== exclude ? next : (exclude + 1) % 8;
}

/** Map drag vector (screen coords, +y down) to one of 8 octants: 0 = E, 1 = SE, … 7 = NE. */
export function angleToOctant(dx: number, dy: number): number {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const normalized = ((deg % 360) + 360) % 360;
  return Math.floor((normalized + 22.5) / 45) % 8;
}
