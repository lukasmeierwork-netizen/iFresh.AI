import { Brand } from '@/constants/theme';

import type { UsageSnapshot } from './usage-store';

export type EyesightScoreTone = 'good' | 'watch' | 'alert' | 'idle';

export type EyesightScore = {
  /** Integer score 0–100, or `null` when no indicator has data yet. */
  value: number | null;
  /** Bucket used to drive accent color and copy. */
  tone: EyesightScoreTone;
  /** Short ALL-CAPS status word ("GOOD" / "WATCH" / "ALERT" / "IDLE"). */
  statusWord: string;
  /** One-line headline shown in the hero card. */
  headline: string;
  /** Supporting copy below the headline. */
  summary: string;
  /** Accent color used to tint the status pill. */
  accent: string;
};

function distancePoints(distanceCm: number | null): number | null {
  if (distanceCm == null) return null;
  if (distanceCm >= 30 && distanceCm <= 60) return 100;
  if (distanceCm >= 25 && distanceCm < 30) return 70;
  if (distanceCm < 25) return 35;
  return 90;
}

function blinkPoints(rate: number | null): number | null {
  if (rate == null) return null;
  if (rate >= 12 && rate <= 22) return 100;
  if (rate >= 8 && rate < 12) return 65;
  if (rate < 8) return 35;
  return 80;
}

function continuousPoints(snapshot: UsageSnapshot): number | null {
  if (!snapshot.faceVisible && snapshot.continuousMinutes === 0) return null;
  if (snapshot.continuousMinutes < 20) return 100;
  if (snapshot.continuousMinutes < 45) return 70;
  return 30;
}

const IDLE: EyesightScore = {
  value: null,
  tone: 'idle',
  statusWord: 'IDLE',
  headline: 'Waiting for your first reading',
  summary: 'Look at the front camera so we can score this session.',
  accent: '#FFFFFF',
};

export function computeEyesightScore(snapshot: UsageSnapshot): EyesightScore {
  if (!snapshot.monitoringEnabled) {
    return {
      value: null,
      tone: 'idle',
      statusWord: 'PAUSED',
      headline: 'Monitoring is paused',
      summary: 'Re-enable usage monitoring in Settings to keep scoring.',
      accent: '#FFFFFF',
    };
  }

  const points = [
    distancePoints(snapshot.distanceCm),
    blinkPoints(snapshot.blinkRate),
    continuousPoints(snapshot),
  ].filter((value): value is number => value != null);

  if (points.length === 0) return IDLE;

  const value = Math.round(points.reduce((sum, p) => sum + p, 0) / points.length);

  if (value >= 80) {
    return {
      value,
      tone: 'good',
      statusWord: 'GOOD',
      headline: 'Eyes are looking healthy',
      summary: 'Comfortable distance and steady blinks — keep it up.',
      accent: Brand.success,
    };
  }
  if (value >= 60) {
    return {
      value,
      tone: 'watch',
      statusWord: 'WATCH',
      headline: 'Time to ease the strain',
      summary: 'A short break and a deliberate blink will help.',
      accent: Brand.warnAmber,
    };
  }
  return {
    value,
    tone: 'alert',
    statusWord: 'ALERT',
    headline: 'Your eyes need a real break',
    summary: 'Step away from the screen for a few minutes.',
    accent: Brand.danger,
  };
}
