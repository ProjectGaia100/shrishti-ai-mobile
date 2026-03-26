import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session } from '@supabase/supabase-js';

// ─── DB Row Types ─────────────────────────────────────────────────────────────
export interface DbProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSettings {
  id: string;
  user_id: string;
  temp_unit: 'C' | 'F';
  wind_unit: 'kmh' | 'mph';
  pressure_unit: 'hPa' | 'mb';
  dark_mode: boolean;
  notifications: boolean;
  updated_at: string;
}

export interface DbSavedLocation {
  id: string;
  user_id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  is_default: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isInvalidRefreshTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid refresh token') ||
    normalized.includes('refresh token not found')
  );
}

async function clearLocalAuth() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Ignore clean-up failures
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ─── Global auth error handler ────────────────────────────────────────────────
// Catches refresh token errors from any Supabase call so the app never crashes
supabase.auth.onAuthStateChange(async (event) => {
  if (event === 'SIGNED_OUT') return;
  if (event === 'TOKEN_REFRESHED') return;
  if (event === 'INITIAL_SESSION') return;
});

// Wrap getSession to silently handle stale refresh tokens on app startup
const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
supabase.auth.getSession = async () => {
  try {
    return await originalGetSession();
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearLocalAuth();
      return { data: { session: null }, error: null };
    }
    throw error;
  }
};

// ─── Safe session getter ──────────────────────────────────────────────────────
export async function getSessionSafe(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        await clearLocalAuth();
        return null;
      }
      throw error;
    }
    return data.session;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearLocalAuth();
      return null;
    }
    throw error;
  }
}
