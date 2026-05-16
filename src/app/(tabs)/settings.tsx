import type { TFunction } from 'i18next';
import { SymbolView } from 'expo-symbols';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  PixelRatio,
  Platform,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteAccount } from '@/lib/account/delete-account';
import { AccountHeroCard } from '@/components/settings/account-hero-card';
import { AppearanceSection } from '@/components/settings/appearance-section';
import { LanguageSection } from '@/components/settings/language-section';
import { PremiumCard } from '@/components/settings/premium-card';
import { SegmentedControl } from '@/components/settings/segmented-control';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-group';
import { StepperControl } from '@/components/settings/stepper-control';
import { TabGlassScreenRoot } from '@/components/ui/glass-home-backdrop';
import { ThemedText } from '@/components/ui/themed-text';
import { BottomTabInset, Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useSignOut } from '@/hooks/use-sign-out';
import { useTheme } from '@/hooks/use-theme';
import {
  checkCalendarPermissions,
  isCalendarEventsAvailable,
  type CalendarAuthorizationStatus,
} from '@/lib/calendar-events';
import {
  ensureStoreIapConnection,
  hasProSubscriptionAccess,
  isStoreIapConfigured,
  isStoreIapSupportedPlatform,
  restoreStorePurchases,
} from '@/lib/iap/store-iap';
import { isVisionCameraAvailable } from '@/lib/usage/vision-camera-availability';
import {
  estimatePpiFromPixelRatio,
  mmToPixels,
  ppiToPixelsPerMm,
  RULER_REFERENCE_MM,
} from '@/lib/vision/near-vision-calibration';
import {
  loadNearVisionCalibration,
  loadNearVisionDisplayFormat,
  loadNearVisionInputMode,
  saveNearVisionDisplayFormat,
  saveNearVisionInputMode,
  saveNearVisionCalibration,
  type NearVisionInputMode,
} from '@/lib/vision/near-vision-storage';
import { patchOnboardingColumnsForUser } from '@/lib/supabase/onboarding-storage';
import type { NearVisionDisplayFormat } from '@/lib/vision/snellen';

type CameraPermissionStatus = 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unavailable' | 'error';
type CalendarPermissionDisplayStatus = CalendarAuthorizationStatus | 'unavailable' | 'error';
const CALIBRATION_MIN = 0;
const CALIBRATION_MAX = 100;

