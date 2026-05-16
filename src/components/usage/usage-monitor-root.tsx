import React from 'react';

import { isVisionCameraAvailable } from '@/lib/usage/vision-camera-availability';

/**
 * Public native entry for the eye-usage monitor.
 *
 * `react-native-vision-camera` throws at module-load time in runtimes
 * where its native module isn't linked (Expo Go, simulator builds that
 * skipped prebuild). To keep the app bootable in those environments we
 * gate the real implementation behind a runtime availability check and
 * lazy-require it — meaning the vision-camera code path is only ever
 * evaluated on a dev-client / release build where the pod is present.
 *
 * See `usage-monitor-root.impl.native.tsx` for the real camera pipeline.
 */

type ImplModule = { UsageMonitorRoot: React.ComponentType };

let Impl: React.ComponentType | null = null;

if (isVisionCameraAvailable()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./usage-monitor-root.impl') as ImplModule;
    Impl = mod.UsageMonitorRoot;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[UsageMonitorRoot] Failed to load native implementation; falling back to no-op.',
        error
      );
    }
    Impl = null;
  }
}

export function UsageMonitorRoot() {
  if (!Impl) return null;
  const Component = Impl;
  return <Component />;
}
