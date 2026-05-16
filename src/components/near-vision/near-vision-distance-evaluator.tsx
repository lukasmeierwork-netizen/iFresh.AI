import { useEffect, useRef } from 'react';

import { useUsageField } from '@/hooks/use-usage-store';
import { getUsageSnapshot, setMonitoringEnabled } from '@/lib/usage/usage-store';

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
    if (!active || !monitoringEnabled) {
      onDistanceEstimate?.(null);
      return;
    }
    if (!faceVisible || distanceCm == null) {
      onDistanceEstimate?.(null);
      return;
    }
    onDistanceEstimate?.({ distanceCm });
  }, [active, monitoringEnabled, faceVisible, distanceCm, onDistanceEstimate]);

  return null;
}
