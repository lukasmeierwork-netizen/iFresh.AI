import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  AHA_PLAN_VARIANT_IDS,
  AHA_PLAN_VARIANT_LABELS,
  DEFAULT_AHA_PLAN_VARIANT,
  type AhaPlanVariantId,
  renderAhaPlanVariant,
} from '@/components/onboarding/steps/aha-plan-variants';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StepAhaPlanProps = {
  onSequenceComplete?: () => void;
  /**
   * Called when the preview variant changes (dev) so the footer Next can hide again
   * until the new sequence finishes.
   */
  onSequenceReset?: () => void;
};

export { AHA_PLAN_VARIANT_LABELS, DEFAULT_AHA_PLAN_VARIANT, type AhaPlanVariantId };

export function StepAhaPlan({ onSequenceComplete, onSequenceReset }: StepAhaPlanProps) {
  const theme = useTheme();
  const [variant, setVariant] = useState<AhaPlanVariantId>(DEFAULT_AHA_PLAN_VARIANT);
  const firstPaint = useRef(true);

  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    onSequenceReset?.();
  }, [variant, onSequenceReset]);

  return (
    <View>
      {__DEV__ ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Spacing.three }}
          contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {AHA_PLAN_VARIANT_IDS.map((id) => {
            const active = variant === id;
            return (
              <Pressable
                key={id}
                onPress={() => setVariant(id)}
                accessibilityRole="button"
                accessibilityLabel={`Preview design ${AHA_PLAN_VARIANT_LABELS[id]}`}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? Brand.primary : theme.backgroundElement,
                  borderWidth: active ? 0 : 1,
                  borderColor: theme.glassBorder,
                }}>
                <ThemedText
                  className="text-[11px] font-semibold"
                  style={{ color: active ? '#FFFFFF' : theme.text }}>
                  {AHA_PLAN_VARIANT_LABELS[id]}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View key={variant}>{renderAhaPlanVariant(variant, onSequenceComplete)}</View>
    </View>
  );
}
