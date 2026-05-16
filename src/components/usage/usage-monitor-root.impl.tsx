import React from 'react';
import { View } from 'react-native';
import { Camera } from 'react-native-vision-camera';

import { useEyeUsageMonitor } from '@/hooks/use-eye-usage-monitor';

/**
 * Real implementation of the app-wide eye-usage monitor.
 *
 * This file MUST only be loaded when `react-native-vision-camera` is
 * available (see `usage-monitor-root.native.tsx` shell). Importing it
 * from a runtime where the native module is missing (Expo Go, broken
 * simulator build) will throw synchronously.
 *
 * The camera view is intentionally 2x2 pixels and zero-opacity: Vision
 * Camera requires a mounted view to capture frames, but we never show
 * the preview to the user.
 */
export function UsageMonitorRoot() {
  const { device, format, frameProcessor, isActive } = useEyeUsageMonitor();

  if (!device) return null;

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={{
        position: 'absolute',
        width: 2,
        height: 2,
        opacity: 0,
        overflow: 'hidden',
        left: 0,
        bottom: 0,
        zIndex: 0,
      }}>
      <Camera
        style={{ width: 2, height: 2 }}
        device={device}
        format={format}
        isActive={isActive}
        pixelFormat="yuv"
        frameProcessor={frameProcessor}
      />
    </View>
  );
}
