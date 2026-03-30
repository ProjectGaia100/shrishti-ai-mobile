import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { CurrentWeather } from '../services/weatherApi';
import { ANIMATION_DELAY_MEDIUM, ANIMATION_DURATION_FAST } from '../constants/AppConstants';

interface Props {
  weather: CurrentWeather;
}

const UPDATE_INTERVAL_MS = 60 * 1000;

function formatLocalTime(unix: number | undefined, timezone: number): string {
  if (!unix) return '--:--';
  const date = new Date((unix + timezone) * 1000);
  const h = date.getUTCHours();
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export default function SunPathCard({ weather }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [nowUnix, setNowUnix] = useState<number>(Math.floor(Date.now() / 1000));
  // Preview state is temporarily disabled.
  // const [previewIndex, setPreviewIndex] = useState<number>(-1);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_MEDIUM,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION_FAST,
        delay: ANIMATION_DELAY_MEDIUM,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowUnix(Math.floor(Date.now() / 1000));
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const sunrise = weather.sunrise ?? 0;
  const sunset = weather.sunset ?? 0;
  const daylightDuration = Math.max(sunset - sunrise, 1);

  // Preview functionality is temporarily disabled.
  // const previewSteps = [0.08, 0.35, 0.62, 0.9];
  // const effectiveNowUnix =
  //   previewIndex >= 0
  //     ? sunrise + Math.floor(daylightDuration * previewSteps[previewIndex % previewSteps.length])
  //     : nowUnix;
  const effectiveNowUnix = nowUnix;

  const { isDaytime, sunProgress, sunHeightPx } = useMemo(() => {
    const raw = (effectiveNowUnix - sunrise) / daylightDuration;
    const clamped = Math.max(0, Math.min(1, raw));
    const day = raw >= 0 && raw <= 1;

    const arcHeight = Math.sin(Math.PI * clamped) * 44;
    const height = 12 + arcHeight;

    return {
      isDaytime: day,
      sunProgress: clamped,
      sunHeightPx: height,
    };
  }, [effectiveNowUnix, sunrise, daylightDuration]);

  const sunriseText = formatLocalTime(weather.sunrise, weather.timezone ?? 0);
  const sunsetText = formatLocalTime(weather.sunset, weather.timezone ?? 0);
  const skyColors = isDaytime
    ? ['rgba(191,219,254,0.18)', 'rgba(125,211,252,0.12)', 'rgba(255,255,255,0.02)']
    : ['rgba(30,41,59,0.26)', 'rgba(15,23,42,0.22)', 'rgba(2,6,23,0.08)'];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sunny-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.headerText}>SUN TRACK</Text>
          </View>
          {/* Preview toggle UI is temporarily disabled.
          {__DEV__ ? (
            <TouchableOpacity
              onPress={() => {
                setPreviewIndex((prev) => (prev >= previewSteps.length - 1 ? -1 : prev + 1));
              }}
              style={styles.previewBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.previewBtnText}>{previewIndex >= 0 ? 'Preview On' : 'Preview Day'}</Text>
            </TouchableOpacity>
          ) : null}
          */}
        </View>

        <View style={styles.sunScene}>
          <LinearGradient colors={skyColors} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.skyFill} />

          {isDaytime ? (
            <View
              style={[
                styles.sun,
                {
                  left: `${sunProgress * 100}%`,
                  bottom: sunHeightPx,
                },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Sunrise</Text>
            <Text style={styles.timeValue}>{sunriseText}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Sunset</Text>
            <Text style={styles.timeValue}>{sunsetText}</Text>
          </View>
        </View>
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
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  // Preview button styles are kept for later reuse.
  // previewBtn: {
  //   paddingHorizontal: 10,
  //   paddingVertical: 5,
  //   borderRadius: 999,
  //   backgroundColor: 'rgba(255,255,255,0.12)',
  //   borderWidth: 1,
  //   borderColor: 'rgba(255,255,255,0.15)',
  // },
  // previewBtnText: {
  //   fontSize: 10,
  //   fontWeight: '600',
  //   color: Colors.textSecondary,
  //   letterSpacing: 0.4,
  // },
  sunScene: {
    position: 'relative',
    height: 94,
    marginTop: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  skyFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sun: {
    position: 'absolute',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FACC15',
    borderWidth: 1,
    borderColor: 'rgba(255,244,179,0.95)',
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    flex: 1,
  },
  timeDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  timeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  timeValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});