import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { OptionCard } from '@/components/onboarding/option-card';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { SCREEN_TIME_OPTIONS } from '@/lib/onboarding/steps';
import type { OnboardingDraft } from '@/lib/onboarding/types';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
};

const AUTO_ADVANCE_DELAY_MS = 500;

function LeadingIcon({ hours }: { hours: number }) {
  const name =
    hours <= 3 ? 'clock-time-three-outline' : hours <= 5 ? 'clock-time-five-outline' : 'clock-time-eight-outline';
  return (
    <View className="h-9 w-9 rounded-xl items-center justify-center bg-black/5 dark:bg-white/10">
      <MaterialCommunityIcons name={name} size={20} color={Brand.primary} />
    </View>
  );
}

export function StepScreenTime({ draft, setAnswer, onNext }: Props) {
  const { t } = useTranslation();
  const didAdvanceRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {t('onboarding.screenTimeTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.screenTimeSubtitle')}
        </ThemedText>
      </View>
      <View style={{ gap: 12 }}>
        {SCREEN_TIME_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            label={t(`onboarding.screenTimeOptionLabel.${option.id}`)}
            description={t(`onboarding.screenTimeOptionDescription.${option.id}`)}
            leading={<LeadingIcon hours={option.id === '2-3h' ? 3 : option.id === '3-5h' ? 5 : 8} />}
            selected={draft.screenTime === option.id}
            onPress={() => {
              if (didAdvanceRef.current) return;
              setAnswer({ screenTime: option.id });
              didAdvanceRef.current = true;
              timeoutRef.current = setTimeout(() => {
                onNext();
              }, AUTO_ADVANCE_DELAY_MS);
            }}
          />
        ))}
      </View>
    </View>
  );
}
