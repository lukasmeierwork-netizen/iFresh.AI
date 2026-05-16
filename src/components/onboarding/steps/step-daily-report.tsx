import React from 'react';
import { View } from 'react-native';

import { AhaSlide } from '@/components/onboarding/aha-slide';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';

const BARS = [0.45, 0.7, 0.55, 0.9, 0.65, 0.82, 0.75];
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StepDailyReport() {
  return (
    <AhaSlide
      eyebrow="Daily report"
      title="Understand your eye health at a glance."
      body="Every evening we summarize your distance, blink rate, and continuous use in a single card you can read in seconds."
      iconName="chart.bar.fill"
      accentColors={[Brand.primary, Brand.info]}>
      <View style={{ gap: 12 }}>
        <ThemedText className="text-[13px] font-semibold tracking-[0.8px]" themeColor="textSecondary">
          EYE-HEALTH SCORE
        </ThemedText>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: 96,
            gap: 8,
          }}>
          {BARS.map((h, i) => (
            <View key={LABELS[i]} style={{ flex: 1, gap: 6, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: `${h * 100}%`,
                  borderRadius: 8,
                  backgroundColor: i === 3 ? Brand.primary : `${Brand.primary}55`,
                }}
              />
              <ThemedText themeColor="textSecondary" className="text-[10px]">
                {LABELS[i]}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </AhaSlide>
  );
}
