// ─── Home Screen (Main Weather View) ─────────────────────────────────────────
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  PanResponder,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useWeather } from '../../hooks/useWeather';
import { useApp } from '../../context/AppContext';
import { Colors, getGradientForCondition } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

import CurrentWeatherCard from '../../components/CurrentWeatherCard';
import HourlyForecast from '../../components/HourlyForecast';
import WeeklyForecast from '../../components/WeeklyForecast';
import WeatherDetailsGrid from '../../components/WeatherDetailsGrid';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import { touchTarget } from '../../constants/DesignTokens';
import { useWeatherTheme } from '../../context/WeatherThemeContext';

const { height: SH } = Dimensions.get('window');

type LocationEntry = {
  id: string;
  city: string;
  country?: string;
  lat: number;
  lon: number;
  isGPS: boolean;
};

export default function HomeScreen() {
  const { data, loading, error, refresh, fetchCoords, fetchByGPS } = useWeather();
  const { savedLocations, defaultLocation, settings } = useApp();
  const { setTabBarTint } = useWeatherTheme();
  const { colors, isDark } = useTheme();

  const [locationIndex, setLocationIndex] = useState(0);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SH)).current;

  // ── Build unified location list ────────────────────────────────────────────
  const allLocations = useMemo<LocationEntry[]>(
    () => [
      { id: 'gps', city: 'Current Location', lat: 0, lon: 0, isGPS: true },
      ...savedLocations.map((loc) => ({ ...loc, isGPS: false })),
    ],
    [savedLocations],
  );

  // Refs so PanResponder callbacks always see latest values
  const locationIndexRef = useRef(0);
  const allLocationsRef  = useRef(allLocations);
  allLocationsRef.current = allLocations;
  const fetchByGPSRef    = useRef(fetchByGPS);
  fetchByGPSRef.current  = fetchByGPS;
  const fetchCoordsRef   = useRef(fetchCoords);
  fetchCoordsRef.current = fetchCoords;

  // ── Gradient ───────────────────────────────────────────────────────────────
  const gradient = data
    ? getGradientForCondition(data.current.condition_id, data.current.icon)
    : Colors.gradients.default;

  useEffect(() => {
    setTabBarTint(gradient[gradient.length - 1] as string);
  }, [gradient[gradient.length - 1]]);

  // ── Switch to location by index ────────────────────────────────────────────
  const switchToIndex = useCallback((idx: number) => {
    const locs = allLocationsRef.current;
    if (idx < 0 || idx >= locs.length) return;
    locationIndexRef.current = idx;
    setLocationIndex(idx);
    const loc = locs[idx];
    if (loc.isGPS) {
      fetchByGPSRef.current();
    } else {
      fetchCoordsRef.current(loc.lat, loc.lon);
    }
  }, []);

  // ── Horizontal swipe via PanResponder ──────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 12,
      onPanResponderRelease: (_, g) => {
        const cur   = locationIndexRef.current;
        const total = allLocationsRef.current.length;
        if (g.dx < -50 && cur < total - 1) {
          const next = cur + 1;
          locationIndexRef.current = next;
          setLocationIndex(next);
          const loc = allLocationsRef.current[next];
          if (loc.isGPS) fetchByGPSRef.current();
          else fetchCoordsRef.current(loc.lat, loc.lon);
        } else if (g.dx > 50 && cur > 0) {
          const prev = cur - 1;
          locationIndexRef.current = prev;
          setLocationIndex(prev);
          const loc = allLocationsRef.current[prev];
          if (loc.isGPS) fetchByGPSRef.current();
          else fetchCoordsRef.current(loc.lat, loc.lon);
        }
      },
    }),
  ).current;

  // ── Load default location on mount ─────────────────────────────────────────
  useEffect(() => {
    if (defaultLocation) {
      const idx    = allLocations.findIndex((l) => l.city === defaultLocation.city);
      const target = idx >= 0 ? idx : 0;
      locationIndexRef.current = target;
      setLocationIndex(target);
      if (target === 0) {
        fetchByGPS();
      } else {
        fetchCoords(defaultLocation.lat, defaultLocation.lon);
      }
    }
  }, [defaultLocation]);

  // ── Bottom sheet animation ─────────────────────────────────────────────────
  const openModal = useCallback(() => {
    setLocationModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 13,
    }).start();
  }, [slideAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SH,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setLocationModalVisible(false));
  }, [slideAnim]);

  const selectedLabel = allLocations[locationIndex]?.city ?? 'Current Location';

  return (
    <View style={s.container} {...panResponder.panHandlers}>
      <StatusBar style="light" />
      <LinearGradient colors={[...gradient]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ─── Top Bar ──────────────────────────────────────────────── */}
        <View style={s.topBar}>
          <View style={{ width: 44 }} />

          {/* Centre: location pill + page dots */}
          <View style={s.locationCenter}>
            <TouchableOpacity
              style={s.locationPill}
              onPress={openModal}
              activeOpacity={0.75}
              accessibilityLabel={`Current location: ${selectedLabel}`}
              accessibilityRole="button"
            >
              <Ionicons name="location" size={13} color="#7DD3FC" />
              <Text style={s.locationLabel} numberOfLines={1}>
                {selectedLabel}
              </Text>
              <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            {allLocations.length > 1 && (
              <View style={s.dotsRow}>
                {allLocations.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => switchToIndex(i)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <View
                      style={[
                        s.dot,
                        i === locationIndex ? s.dotActive : s.dotInactive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* ─── Weather Content ─────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && !!data}
              onRefresh={refresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
        >
          {loading && !data && <LoadingSkeleton />}

          {error && !data && (
            <ErrorState
              type="api"
              title="Unable to Load Weather"
              message={error}
              primaryAction={{ label: 'Try Again', onPress: refresh, loading }}
              secondaryAction={{ label: 'Use My Location', onPress: fetchByGPS }}
            />
          )}

          {data && (
            <>
              <CurrentWeatherCard weather={data.current} settings={settings} />
              <View style={{ height: 20 }} />
              <HourlyForecast data={data.hourly} timezone={data.current.timezone} settings={settings} />
              <WeeklyForecast data={data.daily} settings={settings} />
              <WeatherDetailsGrid weather={data.current} settings={settings} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ─── Location Picker Bottom Sheet ─────────────────────────── */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Pressable style={s.sheetBackdrop} onPress={closeModal}>
          <Animated.View
            style={[s.sheetWrapper, { transform: [{ translateY: slideAnim }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={[s.sheet, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>

                {/* Drag handle */}
                <View style={s.sheetHandleRow}>
                  <View
                    style={[
                      s.handleBar,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' },
                    ]}
                  />
                </View>

                {/* Header */}
                <View style={s.sheetHeader}>
                  <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>Locations</Text>
                  <TouchableOpacity style={s.sheetCloseBtn} onPress={closeModal} activeOpacity={0.7}>
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* GPS entry */}
                <TouchableOpacity
                  style={[
                    s.sheetItem,
                    { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
                    locationIndex === 0 && {
                      backgroundColor: isDark ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.06)',
                    },
                  ]}
                  onPress={() => { switchToIndex(0); closeModal(); }}
                  activeOpacity={0.7}
                >
                  <View style={[s.sheetItemIcon, { backgroundColor: isDark ? 'rgba(14,165,233,0.15)' : '#E0F2FE' }]}>
                    <Ionicons name="navigate" size={17} color="#0EA5E9" />
                  </View>
                  <View style={s.sheetItemBody}>
                    <Text style={[s.sheetItemTitle, { color: colors.textPrimary }]}>Current Location</Text>
                    <Text style={[s.sheetItemSub, { color: colors.textMuted }]}>Uses your device GPS</Text>
                  </View>
                  {locationIndex === 0 && (
                    <Ionicons name="checkmark-circle" size={20} color="#0EA5E9" />
                  )}
                </TouchableOpacity>

                {/* Saved locations */}
                {savedLocations.length > 0 && (
                  <>
                    <Text style={[s.sheetSection, { color: colors.textMuted }]}>SAVED LOCATIONS</Text>
                    {savedLocations.map((loc, i) => {
                      const idx    = i + 1;
                      const active = locationIndex === idx;
                      return (
                        <TouchableOpacity
                          key={loc.id}
                          style={[
                            s.sheetItem,
                            { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' },
                            active && {
                              backgroundColor: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.07)',
                            },
                          ]}
                          onPress={() => { switchToIndex(idx); closeModal(); }}
                          activeOpacity={0.7}
                        >
                          <View style={[s.sheetItemIcon, { backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#EDE9FE' }]}>
                            <Ionicons name="location" size={17} color="#8B5CF6" />
                          </View>
                          <View style={s.sheetItemBody}>
                            <Text style={[s.sheetItemTitle, { color: colors.textPrimary }]}>{loc.city}</Text>
                            {loc.country ? (
                              <Text style={[s.sheetItemSub, { color: colors.textMuted }]}>{loc.country}</Text>
                            ) : null}
                          </View>
                          {active && <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}

                {/* Empty state */}
                {savedLocations.length === 0 && (
                  <View style={s.sheetEmpty}>
                    <View style={[s.sheetEmptyIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
                      <Ionicons name="map-outline" size={28} color={colors.textMuted} />
                    </View>
                    <Text style={[s.sheetEmptyTitle, { color: colors.textPrimary }]}>No saved locations</Text>
                    <Text style={[s.sheetEmptyText, { color: colors.textMuted }]}>
                      Pin locations from the Places tab
                    </Text>
                    <TouchableOpacity
                      style={s.sheetEmptyBtn}
                      onPress={() => { closeModal(); router.push('/(tabs)/locations'); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="map" size={14} color="#fff" />
                      <Text style={s.sheetEmptyBtnText}>Open Places</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <SafeAreaView
                  edges={['bottom']}
                  style={{ backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }}
                />
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  safe:      { flex: 1 },

  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        4,
    paddingBottom:     6,
  },
  locationCenter: {
    flex:       1,
    alignItems: 'center',
    gap:        5,
  },
  locationPill: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.13)',
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      20,
    gap:               5,
    maxWidth:          220,
  },
  locationLabel: {
    color:      '#FFFFFF',
    fontSize:   14,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  dot: {
    height:       5,
    borderRadius: 3,
  },
  dotActive: {
    width:           18,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  dotInactive: {
    width:           5,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  iconBtn: {
    width:           touchTarget.minimum,
    height:          touchTarget.minimum,
    borderRadius:    12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  scroll: {
    paddingBottom: 130,
    minHeight:     SH - 100,
  },

  // Bottom Sheet
  sheetBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent:  'flex-end',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius:  26,
    borderTopRightRadius: 26,
    paddingHorizontal:    20,
    paddingBottom:        8,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -6 },
    shadowOpacity:        0.22,
    shadowRadius:         24,
    elevation:            24,
  },
  sheetHandleRow: {
    alignItems:    'center',
    paddingTop:    12,
    paddingBottom: 6,
  },
  handleBar: {
    width:        38,
    height:       4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     6,
    paddingBottom:  18,
  },
  sheetTitle: {
    fontSize:      19,
    fontWeight:    '700',
    letterSpacing: -0.3,
  },
  sheetCloseBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: 'rgba(128,128,128,0.13)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  sheetSection: {
    fontSize:          11,
    fontWeight:        '700',
    letterSpacing:     1.3,
    marginTop:         14,
    marginBottom:      8,
    paddingHorizontal: 2,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems:    'center',
    borderRadius:  14,
    borderWidth:   1,
    padding:       12,
    marginBottom:  8,
    gap:           12,
  },
  sheetItemIcon: {
    width:          42,
    height:         42,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sheetItemBody: {
    flex: 1,
  },
  sheetItemTitle: {
    fontSize:     15,
    fontWeight:   '600',
    marginBottom: 2,
  },
  sheetItemSub: {
    fontSize:   12,
    fontWeight: '400',
  },

  // Empty state
  sheetEmpty: {
    alignItems:     'center',
    paddingVertical: 28,
    gap:            8,
  },
  sheetEmptyIcon: {
    width:          64,
    height:         64,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   4,
  },
  sheetEmptyTitle: {
    fontSize:   16,
    fontWeight: '600',
  },
  sheetEmptyText: {
    fontSize:          13,
    textAlign:         'center',
    paddingHorizontal: 20,
  },
  sheetEmptyBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    marginTop:         12,
    backgroundColor:   '#8B5CF6',
    paddingHorizontal: 22,
    paddingVertical:   10,
    borderRadius:      20,
  },
  sheetEmptyBtnText: {
    color:      '#FFFFFF',
    fontSize:   14,
    fontWeight: '600',
  },
});
