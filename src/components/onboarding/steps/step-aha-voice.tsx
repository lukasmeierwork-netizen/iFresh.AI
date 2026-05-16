import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, useWindowDimensions, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';

import { AhaSlide } from '@/components/onboarding/aha-slide';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Shadows } from '@/constants/theme';

const HOW_IT_WORKS_SLIDES = [
  { imageSource: require('@/assets/images/onboarding/how_it_works1.png') },
  { imageSource: require('@/assets/images/onboarding/how_it_works2.png') },
  { imageSource: require('@/assets/images/onboarding/how_it_works3.png') },
] as const;

export const AHA_VOICE_SLIDE_COUNT = HOW_IT_WORKS_SLIDES.length;

type StepAhaVoiceProps = {
  activeSlide: number;
  onActiveSlideChange: (index: number) => void;
};

export function StepAhaVoice({ activeSlide, onActiveSlideChange }: StepAhaVoiceProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const slideContent = [
    {
      heading: t('onboarding.howItWorksSlide1Title'),
      body: t('onboarding.howItWorksSlide1Body'),
    },
    {
      heading: t('onboarding.howItWorksSlide2Title'),
      body: t('onboarding.howItWorksSlide2Body'),
    },
    {
      heading: t('onboarding.howItWorksSlide3Title'),
      body: t('onboarding.howItWorksSlide3Body'),
    },
  ] as const;

  const cardWidth = containerWidth > 0 ? containerWidth : Math.min(360, width - 48);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      const index = Math.round(x / cardWidth);
      onActiveSlideChange(Math.max(0, Math.min(index, HOW_IT_WORKS_SLIDES.length - 1)));
    },
    [cardWidth, onActiveSlideChange],
  );

  useEffect(() => {
    if (!scrollRef.current || cardWidth <= 0) return;
    /**
     * Keep CTA-driven slide changes deterministic. Animated scrolls can queue
     * momentum callbacks out of order under rapid taps and temporarily roll the
     * index back, which blocks advancing to the next onboarding step.
     */
    scrollRef.current.scrollTo({ x: activeSlide * cardWidth, animated: false });
  }, [activeSlide, cardWidth]);

  const currentSlide = slideContent[activeSlide] ?? slideContent[0];

  return (
    <AhaSlide
      eyebrow={t('onboarding.howItWorksEyebrow')}
      title={currentSlide.heading}
      body={currentSlide.body}
      iconName="waveform"
      accentColors={[Brand.primary, Brand.indigo]}
      heroAfterEyebrow
      animateTextKey={activeSlide}
      hero={
        <View
          onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
          style={{ marginBottom: 14 }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}>
            {HOW_IT_WORKS_SLIDES.map((slide, index) => (
              <View
                key={index}
                style={{
                  width: cardWidth,
                  borderRadius: 20,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  ...Shadows.assistantBubble,
                }}>
                <Image source={slide.imageSource} style={{ width: '100%', aspectRatio: 16 / 10 }} contentFit="cover" />
              </View>
            ))}
          </ScrollView>
        </View>
      }>
      <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        {HOW_IT_WORKS_SLIDES.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === activeSlide ? 16 : 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: index === activeSlide ? Brand.primary : '#CBD5E1',
            }}
          />
        ))}
      </View>
    </AhaSlide>
  );
}
