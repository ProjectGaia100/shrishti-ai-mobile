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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTabBarHeight } from '../../context/TabBarHeightContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = 'danger' | 'watch' | 'advisory';

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  location: string;
  description: string;
  // Recent
  relativeTime?: string;
  // History
  resolvedTime?: string;
  duration?: string;
}

interface AlertSection {
  title: string;
  data: Alert[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const RECENT_SECTIONS: AlertSection[] = [
  {
    title: '',
    data: [
      {
        id: 'r1',
        severity: 'danger',
        title: 'Flood Warning',
        location: 'Yokohama, Kanagawa',
        description: 'Severe water level rise detected in Tsurumi River. Evacuation orders in effect for low-lying areas.',
        relativeTime: '2 min ago',
      },
      {
        id: 'r2',
        severity: 'watch',
        title: 'Severe Storm',
        location: 'Kawasaki City',
        description: 'Potential for high winds and localized flooding. Secure loose outdoor objects and monitor updates.',
        relativeTime: '45 min ago',
      },
      {
        id: 'r3',
        severity: 'advisory',
        title: 'Landslide Risk',
        location: 'Hakone Region',
        description: 'Saturated soil from recent rainfall increases risk of minor landslides near steep slopes.',
        relativeTime: '2 hours ago',
      },
    ],
  },
  {
    title: 'EARLIER TODAY',
    data: [
      {
        id: 'r4',
        severity: 'watch',
        title: 'Wildfire Notice',
        location: 'Chiba Prefecture',
        description: 'Dry conditions and wind speeds have increased the risk of brush fires in northern forest districts.',
        relativeTime: '6 hours ago',
      },
      {
        id: 'r5',
        severity: 'advisory',
        title: 'Coastal High Surf',
        location: 'Shonan Coast',
        description: 'Wave heights of 3–4m expected through evening. Swimming and surfing not advised.',
        relativeTime: '9 hours ago',
      },
    ],
  },
];

const HISTORY_SECTIONS: AlertSection[] = [
  {
    title: 'YESTERDAY',
    data: [
      {
        id: 'h1',
        severity: 'danger',
        title: 'Flash Flood',
        location: 'Yokohama, Kanagawa',
        description: 'Severe water level rise detected in Tsurumi River. Evacuation orders were lifted as water receded.',
        resolvedTime: 'Resolved: 21:40',
        duration: '4h 15m',
      },
      {
        id: 'h2',
        severity: 'watch',
        title: 'Strong Winds',
        location: 'Kawasaki City',
        description: 'Potential for high winds and localized gusts up to 60 km/h. Warning expired.',
        resolvedTime: 'Resolved: 15:20',
        duration: '8h 00m',
      },
    ],
  },
  {
    title: 'OCTOBER 24',
    data: [
      {
        id: 'h3',
        severity: 'advisory',
        title: 'Coastal Swell',
        location: 'Sagami Bay',
        description: 'Small craft advisory for coastal areas due to incoming northern swell.',
        resolvedTime: 'Resolved: 10/24 18:00',
        duration: '12h 30m',
      },
      {
        id: 'h4',
        severity: 'watch',
        title: 'Heavy Rain Warning',
        location: 'Kanagawa Prefecture',
        description: 'Rainfall totals of 80–120 mm recorded across the prefecture. Flood watches downgraded.',
        resolvedTime: 'Resolved: 10/24 09:15',
        duration: '6h 45m',
      },
      {
        id: 'h5',
        severity: 'danger',
        title: 'River Overflow Alert',
        location: 'Tama River Basin',
        description: 'River exceeded flood stage. Levee inspection crews deployed. Situation stabilised.',
        resolvedTime: 'Resolved: 10/24 06:30',
        duration: '9h 00m',
      },
    ],
  },
];

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
} as const;

// ─── Tab switcher ─────────────────────────────────────────────────────────────
const TABS = ['Recent', 'History'] as const;
type Tab = (typeof TABS)[number];
type SortBy = 'time' | 'severity';

const SORDER: Record<Severity, number> = { danger: 0, watch: 1, advisory: 2 };
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  const sections = sortedSections(
    activeTab === 'Recent' ? RECENT_SECTIONS : HISTORY_SECTIONS,
    sortBy,
  );

  const activeCount  = RECENT_SECTIONS.reduce((n, s) => n + s.data.length, 0);
  const dangerCount  = RECENT_SECTIONS.flatMap((s) => s.data).filter((a) => a.severity === 'danger').length;

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
          />

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
});
