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

  const getAqiLabel = (aqi: number | undefined): string => {
    switch (aqi) {
      case 1:
        return 'Good';
      case 2:
        return 'Fair';
      case 3:
        return 'Moderate';
      case 4:
        return 'Poor';
      case 5:
        return 'Very Poor';
      default:
        return '--';
    }
  };

  const getAqiSubtext = (aqi: number | undefined): string => {
    switch (aqi) {
      case 1:
        return 'Low pollution';
      case 2:
        return 'Acceptable air';
      case 3:
        return 'Sensitive caution';
      case 4:
        return 'Unhealthy air';
      case 5:
        return 'Very unhealthy air';
      default:
        return 'Air quality unavailable';
    }
  };

  const getAqiColor = (aqi: number | undefined): string => {
    switch (aqi) {
      case 1:
        return '#4ADE80';
      case 2:
        return '#FACC15';
      case 3:
        return '#FB923C';
      case 4:
        return '#F87171';
      case 5:
        return '#B91C1C';
      default:
        return 'rgba(255,255,255,0.25)';
    }
  };

  const getAqiPercent = (aqi: number | undefined): number => {
    if (!aqi || aqi < 1 || aqi > 5) return 0;
    return ((aqi - 1) / 4) * 100;
  };

  const aqiSeverityColors = ['#4ADE80', '#FACC15', '#FB923C', '#F87171', '#B91C1C'];

  const details: DetailItem[] = [
    {
      icon: <MaterialCommunityIcons name="molecule-co2" size={22} color={Colors.accentOrange} />,
      title: 'AIR QUALITY',
      value: getAqiLabel(weather.aqi),
      subtitle: getAqiSubtext(weather.aqi),
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
              {item.title === 'AIR QUALITY' ? (
                <>
                  <View style={styles.cardIcon}>{item.icon}</View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.aqiContentRow}>
                    <View style={styles.aqiTextWrap}>
                      <Text style={[styles.cardValue, styles.aqiSeverityText, { color: getAqiColor(weather.aqi) }]}>{item.value}</Text>
                      <Text style={styles.cardSub}>{item.subtitle}</Text>
                      <View style={styles.aqiBarWrap}>
                        <View style={styles.aqiBarTrack}>
                          <View style={styles.aqiSeverityRow}>
                            {aqiSeverityColors.map((color, idx) => (
                              <View
                                key={idx}
                                style={[
                                  styles.aqiSeveritySegment,
                                  {
                                    backgroundColor: color,
                                    marginRight: idx === aqiSeverityColors.length - 1 ? 0 : 3,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          {weather.aqi ? (
                            <View
                              style={[
                                styles.aqiThumb,
                                {
                                  left: `${getAqiPercent(weather.aqi)}%`,
                                  backgroundColor: getAqiColor(weather.aqi),
                                },
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.aqiBarLabels}>
                          <Text style={styles.aqiBarLabelText}>Low</Text>
                          <Text style={styles.aqiBarLabelText}>High</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardIcon}>{item.icon}</View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardValue}>{item.value}</Text>
                  <Text style={styles.cardSub}>{item.subtitle}</Text>
                </>
              )}
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
  aqiContentRow: {
    width: '100%',
    marginTop: 4,
  },
  aqiTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  aqiBarWrap: {
    marginTop: 10,
  },
  aqiBarTrack: {
    position: 'relative',
    height: 14,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  aqiSeverityRow: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  aqiSeveritySegment: {
    flex: 1,
    borderRadius: 9999,
  },
  aqiThumb: {
    position: 'absolute',
    top: -5,
    marginLeft: -9,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  aqiBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  aqiBarLabelText: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },
  aqiSeverityText: {
    fontWeight: '600',
  },
});
