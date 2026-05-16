import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { OptionCard } from '@/components/onboarding/option-card';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import type { OnboardingDraft } from '@/lib/onboarding/types';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
};

const AUTO_ADVANCE_DELAY_MS = 500;

function LeadingIcon({
  name,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) {
  return (
    <View className="h-9 w-9 rounded-xl items-center justify-center bg-black/5 dark:bg-white/10">
      <MaterialCommunityIcons name={name} size={20} color={Brand.primary} />
    </View>
  );
}

export function StepGlasses({ draft, setAnswer, onNext }: Props) {
  const { t } = useTranslation();
  const didAdvanceRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {t('onboarding.glassesTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.glassesSubtitle')}
        </ThemedText>
      </View>
      <View style={{ gap: 12 }}>
        <OptionCard
          label={t('onboarding.glassesYesLabel')}
          description={t('onboarding.glassesYesDescription')}
          leading={<LeadingIcon name="glasses" />}
          selected={draft.wearsGlasses === true}
          onPress={() => {
            if (didAdvanceRef.current) return;
            setAnswer({ wearsGlasses: true });
            didAdvanceRef.current = true;
            timeoutRef.current = setTimeout(() => {
              onNext();
            }, AUTO_ADVANCE_DELAY_MS);
          }}
        />
        <OptionCard
          label={t('onboarding.glassesNoLabel')}
          description={t('onboarding.glassesNoDescription')}
          leading={<LeadingIcon name="eye-outline" />}
          selected={draft.wearsGlasses === false}
          onPress={() => {
            if (didAdvanceRef.current) return;
            setAnswer({ wearsGlasses: false });
            didAdvanceRef.current = true;
            timeoutRef.current = setTimeout(() => {
              onNext();
            }, AUTO_ADVANCE_DELAY_MS);
          }}
        />
      </View>
    </View>
  );
}
