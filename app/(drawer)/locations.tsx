// ─── Add Locations Screen ────────────────────────────────────────────────────
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawer } from '../../context/DrawerContext';

import { Colors } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { searchCities, GeocodingResult, fetchWeatherByCoords } from '../../services/weatherApi';
import { SavedLocation } from '../../services/storage';
import { 
  FLATLIST_INITIAL_NUM_TO_RENDER, 
  FLATLIST_MAX_TO_RENDER_PER_BATCH, 
  FLATLIST_WINDOW_SIZE 
} from '../../constants/AppConstants';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { successHaptic } from '../../utils/haptics';

export default function LocationsScreen() {
  const {
    savedLocations,
    addLocation,
    removeLocation,
    setDefaultLocation,
    defaultLocation,
    isPremium,
  } = useApp();
  const { openDrawer } = useDrawer();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [locationWeather, setLocationWeather] = useState<Record<string, { temp: number; icon: string }>>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;


  const fetchLocationWeather = useCallback(async () => {
    const weatherMap: Record<string, { temp: number; icon: string }> = {};
    for (const loc of savedLocations) {
      try {
        const data = await fetchWeatherByCoords(loc.lat, loc.lon);
        weatherMap[loc.id] = {
          temp: data.current.temp,
          icon: data.current.icon,
        };
      } catch {
        // Skip if fetch fails
      }
    }
    setLocationWeather(weatherMap);
  }, [savedLocations]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    fetchLocationWeather();
  }, [fetchLocationWeather]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    Keyboard.dismiss();
    try {
      const res = await searchCities(query.trim());
      setResults(res);
    } catch {
      Alert.alert('Error', 'Failed to search cities. Try again.');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleAdd = useCallback(
    async (result: GeocodingResult) => {
      setAdding(`${result.lat}-${result.lon}`);
      try {
        const success = await addLocation({
          city: result.name,
          country: result.country,
          lat: result.lat,
          lon: result.lon,
        });
        if (!success) {
          if (!isPremium && savedLocations.length >= 3) {
            Alert.alert(
              'Location Limit',
              'Free users can save up to 3 locations. Upgrade to Premium for unlimited locations.',
              [{ text: 'OK' }],
            );
          } else {
            Alert.alert('Duplicate', 'This location is already saved.');
          }
        } else {
          successHaptic();
          showToast({
            type: 'success',
            message: `${result.name} added to saved locations`,
          });
          setResults([]);
          setQuery('');
        }
      } finally {
        setAdding(null);
      }
    },
    [addLocation, isPremium, savedLocations.length, showToast],
  );

  const handleDelete = useCallback(
    (id: string, city: string) => {
      Alert.alert('Remove Location', `Remove ${city} from saved locations?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeLocation(id),
        },
      ]);
    },
    [removeLocation],
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefaultLocation(defaultLocation?.id === id ? null : id);
    },
    [defaultLocation, setDefaultLocation],
  );

  const renderSearchResult = ({ item }: { item: GeocodingResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleAdd(item)}
      activeOpacity={0.7}
      disabled={adding !== null}
    >
      <View style={styles.resultInfo}>
        <Ionicons name="location-outline" size={18} color={Colors.accentBlue} />
        <View style={{ flex: 1 }}>
          <Text style={styles.resultCity}>{item.name}</Text>
          <Text style={styles.resultCountry}>
            {item.state ? `${item.state}, ` : ''}
            {item.country}
          </Text>
        </View>
      </View>
      {adding === `${item.lat}-${item.lon}` ? (
        <ActivityIndicator size="small" color={Colors.accentBlue} />
      ) : (
        <Ionicons name="add-circle-outline" size={22} color={Colors.accentGreen} />
      )}
    </TouchableOpacity>
  );

  const renderSavedLocation = ({ item }: { item: SavedLocation }) => {
    const weather = locationWeather[item.id];
    const isDefault = defaultLocation?.id === item.id;

    return (
      <View style={[styles.savedCard, isDefault && styles.savedCardDefault]}>
        <BlurView intensity={20} tint="dark" style={styles.savedCardInner}>
          <View style={styles.savedCardLeft}>
            <Text style={styles.savedCity}>{item.city}</Text>
            <Text style={styles.savedCountry}>{item.country}</Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}
          </View>

          <View style={styles.savedCardRight}>
            {weather && (
              <Text style={styles.savedTemp}>{weather.temp}°</Text>
            )}
            <View style={styles.savedActions}>
              <TouchableOpacity
                onPress={() => handleSetDefault(item.id)}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={isDefault ? 'star' : 'star-outline'}
                  size={18}
                  color={isDefault ? Colors.accentYellow : Colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.city)}
                style={styles.actionBtn}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.accentRed} />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* ─── Header ─────────────────────────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.backBtn}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Locations</Text>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {savedLocations.length}/{isPremium ? '∞' : '3'}
              </Text>
            </View>
          </View>

          {/* ─── Search Bar ─────────────────────────────────────────── */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a city..."
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              style={styles.searchBtn}
              disabled={searching}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.searchBtnGrad}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={18} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ─── Search Results ──────────────────────────────────────── */}
          {results.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
              <FlatList
                data={results}
                keyExtractor={(item) => `${item.lat}-${item.lon}`}
                renderItem={renderSearchResult}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* ─── Saved Locations ─────────────────────────────────────── */}
          <View style={styles.savedSection}>
            <Text style={styles.sectionLabel}>SAVED LOCATIONS</Text>
            {savedLocations.length === 0 ? (
              <EmptyState
                icon="location-outline"
                title="No Locations Saved"
                message="Search for a city above to add it to your saved locations"
                iconColor={Colors.accentBlue}
              />
            ) : (
              <FlatList
                data={savedLocations}
                keyExtractor={(item) => item.id}
                renderItem={renderSavedLocation}
                contentContainerStyle={{ paddingBottom: 100 }}
                initialNumToRender={FLATLIST_INITIAL_NUM_TO_RENDER}
                maxToRenderPerBatch={FLATLIST_MAX_TO_RENDER_PER_BATCH}
                windowSize={FLATLIST_WINDOW_SIZE}
                removeClippedSubviews={true}
              />
            )}
          </View>
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
  backBtn: {
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
  counterBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentPurple,
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
  },
  searchBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  searchBtnGrad: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Results
  resultsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  resultCity: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resultCountry: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Saved
  savedSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  savedCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  savedCardDefault: {
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  savedCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  savedCardLeft: { flex: 1 },
  savedCity: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  savedCountry: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accentYellow,
    letterSpacing: 1,
  },
  savedCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  savedTemp: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.textPrimary,
  },
  savedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
