import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type PlanDateContextValue = {
  selectedDate: Date;
  setSelectedDate: (next: Date) => void;
};

const PlanDateContext = createContext<PlanDateContextValue | null>(null);

export function PlanDateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDateState] = useState(() => new Date());

  const setSelectedDate = useCallback((next: Date) => {
    setSelectedDateState(new Date(next));
  }, []);

  const value = useMemo(
    () => ({ selectedDate, setSelectedDate }),
    [selectedDate, setSelectedDate],
  );

  return <PlanDateContext.Provider value={value}>{children}</PlanDateContext.Provider>;
}

export function usePlanDate(): PlanDateContextValue {
  const context = useContext(PlanDateContext);
  if (!context) {
    throw new Error('usePlanDate must be used within PlanDateProvider');
  }
  return context;
}
