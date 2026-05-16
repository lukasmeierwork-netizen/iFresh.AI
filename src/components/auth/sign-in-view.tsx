import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SocialAuthButtons } from '@/components/onboarding/social-auth-buttons';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { signInWithProvider } from '@/lib/supabase/auth';

type UiProvider = 'gmail' | 'apple';

/**
 * Returning-user sign-in screen. Lives outside the onboarding state machine
 * so users who already have an account don't have to walk through 17 cards
 * to reach `createAccount`. On success, `AuthGate` in `_layout.tsx` picks up
 * the new session and routes them into `(tabs)` automatically.
 */
export function SignInView() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loadingProvider, setLoadingProvider] = useState<UiProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onPressProvider = useCallback(async (provider: UiProvider) => {
    if (loadingProvider) return;
    setError(null);
    setLoadingProvider(provider);
    try {
      const supabaseProvider = provider === 'gmail' ? 'google' : 'apple';
      const result = await signInWithProvider(supabaseProvider);

      if (result.status === 'error') {
        setError(result.message);
      }
      // `success` → AuthGate redirects to (tabs) automatically.
      // `cancelled` → silently stay on this screen.
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signInFailed'));
    } finally {
      setLoadingProvider(null);
    }
  }, [loadingProvider, t]);

  const onPressBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  const bottomPad = Math.max(insets.bottom, Spacing.three);

  return (
    <ThemedView className="flex-1" type="background">
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1">
        <View className="px-4 pt-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.backA11y')}
            onPress={onPressBack}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-70">
            <SymbolView name={'chevron.left' as any} size={20} weight="semibold" />
          </Pressable>
        </View>

        <View
          className="w-full flex-1 justify-center gap-8 self-center px-6"
          style={{ maxWidth: Math.min(MaxContentWidth, 520) }}>
          <View className="items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#1E88FF]/10 dark:bg-[#1E88FF]/15">
              <SymbolView
                tintColor={Brand.primary}
                name={'person.crop.circle' as any}
                size={28}
                weight="semibold"
              />
            </View>
            <View className="items-center gap-2">
              <ThemedText className="text-[28px] font-semibold leading-9 text-center">
                {t('auth.title')}
              </ThemedText>
              <ThemedText
                themeColor="textSecondary"
                className="text-[15px] leading-6 text-center">
                {t('auth.subtitle')}
              </ThemedText>
            </View>
          </View>

          <SocialAuthButtons
            onPress={onPressProvider}
            disabled={loadingProvider != null}
            loadingProvider={loadingProvider}
          />

          {error ? (
            <ThemedText
              className="text-[13px] leading-5 text-center"
              style={{ color: Brand.danger }}>
              {error}
            </ThemedText>
          ) : null}
        </View>

        <View
          className="w-full items-center self-center px-6"
          style={{ paddingBottom: bottomPad, maxWidth: MaxContentWidth }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.createAccountA11y')}
            onPress={() => router.replace('/onboarding')}
            hitSlop={8}
            className="py-2 active:opacity-70">
            <ThemedText
              themeColor="textSecondary"
              className="text-[14px] leading-5">
              {t('auth.footerPrompt')}{' '}
              <ThemedText
                className="text-[14px] font-semibold leading-5"
                style={{ color: Brand.primary }}>
                {t('auth.footerCta')}
              </ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}
