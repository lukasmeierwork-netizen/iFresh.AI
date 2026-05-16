import type {
  DiscoverySource,
  OnboardingStepId,
  ScreenTimeBucket,
} from './types';

/** Ordered list of onboarding step ids. Index in this array == step number. */
export const ONBOARDING_STEPS: readonly OnboardingStepId[] = [
  'welcome',
  'language',
  'screenTime',
  'source',
  'triedApp',
  'age',
  'glasses',
  'visionDisplayFormat',
  'ahaVoice',
  'whyBetter',
  'cameraPermission',
  'nearVisionCalibration',
  'thankYou',
  'rating',
  'createAccount',
  'paywall',
] as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;

export const SCREEN_TIME_OPTIONS: {
  id: ScreenTimeBucket;
  label: string;
  description: string;
}[] = [
  { id: '2-3h', label: '2 - 3 hours', description: 'Light daily use' },
  { id: '3-5h', label: '3 - 5 hours', description: 'Average daily use' },
  { id: '6+h', label: '6+ hours', description: 'Heavy daily use' },
];

export const DISCOVERY_SOURCE_OPTIONS: {
  id: DiscoverySource;
  label: string;
}[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'appstore', label: 'App Store' },
  { id: 'friend', label: 'A friend' },
  { id: 'search', label: 'Web search' },
  { id: 'other', label: 'Other' },
];

export const AGE_PICKER_MIN = 10;
export const AGE_PICKER_MAX = 90;
export const AGE_PICKER_DEFAULT = 28;

/**
 * Minimum rating (out of 5) to accept as "submitted" — lower scores still
 * advance the flow but we highlight the selected stars differently. Used by
 * `StarRating` to gate CTA styling only; no persistence.
 */
export const RATING_MAX = 5;
