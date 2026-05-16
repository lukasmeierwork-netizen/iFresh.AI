/**
 * Runtime check for whether `react-native-vision-camera` (and its sibling
 * native modules) can be loaded in the current runtime.
 *
 * Reason: Vision Camera throws synchronously at module load when the
 * native pod isn't linked — e.g. running in Expo Go, or an iOS simulator
 * build that didn't include the prebuild pods. A top-level `import` in
 * that situation brings the whole JS bundle down before the root layout
 * can even export its default component.
 *
 * Wrapping a `require` in try/catch lets us detect that case once, cache
 * the result, and fall back to a no-op monitor when the module is absent.
 * On a proper dev-client / release build this returns `true` and the
 * real camera pipeline runs as usual.
 */

let cached: boolean | null = null;

export function isVisionCameraAvailable(): boolean {
  if (cached !== null) return cached;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-vision-camera');
    cached = Boolean(mod?.Camera);
  } catch {
    cached = false;
  }

  return cached;
}
