import type { NearVisionHistoryEntry } from "@/lib/vision/near-vision-storage";

/**
 * Temporary sample history for Scan graph UI.
 * Replace/remove once enough real user history exists.
 */
export const NEAR_VISION_HISTORY_MOCK: NearVisionHistoryEntry[] = [
  {
    savedAt: "2026-04-12T09:10:00.000Z",
    nSize: 12,
    approxSnellen: "20/50",
    both: { nSize: 12, approxSnellen: "20/50" },
    right: { nSize: 12, approxSnellen: "20/50" },
    left: { nSize: 15, approxSnellen: "20/63" },
  },
  {
    savedAt: "2026-04-13T09:10:00.000Z",
    nSize: 12,
    approxSnellen: "20/50",
    both: { nSize: 12, approxSnellen: "20/50" },
    right: { nSize: 12, approxSnellen: "20/50" },
    left: { nSize: 15, approxSnellen: "20/63" },
  },
  {
    savedAt: "2026-04-14T09:10:00.000Z",
    nSize: 10,
    approxSnellen: "20/40",
    both: { nSize: 10, approxSnellen: "20/40" },
    right: { nSize: 10, approxSnellen: "20/40" },
    left: { nSize: 12, approxSnellen: "20/50" },
  },
  {
    savedAt: "2026-04-16T09:10:00.000Z",
    nSize: 10,
    approxSnellen: "20/40",
    both: { nSize: 10, approxSnellen: "20/40" },
    right: { nSize: 10, approxSnellen: "20/40" },
    left: { nSize: 12, approxSnellen: "20/50" },
  },
  {
    savedAt: "2026-04-18T09:10:00.000Z",
    nSize: 8,
    approxSnellen: "20/32",
    both: { nSize: 8, approxSnellen: "20/32" },
    right: { nSize: 8, approxSnellen: "20/32" },
    left: { nSize: 10, approxSnellen: "20/40" },
  },
  {
    savedAt: "2026-04-20T09:10:00.000Z",
    nSize: 8,
    approxSnellen: "20/32",
    both: { nSize: 8, approxSnellen: "20/32" },
    right: { nSize: 8, approxSnellen: "20/32" },
    left: { nSize: 10, approxSnellen: "20/40" },
  },
  {
    savedAt: "2026-04-22T09:10:00.000Z",
    nSize: 6,
    approxSnellen: "20/25",
    both: { nSize: 6, approxSnellen: "20/25" },
    right: { nSize: 6, approxSnellen: "20/25" },
    left: { nSize: 8, approxSnellen: "20/32" },
  },
  {
    savedAt: "2026-04-24T09:10:00.000Z",
    nSize: 6,
    approxSnellen: "20/25",
    both: { nSize: 6, approxSnellen: "20/25" },
    right: { nSize: 6, approxSnellen: "20/25" },
    left: { nSize: 8, approxSnellen: "20/32" },
  },
  {
    savedAt: "2026-04-26T09:10:00.000Z",
    nSize: 5,
    approxSnellen: "20/20",
    both: { nSize: 5, approxSnellen: "20/20" },
    right: { nSize: 5, approxSnellen: "20/20" },
    left: { nSize: 6, approxSnellen: "20/25" },
  },
];

export function resolveNearVisionGraphHistory(
  realHistory: NearVisionHistoryEntry[],
): NearVisionHistoryEntry[] {
  return realHistory.length > 0 ? realHistory : NEAR_VISION_HISTORY_MOCK;
}
