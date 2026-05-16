import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Uppercase eyebrow + title + optional subtitle + trailing slot. Replaces the
 * copy-pasted header block used on Home, Assistant, Schedule, and NearVision.
 */
export function SectionHeader({ eyebrow, title, subtitle, trailing, style }: SectionHeaderProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }, style]}>
      <View style={{ flex: 1, gap: 6 }}>
        {eyebrow ? (
          <ThemedText type="small" themeColor="textSecondary" className="font-semibold tracking-[1.2px]">
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText className="text-[24px] font-semibold leading-8">{title}</ThemedText>
        {subtitle ? (
          <ThemedText themeColor="textSecondary" className="text-[14px] leading-5">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}
