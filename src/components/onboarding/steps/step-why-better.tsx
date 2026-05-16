import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import type { OnboardingDraft } from '@/lib/onboarding/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  draft: OnboardingDraft;
  onNext: () => void;
};

type Benefit = {
  icon: string;
  title: string;
  line: string;
};

const CARD_ENTER_MS = 340;
const CARD_STAGGER_MS = 110;

export function StepWhyBetter({ draft: _draft, onNext }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as any);

  const benefits = useMemo<Benefit[]>(
    () => [
      {
        icon: 'globe',
        title: tr('onboarding.whyBetterBenefit1Title'),
        line: tr('onboarding.whyBetterBenefit1Body'),
      },
      {
        icon: 'eye.circle',
        title: tr('onboarding.whyBetterBenefit2Title'),
        line: tr('onboarding.whyBetterBenefit2Body'),
      },
      {
        icon: 'sparkles',
        title: tr('onboarding.whyBetterBenefit3Title'),
        line: tr('onboarding.whyBetterBenefit3Body'),
      },
      {
        icon: 'calendar.badge.clock',
        title: tr('onboarding.whyBetterBenefit4Title'),
        line: tr('onboarding.whyBetterBenefit4Body'),
      },
    ],
    [tr]
  );

  // Match `LanguageOption` unselected: translucent fill + gray border (no shadow).
  const cardBg =
    theme.scheme === 'light' ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.06)';
  const cardBorder = theme.scheme === 'light' ? '#D1D5DB' : theme.backgroundSelected;
  const iconWell =
    theme.scheme === 'light' ? 'rgba(232, 242, 254, 0.82)' : 'rgba(30, 136, 255, 0.16)';

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 10 }}>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          className="font-semibold tracking-[1.2px]">
          {tr('onboarding.whyBetterEyebrow')}
        </ThemedText>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {tr('onboarding.whyBetterTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[14px] leading-5">
          {tr('onboarding.whyBetterSubtitle')}
        </ThemedText>
      </View>

      <View style={{ gap: 12 }}>
        {benefits.map((b, index) => (
          <Animated.View
            key={b.title}
            entering={FadeInDown.duration(CARD_ENTER_MS).delay(index * CARD_STAGGER_MS)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor: cardBorder,
            }}>
            <View style={{ flex: 1, gap: 6 }}>
              <ThemedText className="text-[16px] font-semibold leading-5" style={{ color: Brand.primary }}>
                {b.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" className="text-[12px] leading-4 font-medium">
                {b.line}
              </ThemedText>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: iconWell,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <SymbolView tintColor={Brand.primary} name={b.icon as any} size={22} weight="semibold" />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
