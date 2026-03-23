// ─── App Context (Global State) ──────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { supabase, DbProfile, DbSettings, DbSavedLocation, getSessionSafe } from '../utils/supabase';
import {
  StorageService,
  SavedLocation,
  AppSettings,
  UserData,
} from '../services/storage';
import { LOCATION_PRECISION_DECIMALS } from '../constants/AppConstants';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AppContextType {
  // Auth
  isLoggedIn: boolean;
  user: UserData | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<{ error: string | null }>;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Locations
  savedLocations: SavedLocation[];
  addLocation: (location: Omit<SavedLocation, 'id'>) => Promise<boolean>;
  removeLocation: (id: string) => Promise<void>;
  setDefaultLocation: (id: string | null) => Promise<void>;
  defaultLocation: SavedLocation | null;

  // Premium
  isPremium: boolean;
  setPremium: (value: boolean) => Promise<void>;

  // Loading
  isLoading: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  tempUnit: 'C',
  windUnit: 'kmh',
  pressureUnit: 'hPa',
  darkMode: true,
  notifications: true,
};

// ─── Helpers: map DB rows → app types ────────────────────────────────────────
function dbSettingsToApp(row: DbSettings): AppSettings {
  return {
    tempUnit: row.temp_unit,
    windUnit: row.wind_unit,
    pressureUnit: row.pressure_unit,
    darkMode: row.dark_mode,
    notifications: row.notifications,
  };
}

