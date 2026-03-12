// ─── Helper Utilities ────────────────────────────────────────────────────────

export function convertTemp(celsius: number, unit: 'C' | 'F'): number {
  if (unit === 'F') return Math.round((celsius * 9) / 5 + 32);
  return celsius;
}

export function convertWindSpeed(kmh: number, unit: 'kmh' | 'mph'): number {
  if (unit === 'mph') return Math.round(kmh * 0.621371);
  return kmh;
}

export function getTempSymbol(unit: 'C' | 'F'): string {
  return unit === 'F' ? '°F' : '°C';
}

export function getWindLabel(unit: 'kmh' | 'mph'): string {
  return unit === 'mph' ? 'mph' : 'km/h';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}
