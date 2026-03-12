// ─── Alerts Screen ───────────────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawer } from '../../context/DrawerContext';
import { Colors } from '../../constants/Colors';

// ─── Mock Alert Data ─────────────────────────────────────────────────────────
interface WeatherAlert {
  id: string;
  type: string;
  location: string;
  severity: 'red' | 'orange' | 'yellow';
  date: string;
  time: string;
  description: string;
  icon: string;
}

const MOCK_ALERTS: WeatherAlert[] = [
  {
    id: '1',
    type: 'Severe Cyclone Warning',
    location: 'Bay of Bengal Coast',
    severity: 'red',
    date: 'Feb 14, 2026',
    time: '14:30 UTC',
    description:
      'Category 4 cyclone expected to make landfall within 48 hours. Wind speeds up to 220 km/h. Coastal areas advised to evacuate immediately.',
    icon: 'thunderstorm-outline',
  },
  {
    id: '2',
    type: 'Flood Risk Alert',
    location: 'Mumbai Metropolitan Region',
    severity: 'orange',
    date: 'Feb 14, 2026',
    time: '10:00 UTC',
    description:
      'Heavy rainfall expected over next 72 hours. River levels rising above danger mark. Low-lying areas at risk of flooding.',
    icon: 'water-outline',
  },
  {
    id: '3',
    type: 'Extreme Heatwave',
    location: 'Central India — Nagpur, Vidarbha',
    severity: 'red',
    date: 'Feb 14, 2026',
    time: '08:00 UTC',
    description:
      'Temperatures expected to exceed 48°C. Health advisory: Stay hydrated, avoid outdoor activities during 11 AM — 4 PM peak hours.',
    icon: 'sunny-outline',
  },
  {
    id: '4',
    type: 'Heavy Rainfall Warning',
    location: 'Chennai, Tamil Nadu',
    severity: 'yellow',
    date: 'Feb 15, 2026',
    time: '06:00 UTC',
    description:
      'Moderate to heavy rainfall expected. Water-logging possible in low-lying areas. Drive with caution on major highways.',
    icon: 'rainy-outline',
  },
  {
    id: '5',
    type: 'Air Quality Emergency',
    location: 'New Delhi NCR',
    severity: 'orange',
    date: 'Feb 13, 2026',
    time: '12:00 UTC',
    description:
      'AQI levels in severe category (400+). Outdoor activities strongly discouraged. N95 masks recommended for essential outdoor movement.',
    icon: 'cloud-outline',
  },
];

const SEVERITY_CONFIG = {
  red: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.25)',
    label: 'CRITICAL',
    gradient: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)'] as const,
  },
  orange: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    label: 'WARNING',
    gradient: ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.03)'] as const,
  },
  yellow: {
    color: '#FACC15',
    bg: 'rgba(250, 204, 21, 0.12)',
    border: 'rgba(250, 204, 21, 0.2)',
    label: 'ADVISORY',
    gradient: ['rgba(250, 204, 21, 0.12)', 'rgba(250, 204, 21, 0.02)'] as const,
  },
};

// ─── Pulse Animation for severe alerts ───────────────────────────────────────
function PulseIndicator({ color }: { color: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.8,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <View style={[styles.pulseDot, { backgroundColor: color }]} />
    </View>
  );
}

// ─── Alert Card Component ────────────────────────────────────────────────────
function AlertCard({ alert, index }: { alert: WeatherAlert; index: number }) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const config = SEVERITY_CONFIG[alert.severity];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.alertCard,
        {
          borderColor: config.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[config.gradient[0], config.gradient[1]]}
        style={styles.alertCardGrad}
      >
        {/* Header */}
        <View style={styles.alertHeader}>
          <View style={styles.alertIconBg}>
            <Ionicons name={alert.icon as any} size={22} color={config.color} />
          </View>
          <View style={styles.alertHeaderInfo}>
            <Text style={styles.alertType}>{alert.type}</Text>
            <View style={styles.alertLocationRow}>
              <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.alertLocation}>{alert.location}</Text>
            </View>
          </View>
          {alert.severity === 'red' ? (
            <PulseIndicator color={config.color} />
          ) : (
            <View style={[styles.severityBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
              <Text style={[styles.severityText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.alertDesc}>{alert.description}</Text>

        {/* Footer */}
        <View style={styles.alertFooter}>
          <View style={styles.alertDateRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.alertDate}>
              {alert.date} • {alert.time}
            </Text>
          </View>
          {alert.severity === 'red' && (
            <View style={[styles.severityBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
              <Text style={[styles.severityText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const { openDrawer } = useDrawer();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const criticalCount = MOCK_ALERTS.filter((a) => a.severity === 'red').length;
  const warningCount = MOCK_ALERTS.filter((a) => a.severity === 'orange').length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E1B2E', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.menuBtn}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Weather Alerts</Text>
            <View style={styles.alertCountBadge}>
              <Ionicons name="warning" size={12} color={Colors.accentRed} />
              <Text style={styles.alertCountText}>{MOCK_ALERTS.length}</Text>
            </View>
          </View>

          {/* Summary Bar */}
          <View style={styles.summaryBar}>
            <View style={[styles.summaryChip, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <View style={[styles.summaryDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.summaryText, { color: '#EF4444' }]}>
                {criticalCount} Critical
              </Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <View style={[styles.summaryDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.summaryText, { color: '#F59E0B' }]}>
                {warningCount} Warning
              </Text>
            </View>
          </View>

          {/* Alert Cards */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {MOCK_ALERTS.map((alert, index) => (
              <AlertCard key={alert.id} alert={alert} index={index} />
            ))}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>
                Demo data for preview purposes. Real-time alerts will be available with API integration.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 14,
  },
  alertCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  alertCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentRed,
  },
  // Summary
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  // Alert Card
  alertCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
  },
  alertCardGrad: {
    padding: 18,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertHeaderInfo: {
    flex: 1,
  },
  alertType: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  alertLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertLocation: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  alertDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Pulse
  pulseContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
});
