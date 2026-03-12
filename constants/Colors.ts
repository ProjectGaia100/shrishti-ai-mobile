// ─── Weather App Color Palette ───────────────────────────────────────────────
export const Colors = {
  // Background gradients by weather condition
  gradients: {
    clear_day: ['#2563EB', '#60A5FA', '#93C5FD'] as const,
    clear_night: ['#0F172A', '#1E1B4B', '#312E81'] as const,
    clouds: ['#334155', '#475569', '#64748B'] as const,
    rain: ['#1E293B', '#334155', '#1E3A5F'] as const,
    storm: ['#0F172A', '#1E1B4B', '#4A1942'] as const,
    snow: ['#CBD5E1', '#94A3B8', '#64748B'] as const,
    mist: ['#475569', '#64748B', '#94A3B8'] as const,
    default: ['#1E293B', '#334155', '#475569'] as const,
  },
  // Card & surface colors
  card: 'rgba(255, 255, 255, 0.12)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardActive: 'rgba(255, 255, 255, 0.2)',
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  // Accent colors
  accentBlue: '#60A5FA',
  accentOrange: '#FB923C',
  accentRed: '#F87171',
  accentGreen: '#4ADE80',
  accentYellow: '#FACC15',
  accentPurple: '#A78BFA',
};

// Map OpenWeather condition codes to gradient keys
export function getGradientForCondition(
  conditionId: number,
  icon: string
): readonly [string, string, string] {
  const isNight = icon.endsWith('n');

  if (conditionId >= 200 && conditionId < 300) return Colors.gradients.storm;
  if (conditionId >= 300 && conditionId < 600) return Colors.gradients.rain;
  if (conditionId >= 600 && conditionId < 700) return Colors.gradients.snow;
  if (conditionId >= 700 && conditionId < 800) return Colors.gradients.mist;
  if (conditionId === 800) return isNight ? Colors.gradients.clear_night : Colors.gradients.clear_day;
  if (conditionId > 800) return Colors.gradients.clouds;

  return Colors.gradients.default;
}
