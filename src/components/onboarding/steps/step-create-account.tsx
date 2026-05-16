import { SymbolView } from 'expo-symbols';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { SocialAuthButtons } from '@/components/onboarding/social-auth-buttons';
import { ThemedText } from '@/components/ui/themed-text';
import type { OnboardingDraft } from '@/lib/onboarding/types';
import { signInWithProvider } from '@/lib/supabase/auth';
import { upsertOnboardingForUser } from '@/lib/supabase/onboarding-storage';
import { supabase } from '@/lib/supabase/client';

type Props = {
  draft: OnboardingDraft;
  setAnswer: (patch: Partial<OnboardingDraft>) => void;
  onCompleted: () => void | Promise<void>;
};

type UiProvider = 'gmail' | 'apple';

export function StepCreateAccount({ draft, setAnswer, onCompleted }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<UiProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persistAndFinish = useCallback(
    async (payload: OnboardingDraft) => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id ?? null;
      if (!userId) {
        throw new Error('Not signed in.');
      }

      const result = await upsertOnboardingForUser(userId, payload);
      if (!result.ok) {
        const hint = result.error.message.toLowerCase();
        const msg =
          result.error.code === 'PGRST301' || result.error.code === '42501' || hint.includes('permission')
            ? 'Could not save onboarding (enable the onboarding table and RLS policies in Supabase).'
            : result.error.message;
        throw new Error(msg);
      }

      setAnswer(payload);
      await Promise.resolve(onCompleted());
    },
    [onCompleted, setAnswer],
  );

  const onPressProvider = useCallback(
    async (provider: UiProvider) => {
      if (loadingProvider) return;
      setError(null);
      setLoadingProvider(provider);
      try {
        const supabaseProvider = provider === 'gmail' ? 'google' : 'apple';
        const result = await signInWithProvider(supabaseProvider);

        if (result.status === 'success') {
          const nextDraft: OnboardingDraft = { ...draft };

          const { data: sess } = await supabase.auth.getSession();
          if (!sess.session?.user?.id) {
            setError('Signed in but session is unavailable. Try again.');
            return;
          }

          await persistAndFinish(nextDraft);
          return;
        }

        if (result.status === 'error') {
          setError(result.message);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      } finally {
        setLoadingProvider(null);
      }
    },
    [draft, loadingProvider, persistAndFinish],
  );

  return (
    <View className="gap-6">
      <View className="items-center gap-3 pt-1">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#1E88FF]/10 dark:bg-[#1E88FF]/15">
          <SymbolView
            tintColor="#1E88FF"
            name={'person.crop.circle.badge.plus' as any}
            size={26}
            weight="semibold"
          />
        </View>

        <View className="items-center gap-2">
          <ThemedText className="text-[28px] font-semibold leading-9 text-center">
            Create your account
          </ThemedText>
          <ThemedText themeColor="textSecondary" className="text-[15px] leading-6 text-center">
            Save your progress, sync across devices, and unlock your personalized plan.
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
          style={{ color: '#D92D20' }}>
          {error}
        </ThemedText>
      ) : null}

      <ThemedText themeColor="textSecondary" className="text-[12px] leading-5 text-center">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </ThemedText>
    </View>
  );
}
