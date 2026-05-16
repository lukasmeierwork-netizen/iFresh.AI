import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ComparisonCardProps = {
  others: string[];
  ours: string[];
};

/**
 * Side-by-side comparison between "Other apps" and "EyefreshAI". Used on the
 * "Why we're better" onboarding screen.
 */
export function ComparisonCard({ others, ours }: ComparisonCardProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View
        style={{
          flex: 1,
          borderRadius: 24,
          padding: 16,
          gap: 14,
          backgroundColor: theme.backgroundElement,
        }}>
        <ThemedText
          className="text-[13px] font-semibold tracking-[0.8px]"
          themeColor="textSecondary">
          OTHER APPS
        </ThemedText>
        {others.map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={'xmark' as any}
              size={14}
              weight="bold"
            />
            <ThemedText
              themeColor="textSecondary"
              className="text-[13px] leading-5 flex-1">
              {line}
            </ThemedText>
          </View>
        ))}
      </View>

      <View
        style={{
          flex: 1,
          borderRadius: 24,
          padding: 16,
          gap: 14,
          backgroundColor: Brand.primary,
        }}>
        <ThemedText
          className="text-[13px] font-semibold tracking-[0.8px]"
          style={{ color: 'rgba(255,255,255,0.85)' }}>
          EYEFRESH.AI
        </ThemedText>
        {ours.map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: 8 }}>
            <SymbolView
              tintColor="#FFFFFF"
              name={'checkmark' as any}
              size={14}
              weight="bold"
            />
            <ThemedText
              className="text-[13px] leading-5 flex-1"
              style={{ color: '#FFFFFF' }}>
              {line}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}
