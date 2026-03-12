// ─── TabBarHeightContext ──────────────────────────────────────────────────────
// Shares the real measured tab bar height so screens can position content above it.
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabBarHeightContextValue {
  tabBarHeight: number;
  setTabBarHeight: (h: number) => void;
}

const TabBarHeightContext = createContext<TabBarHeightContextValue>({
  tabBarHeight: 80,
  setTabBarHeight: () => {},
});

export function TabBarHeightProvider({ children }: { children: React.ReactNode }) {
  const [tabBarHeight, setTabBarHeightState] = useState(80);
  const setTabBarHeight = useCallback((h: number) => {
    if (h > 0) setTabBarHeightState(h);
  }, []);
  return (
    <TabBarHeightContext.Provider value={{ tabBarHeight, setTabBarHeight }}>
      {children}
    </TabBarHeightContext.Provider>
  );
}

export function useTabBarHeight() {
  return useContext(TabBarHeightContext);
}
