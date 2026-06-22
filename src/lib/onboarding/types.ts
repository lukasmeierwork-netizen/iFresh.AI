/**
 * Onboarding data types.
 *
 * `OnboardingDraft` is intentionally kept as a plain object — it lives primarily in memory
 * inside `useOnboarding`. Field answers are synced to Supabase incrementally (`upsertOnboardingForUser`).
 * Every answer is optional so we can navigate forward/backward freely while testing the UI.
 */

export type ScreenTimeBucket = "2-3h" | "3-5h" | "6+h";

export type DiscoverySource =
  | "tiktok"
  | "instagram"
  | "appstore"
  | "friend"
  | "search"
  | "other";

export type TriedEyesightAppAnswer = "stopped" | "still" | "never";
export type AgeRangeAnswer = "10-17" | "18-29" | "30-44" | "45+";

export type OnboardingDraft = {
  language?: "system" | "en" | "zh-Hans" | "fr" | "ko" | "ja" | "es" | "de";
  screenTime?: ScreenTimeBucket;
  source?: DiscoverySource;
  triedEyesightApp?: TriedEyesightAppAnswer;
  age?: AgeRangeAnswer;
  ageUndisclosed?: boolean;
  wearsGlasses?: boolean;
  /** Mirrors Supabase `onboarding.vision_result_format` (true=Snellen, false=Decimal). */
  visionResultFormat?: boolean;
  cameraPermissionGranted?: boolean;
  rating?: number;
  /** Near-vision calibration value (integer 0-100) matching the on-screen 20 mm bar. */
  calibrate?: number;
};

export type OnboardingStepId =
  | "welcome"
  | "language"
  | "screenTime"
  | "source"
  | "triedApp"
  | "age"
  | "glasses"
  | "visionDisplayFormat"
  | "ahaVoice"
  | "whyBetter"
  | "cameraPermission"
  | "nearVisionCalibration"
  | "thankYou"
  | "rating"
  | "createAccount"
  | "paywall";
