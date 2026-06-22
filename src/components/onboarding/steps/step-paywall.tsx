import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { GradientButton } from '@/components/ui/gradient-button';
import { ThemedText } from '@/components/ui/themed-text';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import {
  ensureStoreIapConnection,
  fetchProSubscriptionProducts,
  hasProSubscriptionAccess,
  isPurchaseUserCancelled,
  isStoreIapConfigured,
  isStoreIapSupportedPlatform,
  purchaseProSubscription,
  restoreStorePurchases,
  type ProSubscriptionPlan,
} from '@/lib/iap/store-iap';

type Props = {
  onUnlocked: (planCatalogId: string | null) => void | Promise<void>;
};

function getPlanMeta(item: ProSubscriptionPlan): { label: string; caption: string; highlight?: string } {
  const id = item.id.toLowerCase();
  const title = item.title.toLowerCase();
  const key = `${id} ${title}`;

  if (key.includes('year') || key.includes('annual')) {
    return {
      label: 'Yearly',
      caption: 'Best long-term value',
      highlight: 'Best value',
    };
  }
  if (key.includes('month')) {
    return {
      label: 'Monthly',
      caption: 'Most popular plan',
      highlight: 'Popular',
    };
  }
  if (key.includes('week')) {
    return {
      label: 'Weekly',
      caption: 'Flexible weekly billing',
    };
  }
  return {
    label: 'Plan',
    caption: 'Choose the plan that fits you',
  };
}