// EyeFresh AI distribution + support endpoints.
const APP_STORE_URL = 'https://apps.apple.com/app/id6469000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ss.eyefreshAI';
const SUPPORT_EMAIL = 'support@eyefreshai.com';
const FEATURE_REQUEST_EMAIL = 'feedback@eyefreshai.com';
const TERMS_URL = 'https://eyefreshai.com/legal/terms';
const PRIVACY_URL = 'https://eyefreshai.com/legal/privacy';
const APPLE_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const PLAY_MANAGE_SUBSCRIPTIONS_URL =
  'https://play.google.com/store/account/subscriptions?package=com.ss.eyefreshAI';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user, session } = useAuth();
  const { signOut, isSigningOut } = useSignOut();
  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');
  const [calendarPermissionStatus, setCalendarPermissionStatus] =
    useState<CalendarPermissionDisplayStatus>('undetermined');
  const [nearVisionCalibration, setNearVisionCalibration] = useState<number>(100);
  const [nearVisionInputMode, setNearVisionInputMode] =
    useState<NearVisionInputMode>('swipe');
  const [nearVisionDisplayFormat, setNearVisionDisplayFormat] =
    useState<NearVisionDisplayFormat>('snellen');
  const [isPremium, setIsPremium] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const lastSyncedCameraOnboardingRef = useRef<CameraPermissionStatus | null>(null);
  const orientation = height >= width ? 'portrait' : 'landscape';
  const deviceId = Device.modelId ?? Device.modelName ?? 'ios-device';
  const calibrationDeviceId = `${deviceId}:${orientation}`;
  const estimatedPpi = useMemo(() => estimatePpiFromPixelRatio(PixelRatio.get()), []);

  useEffect(() => {
    lastSyncedCameraOnboardingRef.current = null;
  }, [user?.id]);

  const saveCalibrationValue = useCallback(
    async (value: number) => {
      await saveNearVisionCalibration({
        deviceId: calibrationDeviceId,
        orientation,
        correctionScale: value / 100,
        estimatedPpi,
      });
    },
    [calibrationDeviceId, estimatedPpi, orientation]
  );

  const handleCalibrationChange = useCallback(
    (next: number) => {
      setNearVisionCalibration(next);
      void saveCalibrationValue(next);
      const uid = user?.id;
      if (uid) {
        void patchOnboardingColumnsForUser(uid, { calibrate: next });
      }
    },
    [saveCalibrationValue, user?.id],
  );

  const refreshPermissions = useCallback(async () => {
    if (!isVisionCameraAvailable()) {
      setCameraPermissionStatus('unavailable');
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('react-native-vision-camera') as {
          Camera: {
            getCameraPermissionStatus: () => Promise<
              'granted' | 'denied' | 'restricted' | 'not-determined'
            >;
          };
        };
        const status = await mod.Camera.getCameraPermissionStatus();
        setCameraPermissionStatus(status);
        const uid = user?.id;
        if (
          uid &&
          (status === 'granted' ||
            status === 'denied' ||
            status === 'restricted' ||
            status === 'not-determined')
        ) {
          if (lastSyncedCameraOnboardingRef.current !== status) {
            lastSyncedCameraOnboardingRef.current = status;
            void patchOnboardingColumnsForUser(uid, {
              camera_permission_granted: status === 'granted',
            });
          }
        }
      } catch {
        setCameraPermissionStatus('error');
      }
    }

    if (!isCalendarEventsAvailable()) {
      setCalendarPermissionStatus('unavailable');
    } else {
      try {
        const status = await checkCalendarPermissions();
        setCalendarPermissionStatus(status);
      } catch {
        setCalendarPermissionStatus('error');
      }
    }

    try {
      const calibration = await loadNearVisionCalibration();
      if (calibration && calibration.deviceId === calibrationDeviceId) {
        setNearVisionCalibration(
          Math.max(
            CALIBRATION_MIN,
            Math.min(CALIBRATION_MAX, Math.round(calibration.correctionScale * 100))
          )
        );
      } else {
        setNearVisionCalibration(100);
      }
    } catch {
      setNearVisionCalibration(100);
    }
    try {
      const savedInputMode = await loadNearVisionInputMode();
      setNearVisionInputMode(savedInputMode);
    } catch {
      setNearVisionInputMode('swipe');
    }
    try {
      const savedDisplayFormat = await loadNearVisionDisplayFormat();
      setNearVisionDisplayFormat(savedDisplayFormat);
    } catch {
      setNearVisionDisplayFormat('snellen');
    }

    if (user?.id) {
      try {
        if (!isStoreIapSupportedPlatform() || !isStoreIapConfigured()) {
          setIsPremium(false);
        } else {
          const connected = await ensureStoreIapConnection();
          if (connected) {
            setIsPremium(await hasProSubscriptionAccess());
          } else {
            setIsPremium(false);
          }
        }
      } catch {
        setIsPremium(false);
      }
    } else {
      setIsPremium(false);
    }

  }, [calibrationDeviceId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refreshPermissions();
    }, [refreshPermissions]),
  );

  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    }),
    [safeAreaInsets]
  );
  const referenceBarPx = useMemo(() => {
    const pixelsPerMm = ppiToPixelsPerMm(estimatedPpi);
    return Math.round(mmToPixels(RULER_REFERENCE_MM, pixelsPerMm, nearVisionCalibration / 100));
  }, [estimatedPpi, nearVisionCalibration]);

  const accountDisplayName = useMemo(() => {
    if (!user) return t('settings.accountNotSignedIn');
    const metadata = user.user_metadata ?? {};
    const fullName =
      metadata.full_name ??
      metadata.name ??
      metadata.display_name ??
      metadata.preferred_username ??
      [metadata.given_name, metadata.family_name].filter(Boolean).join(' ').trim();
    if (typeof fullName === 'string' && fullName.trim().length > 0) {
      return fullName.trim();
    }
    if (user.email) {
      return user.email.split('@')[0] ?? t('settings.accountFallbackName');
    }
    return t('settings.accountFallbackName');
  }, [user, t]);

  const accountEmail = useMemo(() => {
    if (!user) return t('settings.accountEmailPlaceholder');
    return user.email ?? t('settings.accountEmailMissing');
  }, [user, t]);

  const promptLogOut = useCallback(() => {
    Alert.alert(t('settings.logOutConfirmTitle'), t('settings.logOutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logOut'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await signOut();
            if (!result.ok) {
              Alert.alert(t('settings.logOutFailed'), result.message);
            }
          })();
        },
      },
    ]);
  }, [signOut, t]);

  const promptDeleteAccount = useCallback(() => {
    if (isDeletingAccount) return;
    Alert.alert(
      t('settings.deleteAccountConfirmTitle' as any) as string,
      t('settings.deleteAccountConfirmMessage' as any) as string,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountConfirmCta' as any) as string,
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsDeletingAccount(true);
              try {
                const result = await deleteAccount();
                if (!result.ok) {
                  Alert.alert(
                    t('settings.deleteAccountFailedTitle' as any) as string,
                    result.message ||
                      (t('settings.deleteAccountFailedMessage' as any) as string),
                  );
                  return;
                }
                // Drop the local session so the auth listener routes the user
                // back to onboarding. We swallow the sign-out result here:
                // the account is already gone server-side either way.
                await signOut();
                Alert.alert(
                  t('settings.deleteAccountSuccessTitle' as any) as string,
                  t('settings.deleteAccountSuccessMessage' as any) as string,
                );
              } finally {
                setIsDeletingAccount(false);
              }
            })();
          },
        },
      ],
    );
  }, [isDeletingAccount, signOut, t]);

  const storeUrl = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
  const manageSubscriptionUrl =
    Platform.OS === 'android' ? PLAY_MANAGE_SUBSCRIPTIONS_URL : APPLE_MANAGE_SUBSCRIPTIONS_URL;

  const handleShareApp = useCallback(async () => {
    try {
      await Share.share({
        message: `${t('settings.shareAppMessage')}\n${storeUrl}`,
        url: storeUrl,
      });
    } catch {
      // User dismissed or share failed silently; nothing actionable.
    }
  }, [storeUrl, t]);

  const handleRateUs = useCallback(async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      const hasAction = available && (await StoreReview.hasAction());
      if (hasAction) {
        await StoreReview.requestReview();
        return;
      }
      const fallback = await StoreReview.storeUrl();
      await Linking.openURL(fallback ?? storeUrl);
    } catch {
      Alert.alert(
        t('settings.rateUsUnavailableTitle'),
        t('settings.rateUsUnavailableMessage'),
      );
    }
  }, [storeUrl, t]);

  const handleManageSubscription = useCallback(() => {
    void Linking.openURL(manageSubscriptionUrl);
  }, [manageSubscriptionUrl]);

  const handleRestorePurchases = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      if (!isStoreIapSupportedPlatform() || !isStoreIapConfigured()) {
        Alert.alert(
          t('settings.restoreFailedTitle'),
          t('settings.restoreNotFoundMessage'),
        );
        return;
      }
      await restoreStorePurchases();
      const active = await hasProSubscriptionAccess();
      setIsPremium(active);
      Alert.alert(
        active ? t('settings.restoreSuccessTitle') : t('settings.restoreNotFoundTitle'),
        active ? t('settings.restoreSuccessMessage') : t('settings.restoreNotFoundMessage'),
      );
    } catch (err) {
      Alert.alert(
        t('settings.restoreFailedTitle'),
        err instanceof Error ? err.message : t('settings.restoreNotFoundMessage'),
      );
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, t]);

  const handleOpenSupport = useCallback(() => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }, []);

  const handleRequestFeature = useCallback(() => {
    const subject = encodeURIComponent(t('settings.featureRequestEmailSubject'));
    void Linking.openURL(`mailto:${FEATURE_REQUEST_EMAIL}?subject=${subject}`);
  }, [t]);

  const handleOpenTerms = useCallback(() => {
    void Linking.openURL(TERMS_URL);
  }, []);

  const handleOpenPrivacy = useCallback(() => {
    void Linking.openURL(PRIVACY_URL);
  }, []);

  const appVersion =
    Constants.expoConfig?.version ?? (Constants as { manifest?: { version?: string } }).manifest?.version ?? '1.0.0';

  const visionDisplayOptions = useMemo(
    () =>
      [
        {
          id: 'snellen' as const,
          label: t('settings.visionDisplaySnellen' as any) as string,
          accessibilityLabel: t('settings.visionDisplaySnellenA11y' as any) as string,
        },
        {
          id: 'decimal' as const,
          label: t('settings.visionDisplayDecimal' as any) as string,
          accessibilityLabel: t('settings.visionDisplayDecimalA11y' as any) as string,
        },
      ] as const,
    [t],
  );

  const inputModeOptions = useMemo(
    () =>
      [
        {
          id: 'swipe' as const,
          label: t('settings.nearVisionModeSwipe' as any) as string,
          accessibilityLabel: t('settings.nearVisionModeSwipeA11y' as any) as string,
        },
        {
          id: 'controller' as const,
          label: t('settings.nearVisionModeController' as any) as string,
          accessibilityLabel: t('settings.nearVisionModeControllerA11y' as any) as string,
        },
      ] as const,
    [t],
  );

  return (
    <TabGlassScreenRoot>
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom,
        }}>
        <SafeAreaView
          className="w-full items-center justify-center px-6"
          style={{ maxWidth: MaxContentWidth }}
          edges={['left', 'right']}>
          <View className="w-full max-w-[420px] gap-5">
            <View className="gap-1.5 px-1">
              <ThemedText type="small" className="font-semibold tracking-[1.4px]" style={{ color: theme.glassTextMuted }}>
                {t('common.brand')}
              </ThemedText>
              <ThemedText className="text-[28px] font-bold leading-9" style={{ color: theme.glassTextPrimary }}>
                {t('settings.title')}
              </ThemedText>
              <ThemedText className="text-[14px] leading-5" style={{ color: theme.glassTextMuted }}>
                {t('settings.subtitle')}
              </ThemedText>
            </View>

            <AccountHeroCard
              signedIn={Boolean(user)}
              name={accountDisplayName}
              email={accountEmail}
              isPremium={isPremium}
              premiumLabel={t('settings.premiumActiveTitle')}
              freeLabel={t('settings.premiumInactiveTitle')}
            />

            <AppearanceSection />

            <LanguageSection />

            <SettingsGroup header={t('settings.permissionsSection')}>
              <SettingsRow
                icon="camera.fill"
                iconColor={Brand.primary}
                label={t('settings.camera')}
                value={formatPermissionStatus(cameraPermissionStatus, t)}
                showChevron={false}
              />
              <SettingsRow
                icon="calendar"
                iconColor={Brand.primary}
                label={t('settings.calendar')}
                value={formatPermissionStatus(calendarPermissionStatus, t)}
                showChevron={false}
              />
            </SettingsGroup>

            <SettingsGroup
              header={t('settings.visionTestingSection' as any) as string}
              description={t('settings.visionTestingHint' as any) as string}>
              <View>
                <View className="gap-5 px-4 pt-4 pb-5">
                  <View className="items-center" pointerEvents="none">
                    <View
                      style={{
                        width: referenceBarPx,
                        height: 6,
                        borderRadius: 999,
                        backgroundColor: Brand.primary,
                      }}
                    />
                    <ThemedText
                      className="mt-2 text-[10px] font-semibold uppercase tracking-[1px]"
                      style={{ color: theme.glassTextFaint }}>
                      {t('settings.nearVisionRange')}
                    </ThemedText>
                  </View>
                  <StepperControl
                    value={nearVisionCalibration}
                    min={CALIBRATION_MIN}
                    max={CALIBRATION_MAX}
                    onChange={handleCalibrationChange}
                    decrementA11y={t('settings.nearVisionDecreaseA11y')}
                    incrementA11y={t('settings.nearVisionIncreaseA11y')}
                  />
                </View>

                <View
                  className="mx-4 h-px"
                  style={{ backgroundColor: theme.glassBorderMuted }}
                />

                <View className="gap-2 px-4 pt-4 pb-4">
                  <ThemedText
                    className="text-[11px] font-semibold uppercase tracking-[0.9px]"
                    style={{ color: theme.glassTextMuted }}>
                    {t('settings.visionDisplaySection' as any) as string}
                  </ThemedText>
                  <SegmentedControl
                    value={nearVisionDisplayFormat}
                    options={visionDisplayOptions}
                    onChange={(next) => {
                      setNearVisionDisplayFormat(next);
                      void saveNearVisionDisplayFormat(next);
                      if (user?.id) {
                        void patchOnboardingColumnsForUser(user.id, {
                          vision_result_format: next === 'snellen',
                        });
                      }
                    }}
                  />
                </View>

                <View
                  className="mx-4 h-px"
                  style={{ backgroundColor: theme.glassBorderMuted }}
                />

                <View className="gap-2 px-4 pt-4 pb-4">
                  <ThemedText
                    className="text-[11px] font-semibold uppercase tracking-[0.9px]"
                    style={{ color: theme.glassTextMuted }}>
                    {t('settings.howToTestSection' as any) as string}
                  </ThemedText>
                  <SegmentedControl
                    value={nearVisionInputMode}
                    options={inputModeOptions}
                    onChange={(next) => {
                      setNearVisionInputMode(next);
                      void saveNearVisionInputMode(next);
                    }}
                  />
                </View>
              </View>
            </SettingsGroup>

            <SettingsGroup header={t('settings.subscriptionSection')}>
              <PremiumCard
                isPremium={isPremium}
                activeTitle={t('settings.premiumActiveTitle')}
                activeSubtitle={t('settings.premiumActiveSubtitle')}
                inactiveTitle={t('settings.premiumInactiveTitle')}
                inactiveSubtitle={t('settings.premiumInactiveSubtitle')}
              />
              <SettingsRow
                icon="creditcard.fill"
                iconColor={Brand.primary}
                label={t('settings.manageSubscription')}
                trailing={
                  <SymbolView
                    tintColor={theme.glassIconMuted}
                    name={'arrow.up.right.square' as any}
                    size={16}
                    weight="semibold"
                  />
                }
                onPress={handleManageSubscription}
                accessibilityLabel={t('settings.manageSubscriptionA11y')}
              />
              <SettingsRow
                icon="arrow.clockwise"
                iconColor={Brand.primary}
                label={t('settings.restorePurchases')}
                trailing={isRestoring ? <ActivityIndicator color={Brand.primary} /> : null}
                onPress={handleRestorePurchases}
                disabled={isRestoring}
                accessibilityLabel={t('settings.restorePurchasesA11y')}
                showChevron={false}
              />
            </SettingsGroup>

            <SettingsGroup header={t('settings.helpAboutSection' as any) as string}>
              <SettingsRow
                icon="square.and.arrow.up"
                iconColor={Brand.primary}
                label={t('settings.shareApp')}
                onPress={handleShareApp}
                accessibilityLabel={t('settings.shareAppA11y')}
              />
              <SettingsRow
                icon="star.bubble.fill"
                iconColor={Brand.primary}
                label={t('settings.rateUs')}
                onPress={handleRateUs}
                accessibilityLabel={t('settings.rateUsA11y')}
              />
              <SettingsRow
                icon="megaphone.fill"
                iconColor={Brand.primary}
                label={t('settings.requestFeature')}
                onPress={handleRequestFeature}
                accessibilityLabel={t('settings.requestFeatureA11y')}
                trailing={
                  <SymbolView
                    tintColor={theme.glassIconMuted}
                    name={'arrow.up.right.square' as any}
                    size={16}
                    weight="semibold"
                  />
                }
              />
              <SettingsRow
                icon="envelope.fill"
                iconColor={Brand.primary}
                label={t('settings.supportEmail')}
                onPress={handleOpenSupport}
                accessibilityLabel={t('settings.supportEmailA11y')}
                trailing={
                  <SymbolView
                    tintColor={theme.glassIconMuted}
                    name={'arrow.up.right.square' as any}
                    size={16}
                    weight="semibold"
                  />
                }
              />
              <SettingsRow
                icon="doc.text.fill"
                iconColor={Brand.primary}
                label={t('settings.termsConditions')}
                onPress={handleOpenTerms}
                accessibilityLabel={t('settings.termsConditionsA11y')}
                trailing={
                  <SymbolView
                    tintColor={theme.glassIconMuted}
                    name={'arrow.up.right.square' as any}
                    size={16}
                    weight="semibold"
                  />
                }
              />
              <SettingsRow
                icon="lock.shield.fill"
                iconColor={Brand.primary}
                label={t('settings.privacyPolicy')}
                onPress={handleOpenPrivacy}
                accessibilityLabel={t('settings.privacyPolicyA11y')}
                trailing={
                  <SymbolView
                    tintColor={theme.glassIconMuted}
                    name={'arrow.up.right.square' as any}
                    size={16}
                    weight="semibold"
                  />
                }
              />
            </SettingsGroup>

            {session ? (
              <SettingsGroup>
                <SettingsRow
                  icon="rectangle.portrait.and.arrow.right"
                  iconColor={Brand.danger}
                  label={t('settings.logOut')}
                  labelColor={Brand.danger}
                  trailing={
                    isSigningOut ? (
                      <ActivityIndicator color={Brand.danger} />
                    ) : (
                      <SymbolView
                        tintColor={theme.glassIconMuted}
                        name={'chevron.right' as any}
                        size={13}
                        weight="semibold"
                      />
                    )
                  }
                  onPress={promptLogOut}
                  disabled={isSigningOut || isDeletingAccount}
                  accessibilityLabel={t('settings.logOutA11y')}
                  accessibilityState={{ disabled: isSigningOut || isDeletingAccount }}
                />
                <SettingsRow
                  icon="trash.fill"
                  iconColor={Brand.danger}
                  label={t('settings.deleteAccount' as any) as string}
                  labelColor={Brand.danger}
                  trailing={
                    isDeletingAccount ? (
                      <ActivityIndicator color={Brand.danger} />
                    ) : (
                      <SymbolView
                        tintColor={theme.glassIconMuted}
                        name={'chevron.right' as any}
                        size={13}
                        weight="semibold"
                      />
                    )
                  }
                  onPress={promptDeleteAccount}
                  disabled={isSigningOut || isDeletingAccount}
                  accessibilityLabel={t('settings.deleteAccountA11y' as any) as string}
                  accessibilityState={{ disabled: isSigningOut || isDeletingAccount }}
                />
              </SettingsGroup>
            ) : null}

            <View className="items-center gap-1 pt-2">
              <ThemedText
                className="text-[11px] font-semibold uppercase tracking-[1.4px]"
                style={{ color: theme.glassTextFaint }}>
                {t('common.brand')}
              </ThemedText>
              <ThemedText
                className="text-[12px] font-medium leading-5 tabular-nums"
                style={{ color: theme.glassTextMuted }}>
                {t('settings.appVersion', { version: appVersion })}
              </ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TabGlassScreenRoot>
  );
}

function formatPermissionStatus(status: string, t: TFunction): string {
  switch (status) {
    case 'granted':
    case 'authorized':
      return t('settings.permissionAllowed');
    case 'denied':
      return t('settings.permissionDenied');
    case 'restricted':
      return t('settings.permissionRestricted');
    case 'not-determined':
    case 'undetermined':
      return t('settings.permissionNotRequested');
    case 'unavailable':
      return t('settings.permissionUnavailable');
    default:
      return t('settings.permissionUnknown');
  }
}
