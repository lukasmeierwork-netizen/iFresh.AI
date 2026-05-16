import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, NativeModules } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { OnboardingScaffold } from '@/components/onboarding/onboarding-scaffold';
import { StepAge } from '@/components/onboarding/steps/step-age';
import { AHA_VOICE_SLIDE_COUNT, StepAhaVoice } from '@/components/onboarding/steps/step-aha-voice';
import { StepCameraPermission } from '@/components/onboarding/steps/step-camera-permission';
import { StepCreateAccount } from '@/components/onboarding/steps/step-create-account';
import { StepGlasses } from '@/components/onboarding/steps/step-glasses';
import { StepLanguage } from '@/components/onboarding/steps/step-language';
import { StepNearVisionCalibration } from '@/components/onboarding/steps/step-near-vision-calibration';
import { StepPaywall } from '@/components/onboarding/steps/step-paywall';
import { StepRating } from '@/components/onboarding/steps/step-rating';
import { StepScreenTime } from '@/components/onboarding/steps/step-screen-time';
import { StepSource } from '@/components/onboarding/steps/step-source';
import { StepThankYou } from '@/components/onboarding/steps/step-thank-you';
import { StepTriedApp } from '@/components/onboarding/steps/step-tried-app';
import { StepVisionDisplayFormat } from '@/components/onboarding/steps/step-vision-display-format';
import { StepWelcome } from '@/components/onboarding/steps/step-welcome';
import { StepWhyBetter } from '@/components/onboarding/steps/step-why-better';
import { useOnboardingGate } from '@/contexts/onboarding-gate';
import { useOnboarding } from '@/hooks/use-onboarding';
import type { OnboardingDraft, OnboardingStepId } from '@/lib/onboarding/types';
import { markPaywallUnlockedForUser } from '@/lib/onboarding/paywall-unlock-storage';
import { markOnboardingPaywallCompletedForUser } from '@/lib/supabase/onboarding-storage';
import { supabase } from '@/lib/supabase/client';

const SCREEN_TIME_BG = require('@/assets/images/onboarding/clock.png');
const SOURCE_BG = require('@/assets/images/onboarding/1.png');
const TRIED_APP_BG = require('@/assets/images/onboarding/phone.png');
const AGE_BG = require('@/assets/images/onboarding/age.png');
const GLASSES_BG = require('@/assets/images/onboarding/glasses.png');
const VISION_DISPLAY_BG = require('@/assets/images/onboarding/landolt-c-chart.png');
const WHY_BETTER_BG = require('@/assets/images/onboarding/thumbup.png');

type StepConfig = {
  primaryLabel: string;
  secondaryLabel?: string;
  canAdvance: (draft: OnboardingDraft) => boolean;
  hidePrimary?: boolean;
};

