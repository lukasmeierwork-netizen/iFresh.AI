import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { OptionCard } from '@/components/onboarding/option-card';
import { ThemedText } from '@/components/ui/themed-text';
import { DISCOVERY_SOURCE_OPTIONS } from '@/lib/onboarding/steps';
import type { DiscoverySource, OnboardingDraft } from '@/lib/onboarding/types';
import { Brand } from '@/constants/theme';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
  onNext: () => void;
};

const AUTO_ADVANCE_DELAY_MS = 500;

function LeadingIcon({ id }: { id: DiscoverySource }) {
  const iconColor = id === 'tiktok' || id === 'instagram' || id === 'appstore' ? '#ffffff' : Brand.primary;

  return (
    <View
      className={[
        'h-9 w-9 rounded-xl items-center justify-center',
        id === 'tiktok'
          ? 'bg-black'
          : id === 'instagram'
            ? 'bg-[#E1306C]'
          : id === 'appstore'
            ? 'bg-[#0D96F6]'
            : 'bg-black/5 dark:bg-white/10',
      ].join(' ')}>
      {id === 'tiktok' ? (
        <FontAwesome5 name="tiktok" size={18} color={iconColor} />
      ) : id === 'instagram' ? (
        <FontAwesome5 name="instagram" size={18} color={iconColor} />
      ) : id === 'appstore' ? (
        <FontAwesome5 name="app-store-ios" size={18} color={iconColor} />
      ) : id === 'friend' ? (
        <MaterialCommunityIcons name="account-multiple" size={20} color={iconColor} />
      ) : id === 'search' ? (
        <MaterialCommunityIcons name="magnify" size={20} color={iconColor} />
      ) : (
        <MaterialCommunityIcons name="dots-horizontal-circle" size={20} color={iconColor} />
      )}
    </View>
  );
}

export function StepSource({ draft, setAnswer, onNext }: Props) {
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
          {t('onboarding.sourceTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {t('onboarding.sourceSubtitle')}
        </ThemedText>
      </View>
      <View style={{ gap: 12 }}>
        {DISCOVERY_SOURCE_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            label={t(`onboarding.sourceOptionLabel.${option.id}`)}
            description={
              option.id === 'tiktok'
                ? t('onboarding.sourceOptionDescription.tiktok')
                : option.id === 'instagram'
                  ? t('onboarding.sourceOptionDescription.instagram')
                  : option.id === 'appstore'
                    ? t('onboarding.sourceOptionDescription.appstore')
                    : option.id === 'friend'
                      ? t('onboarding.sourceOptionDescription.friend')
                      : option.id === 'search'
                        ? t('onboarding.sourceOptionDescription.search')
                        : t('onboarding.sourceOptionDescription.other')
            }
            leading={<LeadingIcon id={option.id} />}
            selected={draft.source === option.id}
            onPress={() => {
              if (didAdvanceRef.current) return;
              setAnswer({ source: option.id });
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