export function StepPaywall({ onUnlocked }: Props) {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProSubscriptionPlan[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const hasVisiblePlans = !loading && products.length > 0;

  const loadOfferings = useCallback(async () => {
    if (!user?.id) {
      setError('You need to be signed in before starting a subscription.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (!isStoreIapSupportedPlatform()) {
        setError('Subscriptions are available on the iOS app.');
        return;
      }
      if (!isStoreIapConfigured()) {
        setError('RevenueCat is not configured. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY.');
        return;
      }

      const connected = await ensureStoreIapConnection({ userId: user.id });
      if (!connected) {
        setError('Could not connect to RevenueCat. Try again on a device with the App Store signed in.');
        return;
      }

      if (await hasProSubscriptionAccess()) {
        await Promise.resolve(onUnlocked(null));
        return;
      }

      const available = await fetchProSubscriptionProducts();
      setProducts(available);
      setSelectedProductId((prev) => prev ?? available[0]?.id ?? null);

      if (available.length === 0) {
        setError(
          'No subscription plans returned from RevenueCat. Confirm your default offering and App Store products.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  }, [onUnlocked, user?.id]);

  useEffect(() => {
    void loadOfferings();
  }, [loadOfferings]);

  const handleSubscribe = useCallback(async () => {
    if (!selectedProduct || purchaseLoading) return;
    setPurchaseLoading(true);
    setError(null);
    try {
      await purchaseProSubscription(selectedProduct.id, selectedProduct);
      if (await hasProSubscriptionAccess()) {
        await Promise.resolve(onUnlocked(selectedProduct.id));
      } else {
        setError('Purchase completed but an active subscription was not detected yet. Try Restore purchases.');
      }
    } catch (err: unknown) {
      if (!isPurchaseUserCancelled(err)) {
        setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
      }
    } finally {
      setPurchaseLoading(false);
    }
  }, [onUnlocked, purchaseLoading, selectedProduct]);

  const handleRestore = useCallback(async () => {
    if (restoreLoading) return;
    setRestoreLoading(true);
    setError(null);
    try {
      await restoreStorePurchases();
      const restored = await hasProSubscriptionAccess();
      if (restored) {
        await Promise.resolve(onUnlocked(selectedProduct?.id ?? null));
      } else {
        setError('No active subscription found to restore.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore purchases.');
    } finally {
      setRestoreLoading(false);
    }
  }, [onUnlocked, restoreLoading, selectedProduct?.id]);

  return (
    <View className="gap-5 pt-2">
      <View
        className="gap-3 rounded-3xl border px-5 py-5"
        style={{ borderColor: 'rgba(32,138,239,0.26)', backgroundColor: 'rgba(32,138,239,0.08)' }}>
        <View
          className="self-start rounded-full px-3 py-1"
          style={{ backgroundColor: 'rgba(32,138,239,0.14)' }}>
          <ThemedText className="text-[12px] font-semibold" style={{ color: '#208AEF' }}>
            EyeFresh Pro
          </ThemedText>
        </View>
        <View className="gap-2">
          <ThemedText className="text-[30px] font-semibold leading-9">Unlock your eye-care upgrade</ThemedText>
          <ThemedText themeColor="textSecondary" className="text-[15px] leading-6">
            Personalized plans and smarter daily vision tracking.
          </ThemedText>
        </View>
        <View className="gap-1">
          <ThemedText className="text-[13px] font-medium" style={{ color: '#0F172A' }}>
            • Full app access
          </ThemedText>
          <ThemedText className="text-[13px] font-medium" style={{ color: '#0F172A' }}>
            • Adaptive eye-care routine
          </ThemedText>
          <ThemedText className="text-[13px] font-medium" style={{ color: '#0F172A' }}>
            • Priority feature updates
          </ThemedText>
        </View>
      </View>

      <View className="gap-2">
        <ThemedText className="text-[18px] font-semibold">Choose your plan</ThemedText>
        <ThemedText themeColor="textSecondary" className="text-[14px] leading-5">
          Cancel anytime. Your subscription will start immediately after purchase.
        </ThemedText>
      </View>

      {loading ? (
        <View className="py-6">
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <View className="gap-3">
          {products.map((item) => {
            const selected = selectedProductId === item.id;
            const meta = getPlanMeta(item);
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedProductId(item.id)}
                style={{
                  borderRadius: 18,
                  borderWidth: selected ? 1.5 : 1,
                  borderColor: selected ? '#208AEF' : 'rgba(15,23,42,0.12)',
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  backgroundColor: selected ? 'rgba(32,138,239,0.10)' : 'rgba(255,255,255,0.72)',
                }}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <ThemedText className="text-[17px] font-semibold">{meta.label}</ThemedText>
                    <ThemedText themeColor="textSecondary" className="text-[13px]">
                      {meta.caption}
                    </ThemedText>
                  </View>
                  {meta.highlight ? (
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{ backgroundColor: selected ? '#208AEF' : 'rgba(32,138,239,0.12)' }}>
                      <ThemedText
                        className="text-[11px] font-semibold"
                        style={{ color: selected ? '#FFFFFF' : '#208AEF' }}>
                        {meta.highlight}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                <View className="mt-2 flex-row items-end justify-between">
                  <ThemedText className="text-[22px] font-semibold leading-7">{item.displayPrice}</ThemedText>
                  <ThemedText themeColor="textSecondary" className="text-[12px]">
                    {item.title}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? (
        <ThemedText className="text-[13px] leading-5" style={{ color: '#D92D20' }}>
          {error}
        </ThemedText>
      ) : null}

      {hasVisiblePlans ? (
        <>
          <GradientButton
            label={purchaseLoading ? 'Processing...' : 'Continue with subscription'}
            onPress={handleSubscribe}
            disabled={loading || !selectedProduct || purchaseLoading || restoreLoading}
            solidColor={Brand.primary}
          />

          <Pressable
            accessibilityRole="button"
            onPress={handleRestore}
            disabled={loading || purchaseLoading || restoreLoading}
            style={{ opacity: loading || purchaseLoading || restoreLoading ? 0.5 : 1 }}>
            <ThemedText className="text-[14px] font-semibold text-center" style={{ color: '#208AEF' }}>
              {restoreLoading ? 'Restoring...' : 'Restore purchases'}
            </ThemedText>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
