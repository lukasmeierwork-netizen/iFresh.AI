import 'react-native-gesture-handler';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { LogBox, StyleSheet, useColorScheme, View } from 'react-native';

import '../global.css';
import { AnimatedSplashOverlay } from '@/components/media/animated-icon';
import { UsageMonitorRoot } from '@/components/usage/usage-monitor-root';
import { AppearancePreferenceProvider } from '@/hooks/appearance-preference-provider';
import { LocalePreferenceProvider } from '@/hooks/locale-preference-provider';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { isDevSkipOnboarding } from '@/lib/dev-flags';
import { OnboardingGateProvider } from '@/contexts/onboarding-gate';
import { isPaywallUnlockedForUser } from '@/lib/onboarding/paywall-unlock-storage';
import { getOnboardingCompletionForUser } from '@/lib/supabase/onboarding-storage';

WebBrowser.maybeCompleteAuthSession();
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered.']);
void SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_BG = '#208AEF';

/**
 * Owns the full startup sequence:
 *  1. Static opaque overlay while auth + onboarding guard resolves
 *  2. Stack mounts with correct routes behind the overlay
 *  3. One frame later the overlay swaps to AnimatedSplashOverlay which
 *     plays its scale-down fade — by then the correct screen is painted
 */
function GuardedNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingCheckLoading, setOnboardingCheckLoading] = useState(false);

  // 'hold'    → static opaque overlay, guard still resolving or routes not painted
  // 'animate' → AnimatedSplashOverlay mounted, playing fade-out
  const [splashPhase, setSplashPhase] = useState<'hold' | 'animate'>('hold');

  useEffect(() => {
    let cancelled = false;
    const userId = session?.user?.id ?? null;

    if (!userId) {
      setOnboardingComplete(false);
      setOnboardingCheckLoading(false);
      return;
    }

    setOnboardingCheckLoading(true);
    void Promise.all([getOnboardingCompletionForUser(userId), isPaywallUnlockedForUser(userId)]).then(
      ([result, paywallUnlocked]) => {
      if (cancelled) return;
      const onboardingLinked = result.ok ? result.completed : false;
      setOnboardingComplete(onboardingLinked && paywallUnlocked);
      setOnboardingCheckLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const routeGuardLoading = loading || onboardingCheckLoading;

  const refreshOnboardingCompletion = useCallback(async () => {
    const userId = session?.user?.id ?? null;
    if (!userId) {
      setOnboardingComplete(false);
      return;
    }
    const [result, paywallUnlocked] = await Promise.all([
      getOnboardingCompletionForUser(userId),
      isPaywallUnlockedForUser(userId),
    ]);
    const onboardingLinked = result.ok ? result.completed : false;
    setOnboardingComplete(onboardingLinked && paywallUnlocked);
  }, [session?.user?.id]);

  // Once guard resolves, wait one frame for routes to paint, then start splash fade.
  useEffect(() => {
    if (routeGuardLoading || splashPhase !== 'hold') return;

    const frame = requestAnimationFrame(() => {
      setSplashPhase('animate');
      void SplashScreen.hideAsync().catch(() => {});
    });
    return () => cancelAnimationFrame(frame);
  }, [routeGuardLoading, splashPhase]);

  // Redirect logic — runs after guard resolves.
  useEffect(() => {
    if (routeGuardLoading) return;
    if (!rootNavigationState?.key) return;
    if ((segments as string[]).length === 0) return;

    const first = segments[0];
    const inOnboarding = first === 'onboarding';
    const inSignIn = first === 'sign-in';
    const inUnauthRoute = inOnboarding || inSignIn;

    if (isDevSkipOnboarding) {
      if (inUnauthRoute) {
        router.replace('/(tabs)');
      }
      return;
    }

    if (session && onboardingComplete && inUnauthRoute) {
      router.replace('/(tabs)');
    } else if (session && !onboardingComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!session && !inUnauthRoute) {
      router.replace('/onboarding');
    }
  }, [onboardingComplete, routeGuardLoading, rootNavigationState?.key, session, segments, router]);

  // Splash layer: static overlay while guard loads, then animated fade once routes are painted.
  const splash =
    splashPhase === 'hold' ? (
      <View style={styles.staticSplash} />
    ) : (
      <AnimatedSplashOverlay />
    );

  return (
    <OnboardingGateProvider value={{ invalidate: refreshOnboardingCompletion }}>
      <View style={styles.container}>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName={isDevSkipOnboarding ? '(tabs)' : 'onboarding'}>
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen
            name="sign-in"
            options={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {routeGuardLoading ? <View style={styles.loadingRootOverlay} /> : null}
        {splash}
      </View>
    </OnboardingGateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  staticSplash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: SPLASH_BG,
  },
  loadingRootOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    backgroundColor: SPLASH_BG,
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <LocalePreferenceProvider>
      <AppearancePreferenceProvider>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <UsageMonitorRoot />
            <GuardedNavigator />
          </ThemeProvider>
        </AuthProvider>
      </AppearancePreferenceProvider>
    </LocalePreferenceProvider>
  );
}
