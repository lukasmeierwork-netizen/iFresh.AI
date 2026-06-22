import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";

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

export function getRevenueCatIosApiKey(): string | null {
  return trimEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY);
}

/** Must match the entitlement identifier configured in the RevenueCat dashboard. */
export function getRevenueCatEntitlementId(): string {
  return trimEnv(process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID) ?? "premium";
}

export function isStoreIapConfigured(): boolean {
  return Boolean(getRevenueCatIosApiKey());
}

export function isStoreIapSupportedPlatform(): boolean {
  return Platform.OS === "ios";
}

export type ProSubscriptionPlan = {
  id: string;
  displayPrice: string;
  title: string;
  package: PurchasesPackage;
};

let configurePromise: Promise<void> | null = null;
let linkedUserId: string | null = null;

function hasEntitlement(customerInfo: CustomerInfo): boolean {
  const entitlementId = getRevenueCatEntitlementId();
  return customerInfo.entitlements.active[entitlementId] != null;
}

function sortPlans(plans: ProSubscriptionPlan[]): ProSubscriptionPlan[] {
  const rank = (id: string) => {
    const lower = id.toLowerCase();
    if (lower.includes("week")) return 0;
    if (lower.includes("month")) return 1;
    if (lower.includes("year") || lower.includes("annual")) return 2;
    return 3;
  };
  return [...plans].sort((a, b) => rank(a.id) - rank(b.id));
}

export function isPurchaseUserCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { userCancelled?: boolean; code?: string | number };
  if (candidate.userCancelled === true) return true;
  return candidate.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export async function ensureStoreIapConnection(options?: {
  userId?: string | null;
}): Promise<boolean> {
  if (!isStoreIapSupportedPlatform()) return false;

  const apiKey = getRevenueCatIosApiKey();
  if (!apiKey) return false;

  if (!configurePromise) {
    configurePromise = (async () => {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.WARN);
      }
      Purchases.configure({ apiKey });
    })().catch((err) => {
      configurePromise = null;
      throw err;
    });
  }

  try {
    await configurePromise;

    const userId = options?.userId?.trim() ?? null;
    if (userId && linkedUserId !== userId) {
      const currentAppUserID = await Purchases.getAppUserID();
      if (currentAppUserID !== userId) {
        await Purchases.logIn(userId);
      }
      linkedUserId = userId;
    } else if (!userId) {
      linkedUserId = null;
    }

    return true;
  } catch {
    return false;
  }
}

export async function fetchProSubscriptionProducts(): Promise<ProSubscriptionPlan[]> {
  const ok = await ensureStoreIapConnection();
  if (!ok) return [];

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return [];

  return sortPlans(
    current.availablePackages.map((pkg) => ({
      id: pkg.identifier,
      displayPrice: pkg.product.priceString,
      title: pkg.product.title,
      package: pkg,
    })),
  );
}

export async function hasProSubscriptionAccess(): Promise<boolean> {
  const ok = await ensureStoreIapConnection();
  if (!ok) return false;

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return hasEntitlement(customerInfo);
  } catch {
    return false;
  }
}

export async function restoreStorePurchases(): Promise<void> {
  const ok = await ensureStoreIapConnection();
  if (!ok) throw new Error("Could not connect to RevenueCat.");
  await Purchases.restorePurchases();
}

/** Opens the native App Store subscription sheet for this app (iOS 13+). */
export async function showStoreManageSubscriptions(options?: {
  userId?: string | null;
}): Promise<boolean> {
  if (!isStoreIapSupportedPlatform()) return false;

  const ok = await ensureStoreIapConnection(options);
  if (!ok) return false;

  try {
    await Purchases.showManageSubscriptions();
    return true;
  } catch {
    return false;
  }
}

export async function purchaseProSubscription(
  _sku: string,
  product?: ProSubscriptionPlan,
): Promise<void> {
  const pkg = product?.package;
  if (!pkg) throw new Error("Subscription plan not found.");

  const ok = await ensureStoreIapConnection();
  if (!ok) throw new Error("Could not connect to RevenueCat.");

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (!hasEntitlement(customerInfo)) {
      throw new Error(
        "Purchase completed but an active subscription was not detected yet.",
      );
    }
  } catch (err) {
    if (isPurchaseUserCancelled(err)) {
      throw Object.assign(new Error("Purchase cancelled"), {
        userCancelled: true,
      });
    }
    throw err instanceof Error ? err : new Error("Purchase failed.");
  }
}
