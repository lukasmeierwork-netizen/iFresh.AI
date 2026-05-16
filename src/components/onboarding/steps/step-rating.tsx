import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StarRating } from '@/components/onboarding/star-rating';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RATING_MAX } from '@/lib/onboarding/steps';
import type { OnboardingDraft } from '@/lib/onboarding/types';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
};

export function StepRating({ draft, setAnswer }: Props) {
  const { t } = useTranslation();
  const tr = (key: string) => t(key as any);
  const theme = useTheme();
  const rating = draft.rating ?? 0;
  const feedback =
    rating === 0
      ? tr('onboarding.ratingFeedbackEmpty')
      : rating >= 4
        ? tr('onboarding.ratingFeedbackPositive')
        : tr('onboarding.ratingFeedbackImprove');

  useEffect(() => {
    if (draft.rating == null) setAnswer({ rating: RATING_MAX });
  }, [draft.rating, setAnswer]);

  return (
    <View style={{ gap: 24 }}>
      <LinearGradient
        colors={[Brand.primary, Brand.indigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            height: 220,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
          },
          Shadows.assistantBubble,
        ]}>
        <View
          style={{
            width: 98,
            height: 98,
            borderRadius: 49,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SymbolView
            tintColor="#FFFFFF"
            name={'star.fill' as any}
            size={44}
            weight="semibold"
          />
        </View>
      </LinearGradient>

      <View style={{ gap: 10 }}>
        <ThemedText className="text-[28px] font-semibold leading-9">
          {tr('onboarding.ratingTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
          {tr('onboarding.ratingSubtitle')}
        </ThemedText>
      </View>

      {/* Overall rating strip */}
      <View style={{ gap: 10 }}>
        <ThemedText themeColor="textSecondary" className="text-[11px] font-semibold tracking-[1px]">
          {tr('onboarding.ratingStoreEyebrow')}
        </ThemedText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: theme.backgroundSelected,
            backgroundColor: theme.backgroundElement,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.background,
              }}>
              <SymbolView tintColor={theme.textSecondary} name={'trophy' as any} size={18} weight="semibold" />
            </View>
            <View style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ThemedText className="text-[26px] font-semibold leading-none">4.8</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SymbolView key={i} name={'star.fill' as any} size={13} tintColor={Brand.warnAmber} />
                  ))}
                </View>
              </View>
              <ThemedText themeColor="textSecondary" className="text-[11px] font-semibold leading-4">
                {tr('onboarding.ratingStoreReviews')}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Featured review */}
      {Array.from({ length: 3 }).map((_, idx) => (
        <View
          key={idx}
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: theme.backgroundSelected,
            backgroundColor: theme.backgroundElement,
            padding: 16,
            gap: 12,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.background,
                }}>
                <ThemedText className="text-[12px] font-semibold">S</ThemedText>
              </View>
              <ThemedText className="text-[14px] font-semibold">{tr('onboarding.ratingFeaturedAuthor')}</ThemedText>
            </View>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              {Array.from({ length: 5 }).map((__, i) => (
                <SymbolView key={i} name={'star.fill' as any} size={12} tintColor={Brand.warnAmber} />
              ))}
            </View>
          </View>
          <ThemedText themeColor="textSecondary" className="text-[13px] leading-5">
            {tr('onboarding.ratingFeaturedBody')}
          </ThemedText>
        </View>
      ))}

      {/* Actual input */}
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 4 }}>
        <StarRating value={rating} max={RATING_MAX} onChange={(v) => setAnswer({ rating: v })} />
        <ThemedText themeColor="textSecondary" className="text-[13px] leading-5 text-center">
          {feedback}
        </ThemedText>
      </View>
    </View>
  );
}
