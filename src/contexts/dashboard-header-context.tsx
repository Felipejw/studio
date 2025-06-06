
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

interface DashboardHeaderContextType {
  dailyResult: number | null;
  isLoadingDailyResult: boolean;
  setDailyResult: (result: number | null) => void;
  setIsLoadingDailyResult: (loading: boolean) => void;
  lastUpdated: number | null; // To help trigger re-renders if needed
}

const DashboardHeaderContext = createContext<DashboardHeaderContextType | undefined>(undefined);

export function DashboardHeaderProvider({ children }: { children: ReactNode }) {
  const [dailyResult, setDailyResultState] = useState<number | null>(null);
  const [isLoadingDailyResult, setIsLoadingDailyResultState] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);


  const setDailyResult = (result: number | null) => {
    setDailyResultState(result);
    setLastUpdated(Date.now());
  };

  const setIsLoadingDailyResult = (loading: boolean) => {
    setIsLoadingDailyResultState(loading);
    setLastUpdated(Date.now());
  };

  const contextValue = useMemo(() => ({
    dailyResult,
    isLoadingDailyResult,
    setDailyResult,
    setIsLoadingDailyResult,
    lastUpdated,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [dailyResult, isLoadingDailyResult, lastUpdated]);

  return (
    <DashboardHeaderContext.Provider value={contextValue}>
      {children}
    </DashboardHeaderContext.Provider>
  );
}

export function useDashboardHeader() {
  const context = useContext(DashboardHeaderContext);
  if (context === undefined) {
    throw new Error('useDashboardHeader must be used within a DashboardHeaderProvider');
  }
  return context;
}
