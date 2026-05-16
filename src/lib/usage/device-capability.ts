import * as Device from 'expo-device';

/**
 * Decide whether the device should run the monitor in "low-power" mode:
 * lower frame rate and blink-classification disabled.
 *
 * We treat anything pre-A13 (iPhone 11, 2019) as low-power. ML Kit face
 * classification is the most expensive part of the pipeline and older
 * chips can't sustain 12 fps with it on without thermal throttling.
 *
 * The detection is best-effort: on emulators or unknown devices we
 * assume the device is capable to preserve the full experience.
 */

const IOS_MIN_FAST_MODEL_CODE = 12; // iPhone12,* = iPhone 11 family (A13)

export type DeviceCapability = {
  lowPower: boolean;
  /** Target frame processor fps. */
  targetFps: number;
  /** Whether to enable blink classifications in the face detector. */
  enableBlinkClassification: boolean;
};

function parseIosMajor(modelId: string | null): number | null {
  if (!modelId) return null;
  const match = modelId.match(/^iPhone(\d+)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function resolveDeviceCapability(): DeviceCapability {
  const osName = Device.osName;
  const modelId = Device.modelId;

  if (osName === 'iOS' || osName === 'iPadOS') {
    const major = parseIosMajor(modelId ?? null);
    if (major != null && major < IOS_MIN_FAST_MODEL_CODE) {
      return { lowPower: true, targetFps: 8, enableBlinkClassification: false };
    }
  }

  return { lowPower: false, targetFps: 12, enableBlinkClassification: true };
}