function buildStepConfig(t: TFunction): Record<OnboardingStepId, StepConfig> {
  return {
    welcome: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: () => true,
      hidePrimary: true,
    },
    language: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: () => true,
    },
    screenTime: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: (d) => d.screenTime != null,
      hidePrimary: true,
    },
    source: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: (d) => d.source != null,
      hidePrimary: true,
    },
    triedApp: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: (d) => d.triedEyesightApp != null,
      hidePrimary: true,
    },
    age: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: (d) => d.age != null || d.ageUndisclosed === true,
      hidePrimary: true,
    },
    glasses: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: (d) => d.wearsGlasses != null,
      hidePrimary: true,
    },
    visionDisplayFormat: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: () => true,
      hidePrimary: true,
    },
    ahaVoice: {
      primaryLabel: t('onboarding.next'),
      canAdvance: () => true,
    },
    whyBetter: {
      primaryLabel: t('onboarding.soundsGood'),
      canAdvance: () => true,
    },
    cameraPermission: {
      primaryLabel: t('onboarding.allowCamera'),
      secondaryLabel: t('onboarding.cameraSkip'),
      canAdvance: () => true,
      hidePrimary: true,
    },
    nearVisionCalibration: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: () => true,
    },
    thankYou: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: () => true,
    },
    rating: {
      primaryLabel: t('onboarding.submitRating'),
      canAdvance: (d) => (d.rating ?? 0) > 0,
    },
    createAccount: {
      primaryLabel: t('onboarding.createAccount'),
      canAdvance: () => true,
      hidePrimary: true,
    },
    paywall: {
      primaryLabel: t('onboarding.continue'),
      canAdvance: () => false,
      hidePrimary: true,
    },
  } as Record<OnboardingStepId, StepConfig>;
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { invalidate } = useOnboardingGate();
  const [ahaVoiceSlide, setAhaVoiceSlide] = useState(0);
  const ahaVoiceSlideRef = useRef(0);
  const [thankYouFireworksDone, setThankYouFireworksDone] = useState(false);
  const {
    currentStepId,
    stepIndex,
    totalSteps,
    draft,
    isFirst,
    isLast,
    progress,
    next,
    back,
    setAnswer,
  } = useOnboarding();
  const fallbackStoreReviewUrl = process.env.EXPO_PUBLIC_APP_STORE_REVIEW_URL;

  const handlePrimary = useCallback(async () => {
    if (currentStepId === 'ahaVoice') {
      const slide = ahaVoiceSlideRef.current;
      if (slide < AHA_VOICE_SLIDE_COUNT - 1) {
        const nextSlide = Math.min(slide + 1, AHA_VOICE_SLIDE_COUNT - 1);
        ahaVoiceSlideRef.current = nextSlide;
        setAhaVoiceSlide(nextSlide);
        return;
      }
    }

    if (currentStepId === 'rating') {
      try {
        const hasNativeStoreReview = Boolean((NativeModules as Record<string, unknown>)?.ExpoStoreReview);
        if (!hasNativeStoreReview) {
          // Runtime (e.g. Expo Go) does not include the native StoreReview module.
          // If a public review URL is configured, open it as fallback.
          if (fallbackStoreReviewUrl) {
            const canOpen = await Linking.canOpenURL(fallbackStoreReviewUrl);
            if (canOpen) {
              await Linking.openURL(fallbackStoreReviewUrl);
            }
          }
        } else {
          // Lazy-load to avoid crashing in runtimes where the native module is unavailable.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const StoreReview = require('expo-store-review') as {
            hasAction?: () => Promise<boolean>;
            requestReview?: () => Promise<void>;
          };
          const hasAction = (await StoreReview.hasAction?.()) ?? false;
          if (hasAction && StoreReview.requestReview) {
            await StoreReview.requestReview();
          } else if (fallbackStoreReviewUrl) {
            const canOpen = await Linking.canOpenURL(fallbackStoreReviewUrl);
            if (canOpen) {
              await Linking.openURL(fallbackStoreReviewUrl);
            }
          }
        }
      } catch {
        // Best-effort only; continue onboarding even if native prompt fails.
      }
    }

    if (isLast) {
      router.replace('/(tabs)');
    } else {
      next();
    }
  }, [currentStepId, isLast, next, router]);

  useEffect(() => {
    ahaVoiceSlideRef.current = ahaVoiceSlide;
  }, [ahaVoiceSlide]);

  useEffect(() => {
    if (currentStepId !== 'ahaVoice' && ahaVoiceSlide !== 0) {
      ahaVoiceSlideRef.current = 0;
      setAhaVoiceSlide(0);
    }
  }, [ahaVoiceSlide, currentStepId]);

  useEffect(() => {
    if (currentStepId !== 'thankYou' && thankYouFireworksDone) {
      setThankYouFireworksDone(false);
    }
  }, [currentStepId, thankYouFireworksDone]);

  const handleSecondary = useCallback(() => {
    if (currentStepId === 'cameraPermission') {
      setAnswer({ cameraPermissionGranted: false });
      next();
    }
  }, [currentStepId, next, setAnswer]);

  const stepConfig = useMemo(() => buildStepConfig(t), [t]);
  const config = stepConfig[currentStepId];
  const primaryDisabled = config ? !config.canAdvance(draft) : true;

  const content = useMemo(() => {
    switch (currentStepId) {
      case 'screenTime':
        return <StepScreenTime draft={draft} setAnswer={setAnswer} onNext={next} />;
      case 'language':
        return <StepLanguage draft={draft} setAnswer={setAnswer} />;
      case 'source':
        return <StepSource draft={draft} setAnswer={setAnswer} onNext={next} />;
      case 'triedApp':
        return <StepTriedApp draft={draft} setAnswer={setAnswer} onNext={next} />;
      case 'age':
        return <StepAge draft={draft} setAnswer={setAnswer} onNext={next} />;
      case 'glasses':
        return <StepGlasses draft={draft} setAnswer={setAnswer} onNext={next} />;
      case 'visionDisplayFormat':
        return <StepVisionDisplayFormat draft={draft} setAnswer={setAnswer} onNext={next} />;
      case 'ahaVoice':
        return <StepAhaVoice activeSlide={ahaVoiceSlide} onActiveSlideChange={setAhaVoiceSlide} />;
      case 'whyBetter':
        return <StepWhyBetter draft={draft} onNext={next} />;
      case 'cameraPermission':
        return (
          <StepCameraPermission
            draft={draft}
            setAnswer={setAnswer}
            onGranted={next}
          />
        );
      case 'nearVisionCalibration':
        return <StepNearVisionCalibration draft={draft} setAnswer={setAnswer} />;
      case 'thankYou':
        return (
          <StepThankYou
            onFireworksComplete={() => {
              setThankYouFireworksDone(true);
            }}
          />
        );
      case 'rating':
        return <StepRating draft={draft} setAnswer={setAnswer} />;
      case 'createAccount':
        return (
          <StepCreateAccount
            draft={draft}
            setAnswer={setAnswer}
            onCompleted={async () => {
              next();
            }}
          />
        );
      case 'paywall':
        return (
          <StepPaywall
            onUnlocked={async () => {
              const { data } = await supabase.auth.getSession();
              const userId = data.session?.user?.id ?? null;
              if (userId) {
                await markPaywallUnlockedForUser(userId);
                await markOnboardingPaywallCompletedForUser(userId);
              }
              await invalidate();
              router.replace('/(tabs)');
            }}
          />
        );
      default:
        return null;
    }
  }, [ahaVoiceSlide, currentStepId, draft, invalidate, next, router, setAnswer]);

  if (currentStepId === 'welcome') {
    return <StepWelcome onContinue={handlePrimary} />;
  }

  const progressTotal = totalSteps;
  const progressStep = stepIndex + 1;

  return (
    <OnboardingScaffold
      progress={progress}
      stepNumber={progressStep}
      stepTotal={progressTotal}
      hideHeader={false}
      backgroundImage={
        currentStepId === 'screenTime'
          ? SCREEN_TIME_BG
          : currentStepId === 'source'
            ? SOURCE_BG
            : currentStepId === 'triedApp'
              ? TRIED_APP_BG
              : currentStepId === 'age'
                ? AGE_BG
                : currentStepId === 'glasses'
                  ? GLASSES_BG
                  : currentStepId === 'visionDisplayFormat'
                    ? VISION_DISPLAY_BG
                    : currentStepId === 'whyBetter'
                      ? WHY_BETTER_BG
                      : undefined
      }
      backgroundImageScale={
        currentStepId === 'screenTime'
          ? 2
          : currentStepId === 'source'
            ? 3.8
            : currentStepId === 'triedApp'
              ? 3
              : currentStepId === 'age'
                ? 3
                : currentStepId === 'glasses'
                  ? 3
                  : currentStepId === 'visionDisplayFormat'
                    ? 3.2
                    : currentStepId === 'whyBetter'
                      ? 3.25
                      : 1
      }
      canGoBack={!isFirst}
      hideBackButton={currentStepId === 'paywall'}
      onBack={back}
      primaryLabel={config.primaryLabel}
      primaryDisabled={primaryDisabled}
      onPrimaryPress={handlePrimary}
      primarySolidColor={undefined}
      primaryTextColor={undefined}
      footerAbovePrimary={undefined}
      footerCaption={undefined}
      secondaryLabel={config.secondaryLabel}
      onSecondaryPress={config.secondaryLabel ? handleSecondary : undefined}
      hidePrimary={Boolean(config.hidePrimary || (currentStepId === 'thankYou' && !thankYouFireworksDone))}>
      <Animated.View key={currentStepId} entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
        {content}
      </Animated.View>
    </OnboardingScaffold>
  );
}
