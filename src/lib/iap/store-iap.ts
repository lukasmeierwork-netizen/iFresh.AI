import { Platform } from "react-native";
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  hasActiveSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from "expo-iap";
import type {
  AndroidSubscriptionOfferInput,
  ProductSubscription,
  Purchase,
} from "expo-iap";

function isPurchaseUserCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === ErrorCode.UserCancelled;
}

/** Default App Store / Play subscription SKUs (override with EXPO_PUBLIC_PLAN_CATALOG_ID_*). */
const DEFAULT_PRO_SUBSCRIPTION_SKUS = {
  weekly: "com.tb.weekly",
  monthly: "com.tb.monthly",
  yearly: "com.tb.yearly",
} as const;

const trimEnv = (value: string | undefined) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted.length > 0 ? unquoted : null;
};

/** App Store / Play subscription product IDs (configure in ASC + Play Console). */
export function getProSubscriptionProductIds(): string[] {
  const weekly =
    trimEnv(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_WEEKLY) ??
    DEFAULT_PRO_SUBSCRIPTION_SKUS.weekly;
  const monthly =
    trimEnv(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_MONTHLY) ??
    DEFAULT_PRO_SUBSCRIPTION_SKUS.monthly;
  const yearly =
    trimEnv(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_YEARLY) ??
    DEFAULT_PRO_SUBSCRIPTION_SKUS.yearly;
  return [weekly, monthly, yearly];
}

export function isStoreIapConfigured(): boolean {
  return getProSubscriptionProductIds().length > 0;
}

export function isStoreIapSupportedPlatform(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

let initPromise: Promise<void> | null = null;

export async function ensureStoreIapConnection(): Promise<boolean> {
  if (!isStoreIapSupportedPlatform()) return false;
  if (!isStoreIapConfigured()) return false;
  if (!initPromise) {
    initPromise = Promise.resolve()
      .then(() => initConnection())
      .then(() => undefined)
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  try {
    await initPromise;
    return true;
  } catch {
    return false;
  }
}

export async function fetchProSubscriptionProducts(): Promise<
  ProductSubscription[]
> {
  const skus = getProSubscriptionProductIds();
  if (skus.length === 0) return [];
  const ok = await ensureStoreIapConnection();
  if (!ok) return [];
  const raw = await fetchProducts({ skus, type: "subs" });
  const list = raw ?? [];
  return list.filter((p): p is ProductSubscription => p.type === "subs");
}

export async function hasProSubscriptionAccess(): Promise<boolean> {
  const ids = getProSubscriptionProductIds();
  if (ids.length === 0) return false;
  const ok = await ensureStoreIapConnection();
  if (!ok) return false;
  try {
    return await hasActiveSubscriptions(ids);
  } catch {
    return false;
  }
}

export async function restoreStorePurchases(): Promise<void> {
  const ok = await ensureStoreIapConnection();
  if (!ok) throw new Error("Could not connect to the app store.");
  await restorePurchases();
}

export function pickAndroidSubscriptionOffer(
  product: ProductSubscription,
): AndroidSubscriptionOfferInput | null {
  if (product.platform !== "android") return null;
  const legacy = product.subscriptionOfferDetailsAndroid?.[0];
  if (legacy?.offerToken)
    return { sku: product.id, offerToken: legacy.offerToken };
  const offer = product.subscriptionOffers?.find((o) =>
    Boolean(o.offerTokenAndroid),
  );
  if (offer?.offerTokenAndroid)
    return { sku: product.id, offerToken: offer.offerTokenAndroid };
  return null;
}

export async function purchaseProSubscription(
  sku: string,
  product?: ProductSubscription,
): Promise<Purchase> {
  const ok = await ensureStoreIapConnection();
  if (!ok) throw new Error("Could not connect to the app store.");

  return new Promise((resolve, reject) => {
    const unsubOk = purchaseUpdatedListener(async (purchase) => {
      if (purchase.productId !== sku) return;
      unsubOk.remove();
      unsubErr.remove();
      try {
        await finishTransaction({ purchase, isConsumable: false });
        resolve(purchase);
      } catch (e) {
        reject(
          e instanceof Error ? e : new Error("Failed to finalize purchase."),
        );
      }
    });
    const unsubErr = purchaseErrorListener((error) => {
      if (error.productId && error.productId !== sku) return;
      unsubOk.remove();
      unsubErr.remove();
      if (isPurchaseUserCancelled(error)) {
        reject(
          Object.assign(new Error(error.message || "Purchase cancelled"), {
            userCancelled: true,
          }),
        );
      } else {
        reject(new Error(error.message || "Purchase failed."));
      }
    });

    void (async () => {
      try {
        if (Platform.OS === "ios") {
          await requestPurchase({
            type: "subs",
            request: { apple: { sku } },
          });
        } else {
          const androidProduct =
            product?.id === sku && product.platform === "android"
              ? product
              : (await fetchProSubscriptionProducts()).find(
                  (p) => p.id === sku && p.platform === "android",
                );
          const androidOffer = androidProduct
            ? pickAndroidSubscriptionOffer(androidProduct)
            : null;
          if (!androidOffer) {
            unsubOk.remove();
            unsubErr.remove();
            reject(
              new Error(
                "Missing subscription offer for this product on Android.",
              ),
            );
            return;
          }
          await requestPurchase({
            type: "subs",
            request: {
              google: {
                skus: [sku],
                subscriptionOffers: [androidOffer],
              },
            },
          });
        }
      } catch (e) {
        unsubOk.remove();
        unsubErr.remove();
        reject(e instanceof Error ? e : new Error("Purchase failed."));
      }
    })();
  });
}
