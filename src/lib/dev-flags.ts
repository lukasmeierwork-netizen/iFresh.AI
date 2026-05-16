/**
 * Set `EXPO_PUBLIC_DEV_SKIP_ONBOARDING=1` in `.env.local` (dev builds only).
 * Disables the unauthenticated → onboarding redirect so you can open the app on
 * main tabs without signing in. Must be combined with `__DEV__` — never active in
 * production bundles.
 */
export const isDevSkipOnboarding =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_SKIP_ONBOARDING === '1';
