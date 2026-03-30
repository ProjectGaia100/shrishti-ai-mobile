// ─── Weather API Service ─────────────────────────────────────────────────────
// Uses OpenWeather API for current weather, hourly & daily forecasts.
// API key is loaded from environment variable EXPO_PUBLIC_OPENWEATHER_API_KEY
import axios from 'axios';
import { getCached, setCache, getCacheKey } from '../utils/cache';
import { retryWithBackoff } from '../utils/retry';
import { 
  MS_TO_KMH_MULTIPLIER, 
  METERS_TO_KM_DIVISOR, 
  HOURLY_FORECAST_ITEMS, 
  DAILY_FORECAST_DAYS 
} from '../constants/AppConstants';

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

if (!API_KEY) {
  throw new Error('❌ EXPO_PUBLIC_OPENWEATHER_API_KEY is not defined in .env file');
}

const BASE = 'https://api.openweathermap.org/data/2.5';
const GEO = 'https://api.openweathermap.org/geo/1.0';

// ─── OpenWeather API Response Types ─────────────────────────────────────────
interface OpenWeatherMain {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
}

interface OpenWeatherWeather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface OpenWeatherWind {
  speed: number;
  deg?: number;
}

interface OpenWeatherSys {
  country: string;
  sunrise: number;
  sunset: number;
}

interface OpenWeatherCurrentResponse {
  coord: { lat: number; lon: number };
  weather: OpenWeatherWeather[];
  main: OpenWeatherMain;
  wind: OpenWeatherWind;
  visibility?: number;
  dt: number;
  sys: OpenWeatherSys;
  timezone: number;
  name: string;
}

interface OpenWeatherForecastItem {
  dt: number;
  main: OpenWeatherMain;
  weather: OpenWeatherWeather[];
  pop?: number;
}

interface OpenWeatherForecastResponse {
  list: OpenWeatherForecastItem[];
}

interface OpenWeatherGeoResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

interface OpenWeatherAirPollutionItem {
  main: {
    aqi: number;
  };
}

interface OpenWeatherAirPollutionResponse {
  list: OpenWeatherAirPollutionItem[];
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  visibility: number;
  description: string;
  icon: string;
  condition_id: number;
  city: string;
  country: string;
  sunrise: number;
  sunset: number;
  aqi?: number;
  uvi?: number;
  dt: number;
  timezone: number;
}

export interface HourlyItem {
  dt: number;
  temp: number;
  icon: string;
  description: string;
  pop: number; // probability of precipitation
}

export interface DailyItem {
  dt: number;
  temp_min: number;
  temp_max: number;
  icon: string;
  description: string;
  pop: number;
  condition_id: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyItem[];
  daily: DailyItem[];
}

