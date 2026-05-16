import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AccountHeroCardProps = {
  signedIn: boolean;
  name: string;
  email: string;
  isPremium: boolean;
  premiumLabel: string;
  freeLabel: string;
};

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Hero card at the top of the settings screen. Shows the signed-in user with
 * an initials avatar, name, email, and a small status pill (premium / free).
 * When not signed in, falls back to a neutral icon avatar.
 */
export function AccountHeroCard({
  signedIn,
  name,
  email,
  isPremium,
  premiumLabel,
  freeLabel,
}: AccountHeroCardProps) {
  const theme = useTheme();
  const statusBg = isPremium
    ? 'rgba(245, 158, 11, 0.16)'
    : theme.glassWell;
  const statusBorder = isPremium
    ? 'rgba(245, 158, 11, 0.34)'
    : theme.glassBorderMuted;
  const statusFg = isPremium ? Brand.warnAmber : theme.glassTextMuted;
  const statusLabel = isPremium ? premiumLabel : freeLabel;

  return (
    <View
      className="flex-row items-center gap-4 overflow-hidden rounded-3xl border px-4 py-4"
      style={{
        borderColor: theme.glassBorder,
        backgroundColor: theme.glassSurface,
      }}>
      <View
        className="h-14 w-14 items-center justify-center rounded-full border"
        style={{
          borderColor: theme.glassBorderStrong,
          backgroundColor: theme.glassSurfaceRaised,
        }}>
        {signedIn ? (
          <ThemedText
            className="text-[18px] font-bold tracking-[0.4px]"
            style={{ color: theme.glassTextPrimary }}>
            {initialsFromName(name)}
          </ThemedText>
        ) : (
          <SymbolView
            tintColor={theme.glassIconMuted}
            name={'person.fill' as any}
            size={22}
            weight="semibold"
          />
        )}
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <ThemedText
          numberOfLines={1}
          className="text-[17px] font-semibold leading-6"
          style={{ color: theme.glassTextPrimary }}>
          {name}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          className="text-[12px] font-medium leading-4"
          style={{ color: theme.glassTextMuted }}>
          {email}
        </ThemedText>
        <View
          className="mt-1 flex-row items-center gap-1.5 self-start rounded-full px-2 py-1"
          style={{
            backgroundColor: statusBg,
            borderWidth: 1,
            borderColor: statusBorder,
          }}>
          {isPremium ? (
            <SymbolView
              tintColor={statusFg}
              name={'crown.fill' as any}
              size={11}
              weight="semibold"
            />
          ) : (
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusFg }}
            />
          )}
          <ThemedText
            className="text-[10px] font-bold uppercase tracking-[0.9px]"
            style={{ color: statusFg }}>
            {statusLabel}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
