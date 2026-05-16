import * as Device from 'expo-device';

/**
 * When true, Continue with Google skips the OAuth browser and uses the fixed Supabase Auth user id
 * (see onboarding-storage). Physical devices use real OAuth unless EXPO_PUBLIC_SIMULATE_GOOGLE_ONBOARDING=true.
 *
 * Explicit env overrides:
 * - "true"/"1" → always simulate
 * - "false"/"0" → never simulate
 * - unset → simulate on simulator/emulator (`!Device.isDevice`)
 */
export function shouldSimulateGoogleOnboarding(): boolean {
  const v = process.env.EXPO_PUBLIC_SIMULATE_GOOGLE_ONBOARDING?.toLowerCase()?.trim();
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return !Device.isDevice;
}
