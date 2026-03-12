// ─── Weekly (7-Day) Forecast ─────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { DailyItem, getIconUrl } from '../services/weatherApi';
import { convertTemp } from '../utils/helpers';
import { AppSettings } from '../services/storage';
import { ANIMATION_DURATION_FAST, ANIMATION_DELAY_MEDIUM, MIN_TEMP_BAR_WIDTH_PERCENT } from '../constants/AppConstants';

interface Props {
  data: DailyItem[];
  settings: AppSettings;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeeklyForecast({ data, settings }: Props) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_MEDIUM,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_MEDIUM,
        useNativeDriver: true,
      }),
    ]);
    
    animation.start();
    
    // Cleanup: stop animation on unmount
    return () => {
      animation.stop();
    };
  }, []);

  // Find global min/max for the temperature bar
  const allMin = data.length > 0 ? Math.min(...data.map((d) => d.temp_min ?? 0)) : 0;
  const allMax = data.length > 0 ? Math.max(...data.map((d) => d.temp_max ?? 0)) : 0;
  const range = allMax - allMin || 1;

  const getDayLabel = (dt: number | undefined, idx: number): string => {
    if (!dt) return '---';
    const forecastDate = new Date(dt * 1000);
    const today = new Date();
    const isToday = forecastDate.getDate() === today.getDate() &&
                    forecastDate.getMonth() === today.getMonth() &&
                    forecastDate.getFullYear() === today.getFullYear();
    
    if (isToday) return 'Today';
    return DAYS[forecastDate.getDay()];
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.headerText}>7-DAY FORECAST</Text>
        </View>

        {data.map((item, idx) => {
          // Temperature bar positioning
          const tempMin = item.temp_min ?? 0;
          const tempMax = item.temp_max ?? 0;
          const left = ((tempMin - allMin) / range) * 100;
          const width = ((tempMax - tempMin) / range) * 100;

          return (
            <View
              key={item.dt || idx}
              style={[styles.row, idx < data.length - 1 && styles.rowBorder]}
            >
              {/* Day name */}
              <Text style={styles.day}>{getDayLabel(item.dt, idx)}</Text>

              {/* Weather icon + rain probability */}
              <View style={styles.iconCol}>
                <Image
                  source={{ uri: getIconUrl(item.icon || '01d', '2x') }}
                  style={styles.icon}
                />
                {(item.pop ?? 0) > 0 && (
                  <Text style={styles.pop}>{item.pop}%</Text>
                )}
              </View>

              {/* Min temp */}
              <Text style={styles.tempMin}>{convertTemp(tempMin, settings.tempUnit)}°</Text>

              {/* Temperature range bar */}
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { left: `${left}%`, width: `${Math.max(width, MIN_TEMP_BAR_WIDTH_PERCENT)}%` },
                  ]}
                />
              </View>

              {/* Max temp */}
              <Text style={styles.tempMax}>{convertTemp(tempMax, settings.tempUnit)}°</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  container: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  day: {
    width: 50,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  iconCol: {
    width: 55,
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  pop: {
    fontSize: 10,
    color: Colors.accentBlue,
    fontWeight: '600',
    marginTop: -2,
  },
  tempMin: {
    width: 32,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginHorizontal: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.accentOrange,
  },
  tempMax: {
    width: 32,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'left',
  },
});
