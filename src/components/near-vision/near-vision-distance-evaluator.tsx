import { useEffect, useRef } from 'react';

import { useUsageField } from '@/hooks/use-usage-store';
import { getUsageSnapshot, setMonitoringEnabled } from '@/lib/usage/usage-store';
import { FACE_LOST_HOLD_MS } from '@/lib/vision/near-vision-distance';

import type { NearVisionDistanceEvaluatorProps } from './near-vision-distance-evaluator.types';

/**
 * Distance evaluator for the near-vision test.
 *
 * Activates the camera (via `setMonitoringEnabled`) only while `active`
 * is true and restores the previous monitoring state on cleanup. This
 * keeps the camera off by default and avoids running it on every screen.
 */
export function NearVisionDistanceEvaluator({
  active,
  onDistanceEstimate,
}: NearVisionDistanceEvaluatorProps) {
  const distanceCm = useUsageField('distanceCm');
  const monitoringEnabled = useUsageField('monitoringEnabled');
  const faceVisible = useUsageField('faceVisible');

  const prevEnabledRef = useRef<boolean | null>(null);
  const lastEstimateRef = useRef<{ distanceCm: number; atMs: number } | null>(null);

  useEffect(() => {
    if (!active) return;

    prevEnabledRef.current = getUsageSnapshot().monitoringEnabled;
    setMonitoringEnabled(true);

    return () => {
      const restore = prevEnabledRef.current ?? false;
      prevEnabledRef.current = null;
      setMonitoringEnabled(restore);
    };
  }, [active]);

  useEffect(() => {
    const now = Date.now();

    if (!active || !monitoringEnabled) {
      lastEstimateRef.current = null;
      onDistanceEstimate?.(null);
      return;
    }

    if (distanceCm != null) {
      lastEstimateRef.current = { distanceCm, atMs: now };
      onDistanceEstimate?.({ distanceCm });
      return;
    }

    const held =
      (faceVisible || lastEstimateRef.current != null) &&
      lastEstimateRef.current != null &&
      now - lastEstimateRef.current.atMs <= FACE_LOST_HOLD_MS;

    if (held) {
      onDistanceEstimate?.({ distanceCm: lastEstimateRef.current!.distanceCm });
      return;
    }

    lastEstimateRef.current = null;
    onDistanceEstimate?.(null);
  }, [active, monitoringEnabled, faceVisible, distanceCm, onDistanceEstimate]);

  return null;
}