// ─── Fetch current weather + forecast by coordinates ─────────────────────────
export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
  skipCache: boolean = false
): Promise<WeatherData> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(lat, lon);
    if (!skipCache) {
      const cached = getCached<WeatherData>(cacheKey);
      if (cached) return cached;
    }

    // Fetch current weather and 5-day/3-hour forecast in parallel with retry
    const [currentRes, forecastRes] = await Promise.all([
      retryWithBackoff(() =>
        axios.get<OpenWeatherCurrentResponse>(`${BASE}/weather`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' },
        })
      ),
      retryWithBackoff(() =>
        axios.get<OpenWeatherForecastResponse>(`${BASE}/forecast`, {
          params: { lat, lon, appid: API_KEY, units: 'metric' },
        })
      ),
    ]);

    // AQI uses a separate endpoint; failures here should not block weather data.
    let aqi: number | undefined;
    try {
      const airRes = await retryWithBackoff(() =>
        axios.get<OpenWeatherAirPollutionResponse>(`${BASE}/air_pollution`, {
          params: { lat, lon, appid: API_KEY },
        })
      );
      aqi = airRes.data?.list?.[0]?.main?.aqi;
    } catch {
      aqi = undefined;
    }

    const c = currentRes.data;
    const f = forecastRes.data;

    // Validate weather data structure
    if (!c.weather || c.weather.length === 0) {
      throw new Error('Invalid weather data: missing weather information');
    }
    if (!c.main || !c.sys) {
      throw new Error('Invalid weather data: missing main or sys data');
    }
    if (!f.list || f.list.length === 0) {
      throw new Error('Invalid forecast data: missing forecast list');
    }

    // Build current weather object
    const current: CurrentWeather = {
      temp: Math.round(c.main.temp),
      feels_like: Math.round(c.main.feels_like),
      humidity: c.main.humidity,
      pressure: c.main.pressure,
      wind_speed: Math.round(c.wind?.speed * MS_TO_KMH_MULTIPLIER || 0), // m/s → km/h (stored as km/h)
      visibility: Math.round((c.visibility || 0) / METERS_TO_KM_DIVISOR), // m → km
      description: c.weather[0].description,
      icon: c.weather[0].icon,
      condition_id: c.weather[0].id,
      city: c.name,
      country: c.sys.country,
      sunrise: c.sys.sunrise,
      sunset: c.sys.sunset,
      aqi,
      dt: c.dt,
      timezone: c.timezone,
    };

    // Build hourly forecast (next 24 hours from 3-hour intervals)
    const hourly: HourlyItem[] = f.list.slice(0, HOURLY_FORECAST_ITEMS).map((item: OpenWeatherForecastItem) => {
      if (!item.weather || item.weather.length === 0) {
        throw new Error('Invalid forecast item: missing weather data');
      }
      return {
        dt: item.dt,
        temp: Math.round(item.main.temp),
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        pop: Math.round((item.pop || 0) * 100),
      };
    });

    // Build daily forecast (aggregate 3-hour data into daily)
    const dailyMap = new Map<string, any>();
    f.list.forEach((item: OpenWeatherForecastItem) => {
      if (!item.weather || item.weather.length === 0) return;
      
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          dt: item.dt,
          temps: [],
          icons: [],
          descriptions: [],
          pops: [],
          condition_ids: [],
        });
      }
      const day = dailyMap.get(date);
      day.temps.push(item.main.temp);
      day.icons.push(item.weather[0].icon);
      day.descriptions.push(item.weather[0].description);
      day.pops.push(item.pop || 0);
      day.condition_ids.push(item.weather[0].id);
    });

    const daily: DailyItem[] = Array.from(dailyMap.values())
      .slice(0, DAILY_FORECAST_DAYS)
      .map((day) => ({
        dt: day.dt,
        temp_min: Math.round(Math.min(...day.temps)),
        temp_max: Math.round(Math.max(...day.temps)),
        icon: day.icons[Math.floor(day.icons.length / 2)], // midday icon
        description: day.descriptions[Math.floor(day.descriptions.length / 2)],
        pop: Math.round(Math.max(...day.pops) * 100),
        condition_id: day.condition_ids[Math.floor(day.condition_ids.length / 2)],
      }));

    const result = { current, hourly, daily };
    
    // Cache the result
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Weather fetch failed: ${message}`);
    }
    throw error;
  }
}

// ─── Fetch weather by city name ──────────────────────────────────────────────
export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
  try {
    // First geocode the city to get lat/lon with retry
    const geoRes = await retryWithBackoff(() =>
      axios.get<OpenWeatherGeoResult[]>(`${GEO}/direct`, {
        params: { q: city, limit: 1, appid: API_KEY },
      })
    );

    if (!geoRes.data || geoRes.data.length === 0) {
      throw new Error('City not found. Please try another name.');
    }

    const { lat, lon } = geoRes.data[0];
    return fetchWeatherByCoords(lat, lon);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`City search failed: ${message}`);
    }
    throw error;
  }
}

// ─── Get weather icon URL ────────────────────────────────────────────────────
export function getIconUrl(iconCode: string, size: '2x' | '4x' = '4x'): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

// ─── Geocoding: Search cities ────────────────────────────────────────────────
export interface GeocodingResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  try {
    const res = await retryWithBackoff(() =>
      axios.get<OpenWeatherGeoResult[]>(`${GEO}/direct`, {
        params: { q: query, limit: 5, appid: API_KEY },
      })
    );
    return (res.data || []).map((item: OpenWeatherGeoResult) => ({
      name: item.name,
      country: item.country,
      state: item.state,
      lat: item.lat,
      lon: item.lon,
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`City search failed: ${message}`);
    }
    throw error;
  }
}
