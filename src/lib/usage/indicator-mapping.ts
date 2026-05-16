import { Brand } from '@/constants/theme';

import type { UsageSnapshot } from './usage-store';

export type IndicatorItem = {
  key: 'distance' | 'blink' | 'continuous';
  label: string;
  value: string;
  progress: number;
  note: string;
  tone: string;
  state: string;
};

export const INDICATOR_ICONS: Record<IndicatorItem['key'], string> = {
  distance: 'arrow.left.and.right',
  blink: 'eye.fill',
  continuous: 'timer',
};

function distanceItem(distanceCm: number | null): IndicatorItem {
  if (distanceCm == null) {
    return {
      key: 'distance',
      label: 'Viewing distance',
      value: '—',
      progress: 0,
      note: 'Look at the front camera to start measuring.',
      tone: Brand.primary,
      state: 'Idle',
    };
  }
  const value = `${Math.round(distanceCm)} cm`;
  if (distanceCm >= 30 && distanceCm <= 60) {
    return {
      key: 'distance',
      label: 'Viewing distance',
      value,
      progress: 1,
      note: 'Comfortable arm’s-length viewing.',
      tone: Brand.success,
      state: 'Healthy',
    };
  }
  if (distanceCm < 25) {
    return {
      key: 'distance',
      label: 'Viewing distance',
      value,
      progress: 0.35,
      note: 'You’re very close — pull the screen back.',
      tone: Brand.danger,
      state: 'Too close',
    };
  }
  if (distanceCm < 30) {
    return {
      key: 'distance',
      label: 'Viewing distance',
      value,
      progress: 0.6,
      note: 'A little close — try to ease it back.',
      tone: Brand.warnAmber,
      state: 'Watch',
    };
  }
  return {
    key: 'distance',
    label: 'Viewing distance',
    value,
    progress: 0.85,
    note: 'A bit far, but well within range.',
    tone: Brand.info,
    state: 'Far',
  };
}

function blinkItem(rate: number | null): IndicatorItem {
  if (rate == null) {
    return {
      key: 'blink',
      label: 'Blink rate',
      value: '—',
      progress: 0,
      note: 'Waiting for a stable read.',
      tone: Brand.indigo,
      state: 'Idle',
    };
  }
  const value = `${Math.round(rate)} / min`;
  if (rate >= 12 && rate <= 22) {
    return {
      key: 'blink',
      label: 'Blink rate',
      value,
      progress: 1,
      note: 'Tear film is staying refreshed.',
      tone: Brand.success,
      state: 'Healthy',
    };
  }
  if (rate < 8) {
    return {
      key: 'blink',
      label: 'Blink rate',
      value,
      progress: 0.3,
      note: 'You’re barely blinking — close your eyes for a beat.',
      tone: Brand.danger,
      state: 'Low',
    };
  }
  if (rate < 12) {
    return {
      key: 'blink',
      label: 'Blink rate',
      value,
      progress: 0.6,
      note: 'A little dry — try a long blink.',
      tone: Brand.warnAmber,
      state: 'Watch',
    };
  }
  return {
    key: 'blink',
    label: 'Blink rate',
    value,
    progress: 0.85,
    note: 'Slightly fast — could be irritation.',
    tone: Brand.info,
    state: 'High',
  };
}

function continuousItem(snapshot: UsageSnapshot): IndicatorItem {
  if (!snapshot.faceVisible && snapshot.continuousMinutes === 0) {
    return {
      key: 'continuous',
      label: 'Continuous use',
      value: '—',
      progress: 0,
      note: 'No active session right now.',
      tone: Brand.violet,
      state: 'Idle',
    };
  }
  const minutes = snapshot.continuousMinutes;
  const value = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  if (minutes < 20) {
    return {
      key: 'continuous',
      label: 'Continuous use',
      value,
      progress: minutes / 20,
      note: 'Plenty of headroom before your next break.',
      tone: Brand.success,
      state: 'Fresh',
    };
  }
  if (minutes < 45) {
    return {
      key: 'continuous',
      label: 'Continuous use',
      value,
      progress: minutes / 45,
      note: 'Plan a 20-second look-away soon.',
      tone: Brand.warnAmber,
      state: 'Break soon',
    };
  }
  return {
    key: 'continuous',
    label: 'Continuous use',
    value,
    progress: Math.min(1, minutes / 60),
    note: 'Step away — your eyes need real rest.',
    tone: Brand.danger,
    state: 'Take a break',
  };
}

export function mapSnapshotToIndicators(snapshot: UsageSnapshot): IndicatorItem[] {
  return [distanceItem(snapshot.distanceCm), blinkItem(snapshot.blinkRate), continuousItem(snapshot)];
}

export function formatLastUpdated(
  lastUpdatedAt: number | null,
  nowMs: number,
): string {
  if (lastUpdatedAt == null) return 'Not measured yet';
  const deltaMs = Math.max(0, nowMs - lastUpdatedAt);
  if (deltaMs < 5_000) return 'Updated just now';
  if (deltaMs < 60_000) return `Updated ${Math.round(deltaMs / 1000)}s ago`;
  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `Updated ${hours}h ago`;
}
