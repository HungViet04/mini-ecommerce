/**
 * Loading Context
 * Global loading state for the whole app
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  startGlobalLoading,
  stopGlobalLoading,
  resetGlobalLoading,
  subscribeGlobalLoading,
} from '../utils/loadingStore';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeGlobalLoading((snapshot) => {
      setIsLoading(snapshot.isLoading);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      isLoading,
      startLoading: startGlobalLoading,
      stopLoading: stopGlobalLoading,
      resetLoading: resetGlobalLoading,
    }),
    [isLoading]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export default LoadingContext;
