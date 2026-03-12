// ─── Weather Theme Context ────────────────────────────────────────────────────
// Shares the current weather gradient tint with the TabBar so it can
// dynamically match the home screen's weather gradient.
import React, { createContext, useContext, useState, useCallback } from 'react';

interface WeatherThemeContextValue {
  /** The bottom gradient color from the active weather condition */
  tabBarTint: string;
  setTabBarTint: (color: string) => void;
}

const WeatherThemeContext = createContext<WeatherThemeContextValue>({
  tabBarTint: '#0F172A',
  setTabBarTint: () => {},
});

export function WeatherThemeProvider({ children }: { children: React.ReactNode }) {
  const [tabBarTint, setTabBarTintState] = useState('#0F172A');

  const setTabBarTint = useCallback((color: string) => {
    setTabBarTintState(color);
  }, []);

  return (
    <WeatherThemeContext.Provider value={{ tabBarTint, setTabBarTint }}>
      {children}
    </WeatherThemeContext.Provider>
  );
}

export const useWeatherTheme = () => useContext(WeatherThemeContext);
