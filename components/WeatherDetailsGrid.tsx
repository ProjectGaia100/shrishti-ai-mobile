// ─── Weather Details Grid ────────────────────────────────────────────────────
// Shows detailed weather metrics in a beautiful card grid
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { CurrentWeather } from '../services/weatherApi';
import { convertTemp, convertWindSpeed, getTempSymbol, getWindLabel } from '../utils/helpers';
import { AppSettings } from '../services/storage';
import { 
  ANIMATION_DURATION_FAST, 
  ANIMATION_DELAY_LONG, 
  VISIBILITY_GOOD_THRESHOLD_KM, 
  VISIBILITY_MODERATE_THRESHOLD_KM, 
  HUMIDITY_HIGH_THRESHOLD 
} from '../constants/AppConstants';

interface Props {
  weather: CurrentWeather;
  settings: AppSettings;
}

interface DetailItem {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}

export default function WeatherDetailsGrid({ weather, settings }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_LONG,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_LONG,
        useNativeDriver: true,
      }),
    ]);
    
    animation.start();
    
    // Cleanup: stop animation on unmount
    return () => {
      animation.stop();
    };
  }, []);

  // Format sunrise/sunset times with date awareness
  const formatTime = (unix: number | undefined, tz: number): string => {
    if (!unix) return '--:--';
    const date = new Date((unix + tz) * 1000);
    const now = new Date();
    const h = date.getUTCHours();
    const m = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const timeStr = `${h % 12 || 12}:${m} ${ampm}`;
    
    // Check if date is different from today
    const dateDay = date.getUTCDate();
    const todayDay = now.getUTCDate();
    
    if (dateDay !== todayDay) {
      // Add "Tomorrow" or date indicator if different day
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dateDay === tomorrow.getDate()) {
        return `${timeStr} (Tomorrow)`;
      }
    }
    
    return timeStr;
  };

  const details: DetailItem[] = [
    {
      icon: <Feather name="sunrise" size={22} color={Colors.accentOrange} />,
      title: 'SUNRISE',
      value: formatTime(weather.sunrise, weather.timezone ?? 0),
      subtitle: `Sunset ${formatTime(weather.sunset, weather.timezone ?? 0)}`,
    },
    {
      icon: <Feather name="wind" size={22} color={Colors.accentBlue} />,
      title: 'WIND',
      value: `${convertWindSpeed(weather.wind_speed ?? 0, settings.windUnit)} ${getWindLabel(settings.windUnit)}`,
      subtitle: 'Speed',
    },
    {
      icon: <Ionicons name="water-outline" size={22} color={Colors.accentBlue} />,
      title: 'HUMIDITY',
      value: `${weather.humidity ?? 0}%`,
      subtitle: (weather.humidity ?? 0) > HUMIDITY_HIGH_THRESHOLD ? 'High humidity' : 'Comfortable',
    },
    {
      icon: <Feather name="thermometer" size={22} color={Colors.accentRed} />,
      title: 'FEELS LIKE',
      value: `${convertTemp(weather.feels_like ?? weather.temp ?? 0, settings.tempUnit)}${getTempSymbol(settings.tempUnit)}`,
      subtitle: (weather.feels_like ?? 0) > (weather.temp ?? 0) ? 'Warmer than actual' : 'Cooler than actual',
    },
    {
      icon: <Feather name="eye" size={22} color={Colors.accentPurple} />,
      title: 'VISIBILITY',
      value: `${weather.visibility ?? 0} km`,
      subtitle: (weather.visibility ?? 0) >= VISIBILITY_GOOD_THRESHOLD_KM ? 'Crystal clear' : (weather.visibility ?? 0) >= VISIBILITY_MODERATE_THRESHOLD_KM ? 'Moderate' : 'Poor',
    },
    {
      icon: <MaterialCommunityIcons name="gauge" size={22} color={Colors.accentGreen} />,
      title: 'PRESSURE',
      value: `${weather.pressure ?? 0} ${settings.pressureUnit}`,
      subtitle: 'Atmospheric',
    },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.grid}>
        {details.map((item, idx) => (
          <View key={idx} style={styles.cardWrapper}>
            <View style={styles.card}>
              <View style={styles.cardIcon}>{item.icon}</View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardValue}>{item.value}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48.5%',
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  card: {
    padding: 16,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardIcon: {
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
