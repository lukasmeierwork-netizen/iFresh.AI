import React from 'react';

import AppTabs from '@/components/layout/app-tabs';

/**
 * Tabbed section of the app (native bottom tabs). Kept in the `(tabs)` group so
 * the root layout can stack full-screen routes above the tab UI when needed.
 */
export default function TabsGroupLayout() {
  return <AppTabs />;
}
