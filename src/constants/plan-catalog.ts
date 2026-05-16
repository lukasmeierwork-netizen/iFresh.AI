const trim = (s: string | undefined) => {
  const t = (s ?? '').trim();
  return t.length > 0 ? t : null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePlanCatalogId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

/** Resolved `onboarding.plan_catalog_id` for new signups after onboarding questions. */
export function defaultPlanCatalogId(): string | null {
  return (
    normalizePlanCatalogId(trim(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_FREE)) ??
    normalizePlanCatalogId(trim(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_WEEKLY)) ??
    normalizePlanCatalogId(trim(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_MONTHLY)) ??
    normalizePlanCatalogId(trim(process.env.EXPO_PUBLIC_PLAN_CATALOG_ID_YEARLY))
  );
}
