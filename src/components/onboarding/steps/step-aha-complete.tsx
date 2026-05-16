import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View } from 'react-native';

import { AhaSlide } from '@/components/onboarding/aha-slide';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StepAhaComplete() {
  return (
    <AhaSlide
      eyebrow="Aha moment"
      title="Check off your plan, one day at a time."
      body="Stay consistent with gentle nudges. Small daily wins protect your eyesight for years to come."
      iconName="checkmark.seal.fill"
      accentColors={[Brand.success, Brand.info]}>
      <View style={{ gap: 8 }}>
        <ThemedText className="text-[13px] font-semibold tracking-[0.8px]" themeColor="textSecondary">
          THIS WEEK
        </ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {DAYS.map((d, i) => {
            const done = i < 4;
            return (
              <View
                key={`${d}-${i}`}
                style={{
                  width: 38,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  backgroundColor: done ? Brand.success : `${Brand.success}18`,
                }}>
                <ThemedText
                  className="text-[11px] font-bold"
                  style={{ color: done ? '#FFFFFF' : Brand.success }}>
                  {d}
                </ThemedText>
                <SymbolView
                  tintColor={done ? '#FFFFFF' : 'transparent'}
                  name={'checkmark' as any}
                  size={10}
                  weight="bold"
                />
              </View>
            );
          })}
        </View>
      </View>
    </AhaSlide>
  );
}
