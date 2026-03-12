// ─── App-Wide Constants ──────────────────────────────────────────────────────

// ─── API & Cache ─────────────────────────────────────────────────────────────
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Retry Configuration ─────────────────────────────────────────────────────
export const RETRY_MAX_ATTEMPTS = 3;
export const RETRY_INITIAL_DELAY_MS = 1000; // 1 second
export const RETRY_MAX_DELAY_MS = 5000; // 5 seconds

// ─── Location Precision ──────────────────────────────────────────────────────
export const LOCATION_PRECISION_DECIMALS = 4; // ~11 meters precision

// ─── Weather Data ────────────────────────────────────────────────────────────
export const HOURLY_FORECAST_ITEMS = 8; // 24 hours (3-hour intervals)
export const DAILY_FORECAST_DAYS = 7;
export const MS_TO_KMH_MULTIPLIER = 3.6; // Convert m/s to km/h
export const METERS_TO_KM_DIVISOR = 1000;
export const VISIBILITY_GOOD_THRESHOLD_KM = 10;
export const VISIBILITY_MODERATE_THRESHOLD_KM = 5;
export const HUMIDITY_HIGH_THRESHOLD = 60; // percentage
export const NOW_TIME_THRESHOLD_SECONDS = 1800; // 30 minutes

// ─── Animation Durations ─────────────────────────────────────────────────────
export const ANIMATION_DURATION_FAST = 600;
export const ANIMATION_DURATION_SLOW = 800;
export const ANIMATION_DELAY_SHORT = 200;
export const ANIMATION_DELAY_MEDIUM = 400;
export const ANIMATION_DELAY_LONG = 600;

// ─── UI Constants ────────────────────────────────────────────────────────────
export const DRAWER_ANIMATION_DELAY_MS = 300;
export const MIN_TEMP_BAR_WIDTH_PERCENT = 8;

// ─── FlatList Performance ────────────────────────────────────────────────────
export const FLATLIST_INITIAL_NUM_TO_RENDER = 10;
export const FLATLIST_MAX_TO_RENDER_PER_BATCH = 5;
export const FLATLIST_WINDOW_SIZE = 5;
