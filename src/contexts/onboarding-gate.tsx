import React, { createContext, useContext } from 'react';

export type OnboardingGateContextValue = {
  /** Re-query Supabase and update onboarding completion state in the root navigator. */
  invalidate: () => Promise<void>;
};

const OnboardingGateContext = createContext<OnboardingGateContextValue | null>(null);

export function OnboardingGateProvider({
  value,
  children,
}: {
  value: OnboardingGateContextValue;
  children: React.ReactNode;
}) {
  return <OnboardingGateContext.Provider value={value}>{children}</OnboardingGateContext.Provider>;
}

export function useOnboardingGate(): OnboardingGateContextValue {
  const ctx = useContext(OnboardingGateContext);
  if (!ctx) {
    throw new Error('useOnboardingGate must be used within OnboardingGateProvider');
  }
  return ctx;
}
