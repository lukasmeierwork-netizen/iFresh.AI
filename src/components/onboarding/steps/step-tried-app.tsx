import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { OptionCard } from '@/components/onboarding/option-card';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import type { OnboardingDraft, TriedEyesightAppAnswer } from '@/lib/onboarding/types';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
};

const AUTO_ADVANCE_DELAY_MS = 500;

const OPTIONS: Array<{
  id: TriedEyesightAppAnswer;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = [
  {
    id: 'still',
    label: 'Yes',
    description: 'I still use one',
    icon: 'checkbox-marked-circle-outline',
  },
  {
    id: 'stopped',
    label: 'Yes',
    description: 'I tried one but stopped',
    icon: 'progress-close',
  },
  {
    id: 'never',
    label: 'No',
    description: "I haven't tried one yet",
    icon: 'minus-circle-outline',
  },
];

function LeadingIcon({ name }: { name: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }) {
  return (
    <View className="h-9 w-9 rounded-xl items-center justify-center bg-black/5 dark:bg-white/10">
      <MaterialCommunityIcons name={name} size={20} color={Brand.primary} />
    </View>
  );
}

export function StepTriedApp({ draft, setAnswer, onNext }: Props) {
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
          {t('onboarding.triedAppTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.triedAppSubtitle')}
        </ThemedText>
      </View>
      <View style={{ gap: 12 }}>
        {OPTIONS.map((opt) => (
          <OptionCard
            key={opt.id}
            label={t(`onboarding.triedAppOptionLabel.${opt.id}`)}
            description={t(`onboarding.triedAppOptionDescription.${opt.id}`)}
            leading={<LeadingIcon name={opt.icon} />}
            selected={draft.triedEyesightApp === opt.id}
            onPress={() => {
              if (didAdvanceRef.current) return;
              setAnswer({ triedEyesightApp: opt.id });
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
