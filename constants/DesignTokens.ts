// ─── Design System Tokens ────────────────────────────────────────────────────
// Comprehensive design system for consistent UI across the app

// ─── Spacing Scale ───────────────────────────────────────────────────────────
// Use these for margins, paddings, and gaps
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius Scale ─────────────────────────────────────────────────────
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// ─── Typography Scale ────────────────────────────────────────────────────────
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
  '6xl': 96,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const fontWeight = {
  light: '200' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 1,
  wider: 1.5,
  widest: 2,
} as const;

// ─── Icon Sizes ──────────────────────────────────────────────────────────────
export const iconSize = {
  xs: 14,
  sm: 18,
  base: 20,
  md: 22,
  lg: 26,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
} as const;

// ─── Opacity Scale ───────────────────────────────────────────────────────────
export const opacity = {
  0: 0,
  5: 0.05,
  10: 0.10,
  20: 0.20,
  40: 0.40,
  60: 0.60,
  80: 0.80,
  100: 1.0,
} as const;

// ─── Blur Intensity ──────────────────────────────────────────────────────────
export const blur = {
  light: 10,
  medium: 20,
  strong: 30,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
// Professional shadows for card elevation
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Touch Targets ───────────────────────────────────────────────────────────
export const touchTarget = {
  minimum: 44, // iOS HIG minimum touch target
  comfortable: 48,
  large: 56,
} as const;

// ─── Animation Durations ─────────────────────────────────────────────────────
export const duration = {
  instant: 100,
  fast: 200,
  base: 300,
  moderate: 400,
  slow: 600,
  slower: 800,
} as const;

// ─── Animation Springs ───────────────────────────────────────────────────────
export const spring = {
  gentle: {
    tension: 100,
    friction: 10,
  },
  snappy: {
    tension: 200,
    friction: 15,
  },
  bouncy: {
    tension: 300,
    friction: 20,
  },
} as const;

// ─── Z-Index Layers ──────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  toast: 60,
} as const;

// ─── Common Layout Values ────────────────────────────────────────────────────
export const layout = {
  screenPadding: spacing.lg,
  cardMargin: spacing.base,
  sectionGap: spacing.xl,
  maxContentWidth: 600,
} as const;

// ─── Breakpoints (for future responsive design) ──────────────────────────────
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Convert opacity number to rgba string
 * @example opacityToRgba('#FFFFFF', opacity[20]) => 'rgba(255, 255, 255, 0.2)'
 */
export function opacityToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get spacing value as a number
 * @example getSpacing('md', 'lg') => 12 + 20 = 32
 */
export function getSpacing(...keys: (keyof typeof spacing)[]): number {
  return keys.reduce((sum, key) => sum + spacing[key], 0);
}

// ─── Type Exports ────────────────────────────────────────────────────────────
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type FontSize = keyof typeof fontSize;
export type IconSize = keyof typeof iconSize;
export type Opacity = keyof typeof opacity;
export type Shadow = keyof typeof shadows;
