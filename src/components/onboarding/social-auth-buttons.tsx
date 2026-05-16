import { SymbolView } from 'expo-symbols';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/ui/themed-text';

type Provider = 'gmail' | 'apple';

type SocialAuthButtonsProps = {
  onPress: (provider: Provider) => void;
  disabled?: boolean;
  loadingProvider?: Provider | null;
};

/**
 * Stacked OAuth sign-in buttons (Apple + Google). While `loadingProvider`
 * matches a button, that button shows a spinner; all buttons are disabled while
 * `disabled` is true to prevent double-taps during the OAuth browser flow.
 */
export function SocialAuthButtons({ onPress, disabled = false, loadingProvider = null }: SocialAuthButtonsProps) {
  return (
    <View className="gap-3">
      <SocialButton
        label="Continue with Apple"
        icon="apple.logo"
        iconTint="#FFFFFF"
        className="bg-[#111111]"
        textColor="#FFFFFF"
        disabled={disabled}
        loading={loadingProvider === 'apple'}
        onPress={() => onPress('apple')}
      />
      <SocialButton
        label="Continue with Google"
        icon="google"
        iconTint="#FFFFFF"
        className="bg-[#DB4437]"
        textColor="#FFFFFF"
        disabled={disabled}
        loading={loadingProvider === 'gmail'}
        onPress={() => onPress('gmail')}
      />
    </View>
  );
}

function SocialButton({
  label,
  icon,
  iconTint,
  className,
  textColor,
  disabled,
  loading,
  onPress,
}: {
  label: string;
  icon: string;
  iconTint: string;
  className: string;
  textColor: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const useMciIcon = icon === 'google';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={[
        'w-full flex-row items-center justify-center rounded-2xl px-4 py-4',
        'active:opacity-90 active:scale-[0.99]',
        isDisabled ? 'opacity-60' : '',
        className,
      ].join(' ')}>
      <View className="mr-2.5">
        {loading ? (
          <ActivityIndicator size="small" color={iconTint} />
        ) : useMciIcon ? (
          <MaterialCommunityIcons name="google" size={18} color={iconTint} />
        ) : (
          <SymbolView tintColor={iconTint} name={icon as any} size={18} weight="semibold" />
        )}
      </View>
      <ThemedText className="text-[15px] font-semibold" style={{ color: textColor }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
