import { supabase } from "@/lib/supabase/client";
import {
  getBackendUrl,
  resolveBackendUrlForDevice,
} from "@/lib/network/backend-origin";
import type {
  NearVisionHistoryEntry,
  NearVisionSavedResult,
} from "@/lib/vision/near-vision-storage";
import type { NearAcuityResult } from "@/lib/vision/snellen";
import { SNELLEN_TO_DECIMAL } from "@/lib/vision/snellen";

export type NearVisionUploadPayload = {
  right: NearAcuityResult | null;
  left: NearAcuityResult | null;
  both: NearAcuityResult | null;
  capturedAt?: string;
};

type NearVisionUploadResponse = {
  ok: boolean;
  error?: string;
};

type NearVisionHistoryApiRow = {
  captured_at: string;
  right_result?: Pick<NearAcuityResult, "nSize" | "approxSnellen"> | null;
  left_result?: Pick<NearAcuityResult, "nSize" | "approxSnellen"> | null;
  both_result?: Pick<NearAcuityResult, "nSize" | "approxSnellen"> | null;
};

type NearVisionHistoryResponse = {
  ok: boolean;
  data?: NearVisionHistoryApiRow[];
  error?: string;
};

export type NearVisionInsight = {
  title: string;
  body: string;
  sampleCount: number;
  periodDays: number;
  generatedAt: string;
};

type NearVisionInsightResponse = {
  ok: boolean;
  data?: NearVisionInsight;
  error?: string;
};

export function getNearVisionResultsUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_NEAR_VISION_RESULTS_URL?.trim();
  if (fromEnv) return resolveBackendUrlForDevice(fromEnv);
  return getBackendUrl("/vision/near-results");
}

function eyeResultFromHistoryPartial(
  partial: Pick<NearAcuityResult, "nSize" | "approxSnellen"> | null | undefined,
  eye: "right" | "left" | "both",
): NearAcuityResult | null {
  if (
    !partial ||
    typeof partial.nSize !== "number" ||
    typeof partial.approxSnellen !== "string"
  ) {
    return null;
  }
  const decimalAcuity = SNELLEN_TO_DECIMAL[partial.approxSnellen];
  return {
    eye,
    nSize: partial.nSize,
    approxSnellen: partial.approxSnellen,
    ...(decimalAcuity != null ? { decimalAcuity } : {}),
  };
}

/** Latest completed test from a chronological history list (oldest → newest). */
export function latestNearVisionSavedResultFromHistory(
  entries: NearVisionHistoryEntry[],
): NearVisionSavedResult | null {
  if (entries.length === 0) return null;
  const last = entries[entries.length - 1];
  return {
    savedAt: last.savedAt,
    right: eyeResultFromHistoryPartial(last.right, "right"),
    left: eyeResultFromHistoryPartial(last.left, "left"),
    both: eyeResultFromHistoryPartial(last.both, "both"),
  };
}

function normalizeHistoryRow(row: NearVisionHistoryApiRow): NearVisionHistoryEntry | null {
  const savedAt = typeof row.captured_at === "string" ? row.captured_at : "";
  const both = row.both_result ?? null;
  const right = row.right_result ?? null;
  const left = row.left_result ?? null;
  const representative = both ?? right ?? left;
  if (!savedAt || !representative) return null;
  if (
    typeof representative.nSize !== "number" ||
    typeof representative.approxSnellen !== "string"
  ) {
    return null;
  }
  return {
    savedAt,
    nSize: representative.nSize,
    approxSnellen: representative.approxSnellen,
    both:
      both &&
      typeof both.nSize === "number" &&
      typeof both.approxSnellen === "string"
        ? { nSize: both.nSize, approxSnellen: both.approxSnellen }
        : null,
    right:
      right &&
      typeof right.nSize === "number" &&
      typeof right.approxSnellen === "string"
        ? { nSize: right.nSize, approxSnellen: right.approxSnellen }
        : null,
    left:
      left &&
      typeof left.nSize === "number" &&
      typeof left.approxSnellen === "string"
        ? { nSize: left.nSize, approxSnellen: left.approxSnellen }
        : null,
  };
}

export async function uploadNearVisionResults(
  payload: NearVisionUploadPayload,
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  const url = getNearVisionResultsUrl();

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        right: payload.right,
        left: payload.left,
        both: payload.both,
        capturedAt: payload.capturedAt ?? new Date().toISOString(),
      }),
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? `: ${error.message}` : "";
    throw new Error(`Near vision upload network error (${url})${detail}`);
  }

  if (!response.ok) {
    let message = `Near vision upload failed (${response.status})`;
    try {
      const body = (await response.json()) as NearVisionUploadResponse;
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      // keep default message when response is not JSON
    }
    throw new Error(message);
  }
}

export async function fetchNearVisionHistory(
  limit = 120,
): Promise<NearVisionHistoryEntry[]> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return [];

  const url = `${getNearVisionResultsUrl()}?limit=${Math.max(1, Math.floor(limit))}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? `: ${error.message}` : "";
    throw new Error(`Near vision history network error (${url})${detail}`);
  }

  if (!response.ok) {
    let message = `Near vision history fetch failed (${response.status})`;
    try {
      const body = (await response.json()) as NearVisionHistoryResponse;
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      // keep default message when response is not JSON
    }
    throw new Error(message);
  }

  const body = (await response.json()) as NearVisionHistoryResponse;
  if (!Array.isArray(body.data)) return [];
  return body.data
    .map(normalizeHistoryRow)
    .filter((entry): entry is NearVisionHistoryEntry => entry != null)
    .slice(-Math.max(1, Math.floor(limit)));
}

export async function fetchNearVisionInsight(days = 30, locale?: string): Promise<NearVisionInsight | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  const params = new URLSearchParams({
    days: String(Math.max(1, Math.floor(days))),
  });
  if (locale && locale.trim()) {
    params.set("locale", locale.trim());
  }

  const url = `${getNearVisionResultsUrl()}/insight?${params.toString()}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? `: ${error.message}` : "";
    throw new Error(`Near vision insight network error (${url})${detail}`);
  }

  if (!response.ok) {
    let message = `Near vision insight fetch failed (${response.status})`;
    try {
      const body = (await response.json()) as NearVisionInsightResponse;
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      // keep default message when response is not JSON
    }
    throw new Error(message);
  }

  const body = (await response.json()) as NearVisionInsightResponse;
  if (!body.data) return null;
  const { title, body: insightBody, sampleCount, periodDays, generatedAt } = body.data;
  if (
    typeof title !== "string" ||
    typeof insightBody !== "string" ||
    typeof sampleCount !== "number" ||
    typeof periodDays !== "number" ||
    typeof generatedAt !== "string"
  ) {
    return null;
  }
  return { title, body: insightBody, sampleCount, periodDays, generatedAt };
}
