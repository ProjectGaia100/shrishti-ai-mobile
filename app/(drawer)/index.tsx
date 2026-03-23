// ─── Home Screen (Main Weather View) ─────────────────────────────────────────
import React, { useState, useCallback } from 'react';
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
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../../context/DrawerContext';

import { useWeather } from '../../hooks/useWeather';
import { useApp } from '../../context/AppContext';
import { Colors, getGradientForCondition } from '../../constants/Colors';
import { convertTemp, convertWindSpeed, getWindLabel } from '../../utils/helpers';
import { searchCities, GeocodingResult } from '../../services/weatherApi';
import { useToast } from '../../context/ToastContext';
import { successHaptic, lightHaptic } from '../../utils/haptics';

import CurrentWeatherCard from '../../components/CurrentWeatherCard';
import HourlyForecast from '../../components/HourlyForecast';
import WeeklyForecast from '../../components/WeeklyForecast';
import WeatherDetailsGrid from '../../components/WeatherDetailsGrid';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import { touchTarget } from '../../constants/DesignTokens';

const { height } = Dimensions.get('window');

export default function HomeScreen() {
  const { data, loading, error, refresh, fetchCoords, fetchByGPS } = useWeather();
  const { savedLocations, defaultLocation, settings } = useApp();
  const { openDrawer } = useDrawer();
  const { showToast } = useToast();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('Current Location');

  // Manual city search state (shown on error)
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<GeocodingResult[]>([]);
  const [manualSearching, setManualSearching] = useState(false);

  const handleManualSearch = useCallback(async () => {
    if (!manualQuery.trim()) return;
    setManualSearching(true);
    Keyboard.dismiss();
    try {
      const res = await searchCities(manualQuery.trim());
      setManualResults(res);
      lightHaptic();
    } catch {
      showToast({ type: 'error', message: 'City search failed. Try again.' });
    } finally {
      setManualSearching(false);
    }
  }, [manualQuery, showToast]);

  const handleManualSelect = useCallback(
    async (result: GeocodingResult) => {
      setSelectedLabel(result.name);
      setManualQuery('');
      setManualResults([]);
      successHaptic();
      await fetchCoords(result.lat, result.lon);
    },
    [fetchCoords],
  );

  // Determine gradient based on current weather
  const gradient = data
    ? getGradientForCondition(data.current.condition_id, data.current.icon)
    : Colors.gradients.default;

  const handleSelectCurrentLocation = useCallback(async () => {
    setSelectedLabel('Current Location');
    setLocationModalVisible(false);
    await fetchByGPS();
  }, [fetchByGPS]);

  const handleSelectSavedLocation = useCallback(
    async (loc: { city: string; lat: number; lon: number }) => {
      setSelectedLabel(loc.city);
      setLocationModalVisible(false);
      await fetchCoords(loc.lat, loc.lon);
    },
    [fetchCoords],
  );

  // Load default location on first render
  React.useEffect(() => {
    if (defaultLocation) {
      setSelectedLabel(defaultLocation.city);
      fetchCoords(defaultLocation.lat, defaultLocation.lon);
    }
  }, [defaultLocation, fetchCoords]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[...gradient]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ─── Top Bar ────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            onPress={openDrawer} 
            style={styles.iconBtn} 
            activeOpacity={0.7}
            accessibilityLabel="Open navigation menu"
            accessibilityRole="button"
            accessibilityHint="Opens the drawer navigation menu"
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={`Current location: ${selectedLabel}`}
            accessibilityRole="button"
            accessibilityHint="Opens location picker to switch between saved locations"
          >
            <Ionicons name="location" size={14} color={Colors.accentBlue} />
            <Text style={styles.locationLabel} numberOfLines={1}>
              {selectedLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={{ width: touchTarget.minimum }} />
        </View>

        {/* ─── Weather Content ────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.scroll}
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
            <>
              <ErrorState
                type="api"
                title="Unable to Load Weather"
                message={error}
                primaryAction={{
                  label: 'Try Again',
                  onPress: refresh,
                  loading: loading,
                }}
                secondaryAction={{
                  label: 'Use My Location',
                  onPress: fetchByGPS,
                }}
              />

              {/* ─── Manual City Search ───────────────────────────────── */}
              <View style={styles.manualSearch}>
                <Text style={styles.manualSearchLabel}>OR ENTER A CITY MANUALLY</Text>

                <View style={styles.manualSearchRow}>
                  <View style={styles.manualSearchBar}>
                    <Ionicons name="search" size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.manualSearchInput}
                      placeholder="e.g. Tokyo, London..."
                      placeholderTextColor={Colors.textMuted}
                      value={manualQuery}
                      onChangeText={setManualQuery}
                      onSubmitEditing={handleManualSearch}
                      returnKeyType="search"
                      autoCorrect={false}
                      autoCapitalize="words"
                    />
                    {manualQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => { setManualQuery(''); setManualResults([]); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.manualSearchBtn}
                    onPress={handleManualSearch}
                    disabled={manualSearching || !manualQuery.trim()}
                    activeOpacity={0.7}
                    accessibilityLabel="Search city"
                    accessibilityRole="button"
                  >
                    {manualSearching ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>

                {manualResults.length > 0 && (
                  <View style={styles.manualResults}>
                    {manualResults.map((item) => (
                      <TouchableOpacity
                        key={`${item.lat}-${item.lon}`}
                        style={styles.manualResultItem}
                        onPress={() => handleManualSelect(item)}
                        activeOpacity={0.7}
                        accessibilityLabel={`Load weather for ${item.name}, ${item.country}`}
                        accessibilityRole="button"
                      >
                        <Ionicons name="location-outline" size={16} color={Colors.accentBlue} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.manualResultCity}>{item.name}</Text>
                          <Text style={styles.manualResultCountry}>
                            {item.state ? `${item.state}, ` : ''}{item.country}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {manualResults.length === 0 && manualQuery.length > 0 && !manualSearching && (
                  <Text style={styles.manualNoResults}>
                    No results. Try a different city name.
                  </Text>
                )}
              </View>
            </>
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

      {/* ─── Location Picker Modal ────────────────────────────────────── */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLocationModalVisible(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              style={styles.modalGradient}
            >
              <Text style={styles.modalTitle}>Select Location</Text>

              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedLabel === 'Current Location' && styles.modalItemActive,
                ]}
                onPress={handleSelectCurrentLocation}
                accessibilityLabel="Current Location"
                accessibilityRole="button"
                accessibilityState={{ selected: selectedLabel === 'Current Location' }}
                accessibilityHint="Use device's current location for weather"
              >
                <Ionicons name="navigate" size={18} color={Colors.accentBlue} />
                <Text style={styles.modalItemText}>Current Location</Text>
                {selectedLabel === 'Current Location' && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.accentGreen} />
                )}
              </TouchableOpacity>

              {savedLocations.length > 0 && (
                <View style={styles.modalDivider}>
                  <Text style={styles.modalDividerText}>SAVED LOCATIONS</Text>
                </View>
              )}

              {savedLocations.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    styles.modalItem,
                    selectedLabel === loc.city && styles.modalItemActive,
                  ]}
                  onPress={() => handleSelectSavedLocation(loc)}
                  accessibilityLabel={`${loc.city}, ${loc.country}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedLabel === loc.city }}
                  accessibilityHint={`Switch to weather for ${loc.city}`}
                >
                  <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
                  <Text style={styles.modalItemText}>
                    {loc.city}, {loc.country}
                  </Text>
                  {selectedLabel === loc.city && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.accentGreen} />
                  )}
                </TouchableOpacity>
              ))}

              {savedLocations.length === 0 && (
                <Text style={styles.noLocations}>
                  No saved locations yet. Add locations from the menu.
                </Text>
              )}
            </LinearGradient>
          </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconBtn: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: 220,
  },
  locationLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Content
  scroll: {
    paddingBottom: 40,
    minHeight: height - 100,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  errorEmoji: { fontSize: 64, marginBottom: 16 },
  errorText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 40,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalGradient: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  modalDivider: {
    paddingVertical: 8,
    marginTop: 4,
  },
  modalDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingHorizontal: 14,
  },
  noLocations: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  // Manual city search (error state)
  manualSearch: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  manualSearchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  manualSearchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  manualSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  manualSearchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 11,
  },
  manualSearchBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualResults: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  manualResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  manualResultCity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  manualResultCountry: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  manualNoResults: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
