// ─── Alerts Screen ────────────────────────────────────────────────────────────
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTabBarHeight } from '../../context/TabBarHeightContext';
import { supabase, getSessionSafe } from '../../utils/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = 'danger' | 'watch' | 'advisory' | 'normal';

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  location: string;
  description: string;
  relativeTime?: string;
  resolvedTime?: string;
  duration?: string;
}

interface AlertSection {
  title: string;
  data: Alert[];
}

interface PredictionRunRow {
  id: string;
  run_timestamp: string;
  total_locations: number;
  predictions_made: number;
  alerts_created: number;
  errors_count: number;
  duration_seconds: number | null;
  status: 'running' | 'completed' | 'failed';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function riskToSeverity(riskScore: number): Severity {
  if (riskScore >= 0.8) return 'danger';
  if (riskScore >= 0.65) return 'watch';
  return 'advisory';
}

function disasterTitle(type: string): string {
  switch (type) {
    case 'FLOOD': return 'Flood Warning';
    case 'DROUGHT': return 'Drought Alert';
    case 'STORM': return 'Severe Storm';
    case 'LANDSLIDE': return 'Landslide Risk';
    default: return `${type} Alert`;
  }
}

function disasterDescription(type: string, riskScore: number): string {
  const pct = Math.round(riskScore * 100);
  switch (type) {
    case 'FLOOD': return `Flood risk detected at ${pct}% probability. Monitor water levels and avoid low-lying areas.`;
    case 'DROUGHT': return `Drought conditions detected at ${pct}% probability. Water conservation measures advised.`;
    case 'STORM': return `Storm risk detected at ${pct}% probability. Secure loose objects and stay indoors.`;
    case 'LANDSLIDE': return `Landslide risk detected at ${pct}% probability. Avoid steep slopes and unstable terrain.`;
    default: return `Disaster risk detected at ${pct}% probability for this location.`;
  }
}

function relativeTimeStr(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function resolvedTimeStr(dateStr: string): string {
  const d = new Date(dateStr);
  return `Resolved: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function sectionTitle(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const alertDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - alertDay.getTime()) / 86400000);

  if (diffDays === 0) return '';
  if (diffDays === 1) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase();
}

// ─── Severity config ──────────────────────────────────────────────────────────
const SEV = {
  danger: {
    stripe:   '#EF4444',
    badgeBg:  'rgba(239,68,68,0.10)',
    badgeText:'#EF4444',
    label:    'DANGER',
  },
  watch: {
    stripe:   '#F97316',
    badgeBg:  'rgba(249,115,22,0.10)',
    badgeText:'#F97316',
    label:    'WATCH',
  },
  advisory: {
    stripe:   '#EAB308',
    badgeBg:  'rgba(234,179,8,0.10)',
    badgeText:'#CA8A04',
    label:    'ADVISORY',
  },
  normal: {
    stripe:   '#22C55E',
    badgeBg:  'rgba(34,197,94,0.10)',
    badgeText:'#16A34A',
    label:    'NORMAL',
  },
} as const;

// ─── Tab switcher ─────────────────────────────────────────────────────────────
const TABS = ['Recent', 'History'] as const;
type Tab = (typeof TABS)[number];
type SortBy = 'time' | 'severity';
const MAX_ALERT_ROWS = 500;
const MAX_PREDICTION_HISTORY_ROWS = 500;

const SORDER: Record<Severity, number> = { danger: 0, watch: 1, advisory: 2, normal: 3 };
function sortedSections(secs: AlertSection[], mode: SortBy): AlertSection[] {
  if (mode === 'time') return secs;
  return secs.map((sec) => ({
    ...sec,
    data: [...sec.data].sort((a, b) => SORDER[a.severity] - SORDER[b.severity]),
  }));
}

function TabSwitcher({
  active,
  onChange,
  isDark,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  isDark: boolean;
}) {
  const pillAnim = useRef(new Animated.Value(0)).current;
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: active === 'Recent' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 14,
    }).start();
  }, [active]);

  const pillX = pillAnim.interpolate({ inputRange: [0, 1], outputRange: [3, tabWidth + 3] });

  const trackBg     = isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const pillBg      = isDark ? '#1E293B' : '#FFFFFF';
  const activeColor = isDark ? '#FFFFFF' : '#0F172A';
  const mutedColor  = isDark ? 'rgba(255,255,255,0.38)' : '#94A3B8';

  return (
    <View
      style={[s.tabTrack, { backgroundColor: trackBg }]}
      onLayout={(e) => setTabWidth((e.nativeEvent.layout.width - 6) / 2)}
    >
      <Animated.View style={[s.tabPill, { width: tabWidth, backgroundColor: pillBg, transform: [{ translateX: pillX }] }]} />
      {TABS.map((tab) => (
        <Pressable key={tab} style={[s.tabBtn, { width: tabWidth }]} onPress={() => onChange(tab)}>
          <Text style={[s.tabLabel, { color: active === tab ? activeColor : mutedColor }]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({
  alert,
  index,
  isHistory,
  isDark,
  colors,
}: {
  alert: Alert;
  index: number;
  isHistory: boolean;
  isDark: boolean;
  colors: any;
}) {
  const cfg = SEV[alert.severity];
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        delay: index * 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const cardBg     = isDark ? 'rgba(22,32,48,0.72)' : '#FFFFFF';
  const borderCol  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <Animated.View style={[s.card, { backgroundColor: cardBg, borderColor: borderCol, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Colored left stripe */}
      <View style={[s.stripe, { backgroundColor: cfg.stripe }]} />

      <View style={s.cardContent}>
        {/* Top row: badge + title + timestamp */}
        <View style={s.cardTopRow}>
          <View style={s.cardTitleGroup}>
            <View style={[s.badge, { backgroundColor: cfg.badgeBg }]}>
              <Text style={[s.badgeText, { color: cfg.badgeText }]}>{cfg.label}</Text>
            </View>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{alert.title}</Text>
          </View>
          <Text style={[s.timestamp, { color: colors.textMuted }]}>
            {isHistory ? alert.resolvedTime : alert.relativeTime}
          </Text>
        </View>

        {/* Location */}
        <View style={s.locationRow}>
          <Ionicons name="location" size={12} color={colors.textMuted} />
          <Text style={[s.locationText, { color: colors.textMuted }]}>{alert.location}</Text>
        </View>

        {/* Description */}
        <Text style={[s.description, { color: isDark ? 'rgba(203,213,225,0.85)' : '#475569' }]}>
          {alert.description}
        </Text>

        {/* Duration (history only) */}
        {isHistory && alert.duration && (
          <View style={s.durationRow}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={[s.durationText, { color: colors.textMuted }]}>Duration: {alert.duration}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, colors }: { title: string; colors: any }) {
  if (!title) return null;
  return (
    <View style={s.sectionHeaderRow}>
      <Text style={[s.sectionHeaderText, { color: colors.textMuted }]}>{title}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AlertsScreen() {
  const { colors, isDark } = useTheme();
  const { tabBarHeight }   = useTabBarHeight();
  const [activeTab, setActiveTab] = useState<Tab>('Recent');
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentSections, setRecentSections] = useState<AlertSection[]>([]);
  const [historySections, setHistorySections] = useState<AlertSection[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // ── Fetch alerts from Supabase ─────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSessionSafe();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      const [alertsRes, locationsRes, runsRes] = await Promise.all([
        supabase
          .from('disaster_alerts')
          .select('id, location_id, disaster_type, risk_score, alert_sent_at')
          .eq('user_id', userId)
          .order('alert_sent_at', { ascending: false })
          .limit(MAX_ALERT_ROWS),
        supabase
          .from('saved_locations')
          .select('id, city, country')
          .eq('user_id', userId),
        supabase
          .from('prediction_runs')
          .select('id, run_timestamp, total_locations, predictions_made, alerts_created, errors_count, duration_seconds, status')
          .eq('user_id', userId)
          .order('run_timestamp', { ascending: false })
          .limit(MAX_PREDICTION_HISTORY_ROWS),
      ]);

      const alerts = alertsRes.data ?? [];
      const locations = locationsRes.data ?? [];
      const runHistory = (runsRes.data ?? []) as PredictionRunRow[];
      const lastRun = runHistory.find((run) => run.status === 'completed') ?? null;

      // Build location lookup map
      const locMap: Record<string, { city: string; country: string }> = {};
      for (const loc of locations) {
        locMap[loc.id] = { city: loc.city, country: loc.country };
      }

      // Build set of location IDs that have disaster alerts
      const alertedLocationIds = new Set(alerts.map((a) => a.location_id));

      // Split into recent (<24h) and history (>=24h)
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;

      const recentAlerts: Alert[] = [];
      for (const a of alerts) {
        const sentAt = new Date(a.alert_sent_at).getTime();
        const loc = locMap[a.location_id];
        const locationStr = loc ? `${loc.city}, ${loc.country}` : 'Unknown location';

        const alert: Alert = {
          id: a.id,
          severity: riskToSeverity(Number(a.risk_score)),
          title: disasterTitle(a.disaster_type),
          location: locationStr,
          description: disasterDescription(a.disaster_type, Number(a.risk_score)),
        };

        if (sentAt >= dayAgo) {
          alert.relativeTime = relativeTimeStr(a.alert_sent_at);
          recentAlerts.push(alert);
        }
      }

      // Add "Normal" cards for locations without disaster alerts (if prediction was run)
      if (lastRun) {
        for (const loc of locations) {
          if (!alertedLocationIds.has(loc.id)) {
            const locationStr = `${loc.city}, ${loc.country}`;
            const normalAlert: Alert = {
              id: `normal_${loc.id}`,
              severity: 'normal',
              title: 'All Clear',
              location: locationStr,
              description: 'No disaster risk detected. Last check passed successfully.',
              relativeTime: relativeTimeStr(lastRun.run_timestamp),
            };
            recentAlerts.push(normalAlert);
          }
        }
      }

      // Group recent into sections (first few + "EARLIER TODAY")
      const recentSecs: AlertSection[] = [];
      if (recentAlerts.length > 0) {
        // Sort: dangers first, then watch, advisory, normal last
        recentAlerts.sort((a, b) => SORDER[a.severity] - SORDER[b.severity]);
        const top = recentAlerts.slice(0, 3);
        const earlier = recentAlerts.slice(3);
        recentSecs.push({ title: '', data: top });
        if (earlier.length > 0) {
          recentSecs.push({ title: 'EARLIER TODAY', data: earlier });
        }
      }

      // Group prediction run history by date
      const historyGroups: Record<string, Alert[]> = {};
      for (const run of runHistory) {
        const severity: Severity =
          run.status === 'failed'
            ? 'danger'
            : run.alerts_created > 0
              ? 'watch'
              : run.errors_count > 0
                ? 'advisory'
                : 'normal';

        const historyItem: Alert = {
          id: `run_${run.id}`,
          severity,
          title:
            run.alerts_created > 0
              ? `${run.alerts_created} alert${run.alerts_created === 1 ? '' : 's'} generated`
              : 'Prediction cycle completed',
          location: `${run.predictions_made}/${run.total_locations} locations analyzed`,
          description:
            run.errors_count > 0
              ? `Cycle completed with ${run.errors_count} error${run.errors_count === 1 ? '' : 's'} and ${run.alerts_created} alert${run.alerts_created === 1 ? '' : 's'}.`
              : `Cycle completed successfully with ${run.alerts_created} alert${run.alerts_created === 1 ? '' : 's'} generated.`,
          resolvedTime: resolvedTimeStr(run.run_timestamp),
          duration: run.duration_seconds != null ? `${run.duration_seconds}s` : undefined,
        };

        const key = sectionTitle(run.run_timestamp);
        if (!historyGroups[key]) historyGroups[key] = [];
        historyGroups[key].push(historyItem);
      }
      const historySecs: AlertSection[] = Object.entries(historyGroups).map(([title, data]) => ({ title, data }));

      setRecentSections(recentSecs);
      setHistorySections(historySecs);
    } catch (err) {
      console.error('[AlertsScreen] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  const sections = sortedSections(
    activeTab === 'Recent' ? recentSections : historySections,
    sortBy,
  );

  const activeCount  = recentSections.reduce((n, s) => n + s.data.length, 0);
  const dangerCount  = recentSections.flatMap((s) => s.data).filter((a) => a.severity === 'danger').length;

  return (
    <View style={[s.root, { backgroundColor: isDark ? '#0D1117' : '#F8FAFC' }]}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <Animated.View style={[s.flex, { opacity: fadeAnim }]}>

          {/* ── Header ──────────────────────────────────────────── */}
          <View style={[s.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            {/* Left: filter count */}
            <View style={{ width: 32 }} />

            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Alerts</Text>

            {/* Right: filter icon */}
            <TouchableOpacity style={s.filterBtn} onPress={() => setShowSortMenu((v) => !v)}>
              <Ionicons
                name="options-outline"
                size={20}
                color={showSortMenu ? '#3B82F6' : colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Sort Menu ───────────────────────────────────────── */}
          {showSortMenu && (
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => setShowSortMenu(false)}
            >
              <View
                style={[
                  s.sortMenu,
                  {
                    backgroundColor: isDark ? '#1C2433' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
                  },
                ]}
              >
                {(['time', 'severity'] as SortBy[]).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      s.sortOption,
                      sortBy === opt && {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      },
                    ]}
                    onPress={() => { setSortBy(opt); setShowSortMenu(false); }}
                  >
                    <Ionicons
                      name={opt === 'time' ? 'time-outline' : 'warning-outline'}
                      size={15}
                      color={sortBy === opt ? '#3B82F6' : colors.textMuted}
                    />
                    <Text
                      style={[
                        s.sortOptionText,
                        { color: sortBy === opt ? '#3B82F6' : colors.textPrimary },
                      ]}
                    >
                      {opt === 'time' ? 'Newest first' : 'By severity'}
                    </Text>
                    {sortBy === opt && (
                      <Ionicons name="checkmark" size={15} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          )}

          {/* ── Status bar ──────────────────────────────────────── */}
          <View style={s.statusBar}>
            {dangerCount > 0 && (
              <View style={s.statusPill}>
                <View style={[s.statusDot, { backgroundColor: '#EF4444' }]} />
                <Text style={s.statusPillText}>{dangerCount} danger{dangerCount > 1 ? 's' : ''} active</Text>
              </View>
            )}
            <Text style={[s.statusTotal, { color: colors.textMuted }]}>
              {activeCount} active alert{activeCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* ── Tab switcher ────────────────────────────────────── */}
          <View style={s.tabRow}>
            <TabSwitcher active={activeTab} onChange={handleTabChange} isDark={isDark} />
          </View>

          {/* ── Alert list ──────────────────────────────────────── */}
          {loading ? (
            <View style={s.emptyContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={[s.emptyText, { color: colors.textMuted }]}>Loading alerts...</Text>
            </View>
          ) : sections.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.textMuted} />
              <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No alerts</Text>
              <Text style={[s.emptyText, { color: colors.textMuted }]}>
                Your saved locations are safe. Alerts will appear here when the daily prediction detects a risk.
              </Text>
            </View>
          ) : (
            <SectionList
              key={activeTab}
              sections={sections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[s.listContent, { paddingBottom: tabBarHeight + 24 }]}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => (
                <SectionHeader title={section.title} colors={colors} />
              )}
              renderItem={({ item, index }) => (
                <AlertCard
                  alert={item}
                  index={index}
                  isHistory={activeTab === 'History'}
                  isDark={isDark}
                  colors={colors}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
              onRefresh={fetchAlerts}
              refreshing={loading}
            />
          )}

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  filterBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sortMenu: {
    position: 'absolute',
    top: 52,
    right: 14,
    zIndex: 100,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 170,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sortOptionText: { fontSize: 14, fontWeight: '500' },

  // Status
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.09)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  statusTotal: { fontSize: 12, fontWeight: '500' },

  // Tab switcher
  tabRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14 },
  tabTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    height: 46,
    position: 'relative',
    alignItems: 'center',
  },
  tabPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center', height: '100%', zIndex: 1 },
  tabLabel: { fontSize: 15, fontWeight: '600' },

  // List
  listContent: { paddingHorizontal: 16 },

  // Section header
  sectionHeaderRow: { paddingTop: 14, paddingBottom: 8, paddingHorizontal: 2 },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },

  // Card
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stripe: { width: 4 },
  cardContent: { flex: 1, padding: 14, gap: 0 },

  // Card top row
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  cardTitleGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  timestamp: { fontSize: 12, fontWeight: '500', marginTop: 2, flexShrink: 0 },

  // Location
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 13, fontWeight: '500' },

  // Description
  description: { fontSize: 14, lineHeight: 21, marginBottom: 0 },

  // Duration (history)
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  durationText: { fontSize: 12, fontWeight: '500' },

  // Empty / loading state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
