// ─── Hourly Forecast ─────────────────────────────────────────────────────────
// Horizontal scrollable list of hourly weather predictions
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,                                                                                                                                                                                                                                                                                                                                                  
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { HourlyItem, getIconUrl } from '../services/weatherApi';
import { convertTemp } from '../utils/helpers';
import { AppSettings } from '../services/storage';
import { ANIMATION_DURATION_FAST, ANIMATION_DELAY_SHORT, NOW_TIME_THRESHOLD_SECONDS } from '../constants/AppConstants';

interface Props {
  data: HourlyItem[];
  timezone: number; // timezone offset in seconds
  settings: AppSettings;
}

export default function HourlyForecast({ data, timezone, settings }: Props) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_SHORT,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_SHORT,
        useNativeDriver: true,
      }),
    ]);
    
    animation.start();
    
    // Cleanup: stop animation on unmount
    return () => {
      animation.stop();
    };
  }, []);

  // Format time from unix timestamp using timezone offset
  const formatTime = (dt: number, index: number): string => {
    // Show "Now" only if within 30 minutes of current time
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(dt - now);
    if (diff < NOW_TIME_THRESHOLD_SECONDS && index === 0) return 'Now';
    
    const date = new Date((dt + timezone) * 1000);
    const hours = date.getUTCHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h} ${ampm}`;
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
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.headerText}>HOURLY FORECAST</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {data.map((item, index) => (
            <View key={item.dt || index} style={styles.hourItem}>
              <Text style={styles.time}>{formatTime(item.dt ?? 0, index)}</Text>
              <Image
                source={{ uri: getIconUrl(item.icon || '01d', '2x') }}
                style={styles.icon}
              />
              <Text style={styles.temp}>{convertTemp(item.temp ?? 0, settings.tempUnit)}°</Text>
              {(item.pop ?? 0) > 0 && (
                <View style={styles.popRow}>
                  <Ionicons name="water" size={10} color={Colors.accentBlue} />
                  <Text style={styles.pop}>{item.pop}%</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
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
    marginBottom: 12,
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
  scrollView: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingRight: 10,
  },
  hourItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 50,
  },
  time: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  icon: {
    width: 40,
    height: 40,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  temp: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  popRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    
  },
  pop: {
    fontSize: 10,
    color: Colors.accentBlue,
  },
});
