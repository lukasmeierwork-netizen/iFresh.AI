import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TaskLocaleCopy } from '@/lib/vision/daily-tasks-api';

/** Frontend overlay: English source task id → localized display copy. */
export type DailyTaskLocaleOverlay = Record<string, TaskLocaleCopy>;

const LOCALE_OVERLAY_PREFIX = 'eyefresh.daily-tasks-locale-v1';

const overlayMemory = new Map<string, DailyTaskLocaleOverlay>();
const overlayLoadedKeys = new Set<string>();

function overlayKey(input: {
  userId: string | null | undefined;
  planDate: string;
  locale: string;
}): string {
  const uid = input.userId?.trim() || 'anon';
  return `${LOCALE_OVERLAY_PREFIX}:${uid}:${input.planDate}:${input.locale}`;
}

/** Instant read from memory for language switches. */
export function peekCachedDailyTaskLocaleOverlay(input: {
  userId: string | null | undefined;
  planDate: string;
  locale: string;
}): DailyTaskLocaleOverlay | null {
  const key = overlayKey(input);
  const cached = overlayMemory.get(key);
  return cached && Object.keys(cached).length > 0 ? cached : null;
}

export async function readCachedDailyTaskLocaleOverlay(input: {
  userId: string | null | undefined;
  planDate: string;
  locale: string;
}): Promise<DailyTaskLocaleOverlay | null> {
  const key = overlayKey(input);
  const fromMemory = overlayMemory.get(key);
  if (fromMemory && Object.keys(fromMemory).length > 0) {
    return fromMemory;
  }

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyTaskLocaleOverlay;
    if (!parsed || typeof parsed !== 'object') return null;
    overlayMemory.set(key, parsed);
    overlayLoadedKeys.add(key);
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCachedDailyTaskLocaleOverlay(input: {
  userId: string | null | undefined;
  planDate: string;
  locale: string;
  overlay: DailyTaskLocaleOverlay;
}): Promise<void> {
  const key = overlayKey(input);
  overlayMemory.set(key, input.overlay);
  overlayLoadedKeys.add(key);

  try {
    await AsyncStorage.setItem(key, JSON.stringify(input.overlay));
  } catch {
    // ignore cache write failures
  }
}
