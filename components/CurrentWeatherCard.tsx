// ─── Current Weather Card (Hero section) ─────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { CurrentWeather, getIconUrl } from '../services/weatherApi';
import { convertTemp, convertWindSpeed, getTempSymbol, getWindLabel } from '../utils/helpers';
import { AppSettings } from '../services/storage';
import { ANIMATION_DURATION_FAST, ANIMATION_DURATION_SLOW } from '../constants/AppConstants';

interface Props {
  weather: CurrentWeather;
  settings: AppSettings;
}

export default function CurrentWeatherCard({ weather, settings }: Props) {
  // Fade-in animation for the temperature
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_SLOW,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_FAST,
        useNativeDriver: true,
      }),
    ]);
    
    animation.start();
    
    // Cleanup: stop animation on unmount
    return () => {
      animation.stop();
    };
  }, [weather.temp]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* City name + location icon */}
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={18} color={Colors.textPrimary} />
        <Text style={styles.cityName}>
          {weather.city || 'Unknown'}, {weather.country || '--'}
        </Text>
      </View>

      {/* Weather icon + temperature */}
      <View style={styles.mainRow}>
        <Image
          source={{ uri: getIconUrl(weather.icon || '01d') }}
          style={styles.icon}
        />
        <Text style={styles.temperature}>{convertTemp(weather.temp ?? 0, settings.tempUnit)}°</Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>
        {(weather.description || 'No description').charAt(0).toUpperCase() + (weather.description || 'No description').slice(1)}
      </Text>

      {/* High/Low & Feels like */}
      <View style={styles.subRow}>
        <Text style={styles.subText}>
          Feels like {convertTemp(weather.feels_like ?? weather.temp ?? 0, settings.tempUnit)}{getTempSymbol(settings.tempUnit)}
        </Text>
        <View style={styles.dot} />
        <Text style={styles.subText}>
          Wind {convertWindSpeed(weather.wind_speed ?? 0, settings.windUnit)} {getWindLabel(settings.windUnit)}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cityName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  icon: {
    width: 100,
    height: 100,
    backgroundColor: 'transparent',
  },
  temperature: {
    fontSize: 96,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: -4,
  },
  description: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
});
