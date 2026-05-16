import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { IndicatorItem } from '@/lib/usage/indicator-mapping';

type IndicatorStatCardProps = {
  item: IndicatorItem;
  iconName: string;
};

/**
 * Compact frosted stat chips on the glass home layer.
 */
export function IndicatorStatCard({ item, iconName }: IndicatorStatCardProps) {
  const theme = useTheme();
  const isIdle = item.state === 'Idle';
  const track = theme.glassTrack;
  const idleThumb = theme.scheme === 'light' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.45)';

  return (
    <View
      className="min-w-0 flex-1 gap-3 rounded-[22px] border px-3.5 py-4"
      style={{ borderColor: theme.glassBorder, backgroundColor: theme.glassSurface }}>
      <View className="flex-row items-center justify-between">
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor: isIdle ? track : `${item.tone}40`,
            borderWidth: 0.5,
            borderColor: theme.glassBorderStrong,
          }}>
          <SymbolView
            tintColor={isIdle ? theme.glassIconMuted : item.tone}
            name={iconName as any}
            size={15}
          />
        </View>
        <View
          className="rounded-full px-2 py-0.5"
          style={{
            backgroundColor: isIdle ? track : `${item.tone}45`,
          }}>
          <ThemedText
            className="text-[10px] font-bold tracking-[0.6px]"
            style={{
              color: isIdle ? theme.glassTextMuted : theme.glassTextPrimary,
            }}>
            {item.state.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View className="gap-0.5">
        <ThemedText
          className="text-[19px] font-semibold leading-6"
          style={{ color: theme.glassTextPrimary }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          {item.value}
        </ThemedText>
        <ThemedText
          className="text-[11px] font-medium leading-4"
          style={{ color: theme.glassTextMuted }}
          numberOfLines={1}>
          {item.label}
        </ThemedText>
      </View>

      <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: track }}>
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.max(6, Math.min(100, item.progress * 100))}%`,
            backgroundColor: isIdle ? idleThumb : item.tone,
          }}
        />
      </View>
    </View>
  );
}
