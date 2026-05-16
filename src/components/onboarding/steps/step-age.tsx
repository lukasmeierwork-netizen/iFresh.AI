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

function LeadingIcon({ id }: { id: string }) {
  const name =
    id === '10-17'
      ? 'school-outline'
      : id === '18-29'
        ? 'account-heart-outline'
        : id === '30-44'
          ? 'briefcase-outline'
          : id === 'prefer-not-say'
            ? 'account-question-outline'
          : 'account-star-outline';
  return (
    <View className="h-9 w-9 rounded-xl items-center justify-center bg-black/5 dark:bg-white/10">
      <MaterialCommunityIcons name={name} size={20} color={Brand.primary} />
    </View>
  );
}

export function StepAge({ draft, setAnswer, onNext }: Props) {
  const { t } = useTranslation();
  const value = draft.age;
  const didAdvanceRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const ranges = [
    { id: '10-17' },
    { id: '18-29' },
    { id: '30-44' },
    { id: '45+' },
  ] as const;

  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {t('onboarding.ageTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.ageSubtitle')}
        </ThemedText>
      </View>
      <View style={{ gap: 12 }}>
        <ThemedText themeColor="textSecondary" className="text-[13px] font-semibold">
          {t('onboarding.ageRangePrompt')}
        </ThemedText>
        <View style={{ gap: 12 }}>
          {ranges.map((r) => (
            <OptionCard
              key={r.id}
              label={r.id}
              description={
                r.id === '10-17'
                  ? t('onboarding.ageRangeDescription.10-17')
                  : r.id === '18-29'
                    ? t('onboarding.ageRangeDescription.18-29')
                    : r.id === '30-44'
                      ? t('onboarding.ageRangeDescription.30-44')
                      : t('onboarding.ageRangeDescription.45+')
              }
              leading={<LeadingIcon id={r.id} />}
              selected={value === r.id}
              onPress={() => {
                if (didAdvanceRef.current) return;
                setAnswer({
                  age: r.id,
                  ageUndisclosed: false,
                });
                didAdvanceRef.current = true;
                timeoutRef.current = setTimeout(() => {
                  onNext();
                }, AUTO_ADVANCE_DELAY_MS);
              }}
            />
          ))}
          <OptionCard
            key="prefer-not-say"
            label={t('onboarding.agePreferNotLabel')}
            description={t('onboarding.agePreferNotDescription')}
            leading={<LeadingIcon id="prefer-not-say" />}
            selected={draft.ageUndisclosed === true}
            onPress={() => {
              if (didAdvanceRef.current) return;
              setAnswer({
                age: undefined,
                ageUndisclosed: true,
              });
              didAdvanceRef.current = true;
              timeoutRef.current = setTimeout(() => {
                onNext();
              }, AUTO_ADVANCE_DELAY_MS);
            }}
          />
        </View>
      </View>
    </View>
  );
}
