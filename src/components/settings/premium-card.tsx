import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PremiumCardProps = {
  isPremium: boolean;
  activeTitle: string;
  activeSubtitle: string;
  inactiveTitle: string;
  inactiveSubtitle: string;
};

/**
 * Hero subscription card that fills with a warm amber gradient when premium
 * is active and falls back to a neutral surface otherwise. Wrapped in a
 * `SettingsGroup` together with related rows (manage / restore).
 */
export function PremiumCard({
  isPremium,
  activeTitle,
  activeSubtitle,
  inactiveTitle,
  inactiveSubtitle,
}: PremiumCardProps) {
  const theme = useTheme();

  if (isPremium) {
    return (
      <View className="overflow-hidden">
        <LinearGradient
          colors={['#F59E0B', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 18, paddingVertical: 18 }}>
          <View className="flex-row items-center gap-4">
            <View
              className="h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.22)' }}>
              <SymbolView
                tintColor="#FFFFFF"
                name={'crown.fill' as any}
                size={22}
                weight="bold"
              />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <ThemedText
                  className="text-[16px] font-bold leading-5"
                  style={{ color: '#FFFFFF' }}>
                  {activeTitle}
                </ThemedText>
                <SymbolView
                  tintColor="#FFFFFF"
                  name={'checkmark.seal.fill' as any}
                  size={14}
                  weight="bold"
                />
              </View>
              <ThemedText
                numberOfLines={2}
                className="text-[12px] font-medium leading-4"
                style={{ color: 'rgba(255, 255, 255, 0.92)' }}>
                {activeSubtitle}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-4 px-4 py-4">
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: theme.glassWell }}>
        <SymbolView
          tintColor={Brand.warnAmber}
          name={'crown.fill' as any}
          size={18}
          weight="semibold"
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <ThemedText
          className="text-[15px] font-semibold leading-5"
          style={{ color: theme.glassTextPrimary }}>
          {inactiveTitle}
        </ThemedText>
        <ThemedText
          numberOfLines={2}
          className="text-[12px] font-medium leading-4"
          style={{ color: theme.glassTextMuted }}>
          {inactiveSubtitle}
        </ThemedText>
      </View>
    </View>
  );
}