function dbLocationToApp(row: DbSavedLocation): SavedLocation {
  return {
    id: row.id,
    city: row.city,
    country: row.country,
    lat: Number(row.lat),
    lon: Number(row.lon),
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isPremium, setIsPremiumState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);

  // ─── Load user data from Supabase after login ─────────────────────────────
  const loadUserData = useCallback(async (userId: string, userEmail: string) => {
    try {
      const [profileRes, settingsRes, locationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('settings').select('*').eq('user_id', userId).single(),
        supabase.from('saved_locations').select('*').eq('user_id', userId).order('created_at'),
      ]);

      const profile = profileRes.data as DbProfile | null;
      const settingsRow = settingsRes.data as DbSettings | null;
      const locationsRows = (locationsRes.data ?? []) as DbSavedLocation[];

      const userData: UserData = {
        name: profile?.name ?? userEmail.split('@')[0],
        email: userEmail,
        avatar: profile?.avatar_url ?? undefined,
      };
      setUser(userData);
      setIsLoggedIn(true);
      setIsPremiumState(profile?.is_premium ?? false);
      await StorageService.setAuth(userData);

      if (settingsRow) {
        const appSettings = dbSettingsToApp(settingsRow);
        setSettings(appSettings);
        await StorageService.setSettings(appSettings);
      }

      const appLocations = locationsRows.map(dbLocationToApp);
      setSavedLocations(appLocations);
      await StorageService.setLocations(appLocations);

      // Resolve default location id
      const defaultRow = locationsRows.find((l) => l.is_default);
      const defaultId = defaultRow?.id ?? null;
      setDefaultLocationId(defaultId);
      await StorageService.setDefaultLocationId(defaultId);
    } catch (e) {
      console.error('loadUserData error:', e);
    }
  }, []);

  // ─── Bootstrap on mount: check existing Supabase session ─────────────────
  useEffect(() => {
    let mounted = true;

    // Hard safety: force-clear spinner after 5s no matter what
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 5000);

    const bootstrap = async () => {
      try {
        // Race getSession() against a 4s timeout to prevent infinite spinner
        const session = await Promise.race([
          getSessionSafe(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);

        if (session?.user && mounted) {
          await loadUserData(session.user.id, session.user.email ?? '');
        } else {
          // Fall back to AsyncStorage cache for offline use
          const [authData, settingsData, locationsData, premiumData, defaultLocId] =
            await Promise.all([
              StorageService.getAuth(),
              StorageService.getSettings(),
              StorageService.getLocations(),
              StorageService.getPremium(),
              StorageService.getDefaultLocationId(),
            ]);

          if (!mounted) return;

          if (authData) {
            if (authData.avatar?.includes('ui-avatars.com')) {
              delete authData.avatar;
              await StorageService.setAuth(authData);
            }
            setIsLoggedIn(true);
            setUser(authData);
          }
          if (settingsData) setSettings({ ...DEFAULT_SETTINGS, ...settingsData });
          if (locationsData?.length) setSavedLocations(locationsData);
          if (premiumData) setIsPremiumState(true);
          if (defaultLocId) setDefaultLocationId(defaultLocId);
        }
      } catch (e) {
        console.error('Bootstrap error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    bootstrap();

    // Listen for auth state changes (token refresh, sign out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
        setSettings(DEFAULT_SETTINGS);
        setSavedLocations([]);
        setIsPremiumState(false);
        setDefaultLocationId(null);
        await StorageService.clearAuth();
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        // Already handled in login/signup; this handles refresh cases
        if (!isLoggedIn) {
          await loadUserData(session.user.id, session.user.email ?? '');
          if (mounted) setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        await loadUserData(data.user.id, data.user.email ?? email);
      }
      return { error: null };
    },
    [loadUserData],
  );

  const signup = useCallback(
    async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        // Update the auto-created profile name
        await supabase.from('profiles').update({ name }).eq('id', data.user.id);
        await loadUserData(data.user.id, data.user.email ?? email);
      }
      return { error: null };
    },
    [loadUserData],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    setSettings(DEFAULT_SETTINGS);
    setSavedLocations([]);
    setIsPremiumState(false);
    setDefaultLocationId(null);
    await StorageService.clearAuth();
  }, []);

  const updateProfileName = useCallback(
    async (name: string): Promise<{ error: string | null }> => {
      const trimmed = name.trim();
      if (!trimmed) return { error: 'Name cannot be empty' };

      const session = await getSessionSafe();
      if (!session?.user) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);

      if (error) return { error: error.message };

      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, name: trimmed };
        StorageService.setAuth(updated).catch(() => {
          // Ignore cache write failures; source of truth remains Supabase.
        });
        return updated;
      });

      return { error: null };
    },
    [],
  );

  // ─── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const next = { ...settings, ...updates };
      setSettings(next);
      await StorageService.setSettings(next);

      // Sync to Supabase if logged in
      const session = await getSessionSafe();
      if (session?.user) {
        await supabase.from('settings').update({
          temp_unit: next.tempUnit,
          wind_unit: next.windUnit,
          pressure_unit: next.pressureUnit,
          dark_mode: next.darkMode,
          notifications: next.notifications,
          updated_at: new Date().toISOString(),
        }).eq('user_id', session.user.id);
      }
    },
    [settings],
  );

  // ─── Locations ────────────────────────────────────────────────────────────
  const addLocation = useCallback(
    async (location: Omit<SavedLocation, 'id'>): Promise<boolean> => {
      if (!isPremium && savedLocations.length >= 3) return false;
      const exists = savedLocations.some(
        (l) =>
          l.lat.toFixed(LOCATION_PRECISION_DECIMALS) ===
            location.lat.toFixed(LOCATION_PRECISION_DECIMALS) &&
          l.lon.toFixed(LOCATION_PRECISION_DECIMALS) ===
            location.lon.toFixed(LOCATION_PRECISION_DECIMALS),
      );
      if (exists) return false;

      const session = await getSessionSafe();

      if (session?.user) {
        // Insert into Supabase; use the returned UUID as the id
        const { data, error } = await supabase
          .from('saved_locations')
          .insert({
            user_id: session.user.id,
            city: location.city,
            country: location.country,
            lat: location.lat,
            lon: location.lon,
            is_default: false,
          })
          .select()
          .single();

        if (error || !data) return false;

        const newLoc = dbLocationToApp(data as DbSavedLocation);
        const updated = [...savedLocations, newLoc];
        setSavedLocations(updated);
        await StorageService.setLocations(updated);
        return true;
      } else {
        // Offline fallback
        const newLoc: SavedLocation = { ...location, id: Date.now().toString() };
        const updated = [...savedLocations, newLoc];
        setSavedLocations(updated);
        await StorageService.setLocations(updated);
        return true;
      }
    },
    [savedLocations, isPremium],
  );

  const removeLocation = useCallback(
    async (id: string) => {
      const updated = savedLocations.filter((l) => l.id !== id);
      setSavedLocations(updated);
      await StorageService.setLocations(updated);
      if (defaultLocationId === id) {
        setDefaultLocationId(null);
        await StorageService.setDefaultLocationId(null);
      }

      const session = await getSessionSafe();
      if (session?.user) {
        await supabase.from('saved_locations').delete().eq('id', id).eq('user_id', session.user.id);
      }
    },
    [savedLocations, defaultLocationId],
  );

  const setDefaultLocation = useCallback(
    async (id: string | null) => {
      setDefaultLocationId(id);
      await StorageService.setDefaultLocationId(id);

      const session = await getSessionSafe();
      if (session?.user) {
        // Clear all defaults then set the new one
        await supabase
          .from('saved_locations')
          .update({ is_default: false })
          .eq('user_id', session.user.id);
        if (id) {
          await supabase
            .from('saved_locations')
            .update({ is_default: true })
            .eq('id', id)
            .eq('user_id', session.user.id);
        }
      }
    },
    [],
  );

  // ─── Premium ──────────────────────────────────────────────────────────────
  const setPremium = useCallback(async (value: boolean) => {
    setIsPremiumState(value);
    await StorageService.setPremium(value);

    const session = await getSessionSafe();
    if (session?.user) {
      await supabase.from('profiles').update({ is_premium: value }).eq('id', session.user.id);
    }
  }, []);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const defaultLocation = useMemo(
    () => savedLocations.find((l) => l.id === defaultLocationId) ?? null,
    [savedLocations, defaultLocationId],
  );

  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      user,
      login,
      signup,
      logout,
      updateProfileName,
      settings,
      updateSettings,
      savedLocations,
      addLocation,
      removeLocation,
      setDefaultLocation,
      defaultLocation,
      isPremium,
      setPremium,
      isLoading,
    }),
    [
      isLoggedIn,
      user,
      login,
      signup,
      logout,
      updateProfileName,
      settings,
      updateSettings,
      savedLocations,
      addLocation,
      removeLocation,
      setDefaultLocation,
      defaultLocation,
      isPremium,
      setPremium,
      isLoading,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
