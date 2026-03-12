// ─── Custom hook for fetching weather data ──────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  WeatherData,
  fetchWeatherByCoords,
  fetchWeatherByCity,
} from '../services/weatherApi';

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchCity: (city: string) => Promise<void>;
  fetchCoords: (lat: number, lon: number) => Promise<void>;
  fetchByGPS: () => Promise<void>;
  currentCity: string;
}

export function useWeather(): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState('');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Fetch weather using GPS location
  const fetchByGPS = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Search for a city instead.');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setLastCoords({ lat: latitude, lon: longitude });

      const weatherData = await fetchWeatherByCoords(latitude, longitude);
      setData(weatherData);
      setCurrentCity(weatherData.current.city);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather by specific coords (for saved locations)
  const fetchCoords = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      setLastCoords({ lat, lon });

      const weatherData = await fetchWeatherByCoords(lat, lon);
      setData(weatherData);
      setCurrentCity(weatherData.current.city);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather by city name
  const searchCity = useCallback(async (city: string) => {
    try {
      setLoading(true);
      setError(null);

      const weatherData = await fetchWeatherByCity(city);
      setData(weatherData);
      setCurrentCity(weatherData.current.city);
    } catch (err: any) {
      setError(err.message || 'City not found.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh current data (skip cache for manual refresh)
  const refresh = useCallback(async () => {
    setError(null); // Reset error state before retrying
    if (lastCoords) {
      try {
        setLoading(true);
        const weatherData = await fetchWeatherByCoords(lastCoords.lat, lastCoords.lon, true); // Skip cache
        setData(weatherData);
        setCurrentCity(weatherData.current.city);
      } catch (err: any) {
        setError(err.message || 'Failed to refresh weather data.');
      } finally {
        setLoading(false);
      }
    } else if (currentCity) {
      await searchCity(currentCity);
    } else {
      await fetchByGPS();
    }
  }, [lastCoords, currentCity, searchCity, fetchByGPS]);

  // Initial fetch on mount
  useEffect(() => {
    fetchByGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  return { data, loading, error, refresh, searchCity, fetchCoords, fetchByGPS, currentCity };
}
