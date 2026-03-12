// ─── AsyncStorage Service ────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH: '@weatherwise_auth',
  SETTINGS: '@weatherwise_settings',
  LOCATIONS: '@weatherwise_locations',
  PREMIUM: '@weatherwise_premium',
  DEFAULT_LOCATION: '@weatherwise_default_loc',
};

export interface UserData {
  name: string;
  email: string;
  avatar?: string;
}

export interface AppSettings {
  tempUnit: 'C' | 'F';
  windUnit: 'kmh' | 'mph';
  pressureUnit: 'hPa' | 'mb';
  darkMode: boolean;
  notifications: boolean;
}

export interface SavedLocation {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export const StorageService = {
  // ─── Auth ────────────────────────────────────────────
  async getAuth(): Promise<UserData | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.AUTH);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to parse auth data:', error);
      await AsyncStorage.removeItem(KEYS.AUTH); // Clear corrupted data
      return null;
    }
  },
  async setAuth(user: UserData): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTH, JSON.stringify(user));
  },
  async clearAuth(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.AUTH);
  },

  // ─── Settings ────────────────────────────────────────
  async getSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to parse settings data:', error);
      await AsyncStorage.removeItem(KEYS.SETTINGS); // Clear corrupted data
      return null;
    }
  },
  async setSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ─── Locations ───────────────────────────────────────
  async getLocations(): Promise<SavedLocation[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LOCATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to parse locations data:', error);
      await AsyncStorage.removeItem(KEYS.LOCATIONS); // Clear corrupted data
      return [];
    }
  },
  async setLocations(locations: SavedLocation[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.LOCATIONS, JSON.stringify(locations));
  },

  // ─── Premium ────────────────────────────────────────
  async getPremium(): Promise<boolean> {
    const data = await AsyncStorage.getItem(KEYS.PREMIUM);
    return data === 'true';
  },
  async setPremium(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.PREMIUM, value.toString());
  },

  // ─── Default Location ──────────────────────────────
  async getDefaultLocationId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.DEFAULT_LOCATION);
  },
  async setDefaultLocationId(id: string | null): Promise<void> {
    if (id) {
      await AsyncStorage.setItem(KEYS.DEFAULT_LOCATION, id);
    } else {
      await AsyncStorage.removeItem(KEYS.DEFAULT_LOCATION);
    }
  },
};
