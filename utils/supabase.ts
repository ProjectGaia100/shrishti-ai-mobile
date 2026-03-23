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

function isInvalidRefreshTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid refresh token') ||
    normalized.includes('refresh token not found')
  );
}

export async function getSessionSafe(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // Ignore clean-up failures and continue as signed out.
        }
        return null;
      }
      throw error;
    }
    return data.session;
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore clean-up failures and continue as signed out.
      }
      return null;
    }
    throw error;
  }
}
