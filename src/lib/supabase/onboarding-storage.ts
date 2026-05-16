import type { PostgrestError } from '@supabase/supabase-js';

import type { OnboardingDraft } from '@/lib/onboarding/types';

import { supabase } from './client';

export type UpsertOnboardingResult =
  | { ok: true }
  | { ok: false; error: PostgrestError };

export type OnboardingCompletionResult =
  | { ok: true; completed: boolean }
  | { ok: false; error: PostgrestError };

/** Row shape for `public.onboarding` (snake_case). */
export type OnboardingTableRow = {
  user_id: string;
  language: OnboardingDraft['language'] | null;
  screen_time: OnboardingDraft['screenTime'] | null;
  source: OnboardingDraft['source'] | null;
  tried_eyesight_app: OnboardingDraft['triedEyesightApp'] | null;
  age: OnboardingDraft['age'] | null;
  wears_glasses: OnboardingDraft['wearsGlasses'] | null;
  vision_result_format: OnboardingDraft['visionResultFormat'] | null;
  camera_permission_granted: OnboardingDraft['cameraPermissionGranted'] | null;
  rating: OnboardingDraft['rating'] | null;
  calibrate: OnboardingDraft['calibrate'] | null;
  paywall_flow_completed: boolean;
  updated_at: string;
};

function draftToRow(userId: string, draft: OnboardingDraft): OnboardingTableRow {
  return {
    user_id: userId,
    language: draft.language ?? null,
    screen_time: draft.screenTime ?? null,
    source: draft.source ?? null,
    tried_eyesight_app: draft.triedEyesightApp ?? null,
    age: draft.age ?? null,
    wears_glasses: draft.wearsGlasses ?? null,
    vision_result_format: draft.visionResultFormat ?? null,
    camera_permission_granted: draft.cameraPermissionGranted ?? null,
    rating: draft.rating ?? null,
    calibrate: draft.calibrate ?? null,
    paywall_flow_completed: false,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Persist onboarding draft for a user row. Caller supplies `userId` — must match RLS policies
 * (authenticated session uid).
 */
export async function upsertOnboardingForUser(
  userId: string,
  draft: OnboardingDraft
): Promise<UpsertOnboardingResult> {
  const { error } = await supabase
    .from('onboarding')
    .upsert(draftToRow(userId, draft), { onConflict: 'user_id' });

  if (error) return { ok: false, error };
  return { ok: true };
}

/**
 * Onboarding is considered complete once paywall onboarding flow is finished.
 */
export async function getOnboardingCompletionForUser(
  userId: string
): Promise<OnboardingCompletionResult> {
  const { data, error } = await supabase
    .from('onboarding')
    .select('paywall_flow_completed')
    .eq('user_id', userId)
    .maybeSingle<{
      paywall_flow_completed: boolean | null;
    }>();

  if (error) return { ok: false, error };
  const done = data?.paywall_flow_completed === true;
  return { ok: true, completed: done };
}

export async function markOnboardingPaywallCompletedForUser(
  userId: string
): Promise<UpsertOnboardingResult> {
  const patch: { paywall_flow_completed: boolean } = {
    paywall_flow_completed: true,
  };

  const { error } = await supabase.from('onboarding').update(patch).eq('user_id', userId);
  if (error) return { ok: false, error };
  return { ok: true };
}

/** Subset of `public.onboarding` updated when the user changes matching Settings. */
export type OnboardingSettingsColumnsPatch = Partial<{
  language: OnboardingDraft['language'];
  vision_result_format: OnboardingDraft['visionResultFormat'];
  camera_permission_granted: OnboardingDraft['cameraPermissionGranted'];
  calibrate: OnboardingDraft['calibrate'];
}>;

/**
 * Partial update for onboarding preferences mirrored from Settings (does not touch
 * `paywall_flow_completed` or other survey fields). No-op if `patch` is empty.
 */
export async function patchOnboardingColumnsForUser(
  userId: string,
  patch: OnboardingSettingsColumnsPatch
): Promise<UpsertOnboardingResult> {
  const payload: Record<string, unknown> = { ...patch };
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  }
  if (Object.keys(payload).length === 0) {
    return { ok: true };
  }
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase.from('onboarding').update(payload).eq('user_id', userId);
  if (error) return { ok: false, error };
  return { ok: true };
}
