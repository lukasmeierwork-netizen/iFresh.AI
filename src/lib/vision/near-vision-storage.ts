import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NearAcuityResult, NearVisionDisplayFormat } from '@/lib/vision/snellen';

export type NearVisionSavedResult = {
  savedAt: string; // ISO
  right: NearAcuityResult | null;
  left: NearAcuityResult | null;
  both: NearAcuityResult | null;
};

export type NearVisionHistoryEntry = {
  savedAt: string; // ISO
  nSize: number;
  approxSnellen: string;
  right?: Pick<NearAcuityResult, 'nSize' | 'approxSnellen'> | null;
  left?: Pick<NearAcuityResult, 'nSize' | 'approxSnellen'> | null;
  both?: Pick<NearAcuityResult, 'nSize' | 'approxSnellen'> | null;
};

const CALIBRATION_STORAGE_KEY = 'eyefresh:nearVision:calibration:v1';
const INPUT_MODE_STORAGE_KEY = 'eyefresh:nearVision:inputMode:v1';
const DISPLAY_FORMAT_STORAGE_KEY = 'eyefresh:nearVision:displayFormat:v1';

export type NearVisionCalibration = {
  savedAt: string; // ISO
  deviceId: string;
  orientation: 'portrait' | 'landscape';
  correctionScale: number;
  estimatedPpi: number;
};

export type NearVisionInputMode = 'swipe' | 'controller';

export async function saveNearVisionCalibration(
  calibration: Omit<NearVisionCalibration, 'savedAt'>
) {
  const payload: NearVisionCalibration = {
    savedAt: new Date().toISOString(),
    ...calibration,
  };
  await AsyncStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(payload));
}

export async function loadNearVisionCalibration(): Promise<NearVisionCalibration | null> {
  const raw = await AsyncStorage.getItem(CALIBRATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NearVisionCalibration;
  } catch {
    return null;
  }
}

export async function saveNearVisionInputMode(mode: NearVisionInputMode) {
  await AsyncStorage.setItem(INPUT_MODE_STORAGE_KEY, mode);
}

export async function loadNearVisionInputMode(): Promise<NearVisionInputMode> {
  const raw = await AsyncStorage.getItem(INPUT_MODE_STORAGE_KEY);
  if (raw === 'controller') return 'controller';
  return 'swipe';
}

export async function saveNearVisionDisplayFormat(format: NearVisionDisplayFormat) {
  await AsyncStorage.setItem(DISPLAY_FORMAT_STORAGE_KEY, format);
}

export async function loadNearVisionDisplayFormat(): Promise<NearVisionDisplayFormat> {
  const raw = await AsyncStorage.getItem(DISPLAY_FORMAT_STORAGE_KEY);
  if (raw === 'decimal') return 'decimal';
  return 'snellen';
}

