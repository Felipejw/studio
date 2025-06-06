
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';

interface DashboardHeaderContextType {
  dailyResult: number | null;
  isLoadingDailyResult: boolean;
  setDailyResult: (result: number | null) => void;
  setIsLoadingDailyResult: (loading: boolean) => void;
}

const DashboardHeaderContext = createContext<DashboardHeaderContextType | undefined>(undefined);

export function DashboardHeaderProvider({ children }: { children: ReactNode }) {
  const [dailyResult, setDailyResultState] = useState<number | null>(null);
  const [isLoadingDailyResult, setIsLoadingDailyResultState] = useState<boolean>(true);

  const setDailyResult = useCallback((result: number | null) => {
    setDailyResultState(result);
  }, []); // setDailyResultState is stable

  const setIsLoadingDailyResult = useCallback((loading: boolean) => {
    setIsLoadingDailyResultState(loading);
  }, []); // setIsLoadingDailyResultState is stable

  const contextValue = useMemo(() => ({
    dailyResult,
    isLoadingDailyResult,
    setDailyResult,
    setIsLoadingDailyResult,
  }), [dailyResult, isLoadingDailyResult, setDailyResult, setIsLoadingDailyResult]);

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
