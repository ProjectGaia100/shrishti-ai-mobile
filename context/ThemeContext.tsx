// ─── Theme Context ────────────────────────────────────────────────────────────
// Provides isDark + a full theme color object derived from settings.darkMode.
// Wrap the app in <ThemeProvider> then call useTheme() anywhere.
import React, { createContext, useContext, useMemo } from 'react';
import { useApp } from './AppContext';

// ─── Theme color tokens ───────────────────────────────────────────────────────
export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgSecondary: string;
  // Cards / surfaces
  card: string;
  cardBorder: string;
  cardActive: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Fixed accents (same in both themes)
  accentBlue: string;
  accentOrange: string;
  accentRed: string;
  accentGreen: string;
  accentYellow: string;
  accentPurple: string;
  // Tab bar / gradient
  tabBarBg: string;
  // Status bar style
  statusBar: 'light' | 'dark';
  // Input / divider
  inputBg: string;
  divider: string;
  // Screen gradient start / end
  gradientTop: string;
  gradientBottom: string;
}

const DARK: ThemeColors = {
  bg: '#0F172A',
  bgSecondary: '#1E293B',
  card: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardActive: 'rgba(255,255,255,0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textMuted: 'rgba(255,255,255,0.45)',
  accentBlue: '#60A5FA',
  accentOrange: '#FB923C',
  accentRed: '#F87171',
  accentGreen: '#4ADE80',
  accentYellow: '#FACC15',
  accentPurple: '#A78BFA',
  tabBarBg: '#0F172A',
  statusBar: 'light',
  inputBg: 'rgba(255,255,255,0.06)',
  divider: 'rgba(255,255,255,0.07)',
  gradientTop: '#0F172A',
  gradientBottom: '#1E293B',
};

const LIGHT: ThemeColors = {
  bg: '#F1F5F9',
  bgSecondary: '#FFFFFF',
  card: 'rgba(0,0,0,0.04)',
  cardBorder: 'rgba(0,0,0,0.08)',
  cardActive: 'rgba(99,102,241,0.12)',
  textPrimary: '#0F172A',
  textSecondary: 'rgba(15,23,42,0.70)',
  textMuted: 'rgba(15,23,42,0.45)',
  accentBlue: '#2563EB',
  accentOrange: '#EA580C',
  accentRed: '#DC2626',
  accentGreen: '#16A34A',
  accentYellow: '#CA8A04',
  accentPurple: '#7C3AED',
  tabBarBg: '#F1F5F9',
  statusBar: 'dark',
  inputBg: 'rgba(0,0,0,0.05)',
  divider: 'rgba(0,0,0,0.07)',
  gradientTop: '#E2E8F0',
  gradientBottom: '#F1F5F9',
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: DARK,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = settings.darkMode;
    return { isDark, colors: isDark ? DARK : LIGHT };
  }, [settings.darkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
