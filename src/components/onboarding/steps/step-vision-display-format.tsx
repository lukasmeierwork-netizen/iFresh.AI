import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { OptionCard } from '@/components/onboarding/option-card';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import type { OnboardingDraft } from '@/lib/onboarding/types';
import { loadNearVisionDisplayFormat, saveNearVisionDisplayFormat } from '@/lib/vision/near-vision-storage';
import type { NearVisionDisplayFormat } from '@/lib/vision/snellen';

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

export function StepVisionDisplayFormat({ draft, setAnswer, onNext }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<NearVisionDisplayFormat>('snellen');
  const didAdvanceRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadNearVisionDisplayFormat();
      if (cancelled) return;
      if (typeof draft.visionResultFormat === 'boolean') {
        setSelected(draft.visionResultFormat ? 'snellen' : 'decimal');
        return;
      }
      setSelected(saved);
    })();
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSelect = (format: NearVisionDisplayFormat) => {
    if (didAdvanceRef.current) return;
    setSelected(format);
    void saveNearVisionDisplayFormat(format);
    setAnswer({ visionResultFormat: format === 'snellen' });
    didAdvanceRef.current = true;
    timeoutRef.current = setTimeout(() => {
      onNext();
    }, AUTO_ADVANCE_DELAY_MS);
  };

  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {(t('onboarding.visionDisplayTitle' as any) as string)}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {(t('onboarding.visionDisplaySubtitle' as any) as string)}
        </ThemedText>
      </View>
      <View style={{ gap: 12 }}>
        <OptionCard
          label={(t('onboarding.visionDisplaySnellenLabel' as any) as string)}
          description={(t('onboarding.visionDisplaySnellenDescription' as any) as string)}
          leading={<LeadingIcon name="format-letter-case" />}
          selected={selected === 'snellen'}
          onPress={() => handleSelect('snellen')}
        />
        <OptionCard
          label={(t('onboarding.visionDisplayDecimalLabel' as any) as string)}
          description={(t('onboarding.visionDisplayDecimalDescription' as any) as string)}
          leading={<LeadingIcon name="decimal" />}
          selected={selected === 'decimal'}
          onPress={() => handleSelect('decimal')}
        />
      </View>
    </View>
  );
}
