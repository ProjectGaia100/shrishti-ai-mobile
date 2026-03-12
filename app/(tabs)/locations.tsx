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
  Pressable,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_H } = Dimensions.get('window');

import { Colors } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { searchCities, GeocodingResult, fetchWeatherByCoords } from '../../services/weatherApi';
import { SavedLocation } from '../../services/storage';
import {
  FLATLIST_INITIAL_NUM_TO_RENDER,
  FLATLIST_MAX_TO_RENDER_PER_BATCH,
  FLATLIST_WINDOW_SIZE,
} from '../../constants/AppConstants';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { successHaptic } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';
import { useTabBarHeight } from '../../context/TabBarHeightContext';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Map', 'Saved'] as const;
type Tab = (typeof TABS)[number];

// ─── Tab Switcher ─────────────────────────────────────────────────────────────
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
      toValue: active === 'Map' ? 0 : 1,
      useNativeDriver: true,
      tension: 90,
      friction: 15,
    }).start();
  }, [active]);

  const pillX = pillAnim.interpolate({ inputRange: [0, 1], outputRange: [2, tabWidth + 2] });
  const trackBg     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const pillBg      = isDark ? 'rgba(99,102,241,0.28)' : 'rgba(99,102,241,0.10)';
  const activeColor = isDark ? '#A5B4FC' : '#4F46E5';
  const mutedColor  = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.38)';

  return (
    <View
      style={[s.tabTrack, { backgroundColor: trackBg }]}
      onLayout={(e) => setTabWidth((e.nativeEvent.layout.width - 4) / 2)}
    >
      <Animated.View style={[s.tabPill, { width: tabWidth, backgroundColor: pillBg, transform: [{ translateX: pillX }] }]} />
      {TABS.map((tab) => (
        <Pressable key={tab} style={[s.tabBtn, { width: tabWidth }]} onPress={() => onChange(tab)}>
          <Ionicons
            name={tab === 'Map' ? 'map-outline' : 'bookmark-outline'}
            size={14}
            color={active === tab ? activeColor : mutedColor}
            style={{ marginRight: 5 }}
          />
          <Text style={[s.tabLabel, { color: active === tab ? activeColor : mutedColor }]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Leaflet HTML ─────────────────────────────────────────────────────────────
// Long-press fix: use map.on('contextmenu') — Leaflet fires this natively on
// mobile long-press (Android ~500 ms hold). Far more reliable than manual
// touchstart + setTimeout which conflicts with Leaflet's own pan handling.
function buildMapHTML(dark: boolean, locations: SavedLocation[]): string {
  const bg    = dark ? '#0D1117' : '#E8EDF4';
  const tiles = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const markersJS = locations.map((loc) =>
    `L.circleMarker([${loc.lat},${loc.lon}],{radius:11,color:'#6366F1',fillColor:'#818CF8',fillOpacity:1,weight:2.5}).addTo(map).bindTooltip(${JSON.stringify(loc.city)},{permanent:false,className:'tip',direction:'top',offset:[0,-10]});`
  ).join('\n');

  const center = locations.length > 0 ? `[${locations[0].lat},${locations[0].lon}]` : '[20,0]';
  const zoom   = locations.length > 0 ? 7 : 2;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body,#map { width:100%; height:100%; background:${bg}; }
    .leaflet-control-zoom, .leaflet-control-attribution { display:none; }
    .tip {
      background: rgba(15,23,42,0.93);
      color: #A5B4FC;
      border: 1px solid rgba(99,102,241,0.45);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 10px;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
    }
    @keyframes pinPop {
      0%   { transform: scale(0.2); opacity: 0; }
      60%  { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1);   opacity: 1; }
    }
    .pin-icon {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(245,158,11,0.25);
      border: 2.5px solid #F59E0B;
      box-shadow: 0 0 0 6px rgba(245,158,11,0.12);
      animation: pinPop 0.4s ease-out;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: ${center},
      zoom: ${zoom},
      zoomControl: false,
      attributionControl: false,
      tap: true,
      tapTolerance: 15
    });
    L.tileLayer('${tiles}', { maxZoom:19, detectRetina:true }).addTo(map);
    ${markersJS}

    var pendingMarker = null;

    function clearPending() {
      if (pendingMarker) { map.removeLayer(pendingMarker); pendingMarker = null; }
    }

    // contextmenu = Leaflet's built-in long-press event on mobile (Android ~500ms hold)
    map.on('contextmenu', function(e) {
      clearPending();
      var icon = L.divIcon({ className:'', html:'<div class="pin-icon"></div>', iconSize:[28,28], iconAnchor:[14,14] });
      pendingMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon:icon }).addTo(map);
      send({ type:'longpress', lat:e.latlng.lat, lon:e.latlng.lng });
    });

    document.addEventListener('message', function(e) { handle(e.data); });
    window.addEventListener('message',   function(e) { handle(e.data); });

    function handle(raw) {
      try {
        var d = JSON.parse(raw);
        if (d.type === 'flyTo') {
          clearPending();
          if (d.addMarker) {
            var icon2 = L.divIcon({ className:'', html:'<div class="pin-icon"></div>', iconSize:[28,28], iconAnchor:[14,14] });
            pendingMarker = L.marker([d.lat, d.lon], { icon:icon2 }).addTo(map);
          }
          map.flyTo([d.lat, d.lon], d.zoom || 12, { duration:1.0, easeLinearity:0.4 });
        } else if (d.type === 'clearMarker') {
          clearPending();
        }
      } catch(e) {}
    }

    function send(obj) {
      try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } catch(e) {}
    }
  </script>
</body>
</html>`;
}

// ─── Saved Card ───────────────────────────────────────────────────────────────
const ACCENT_COLORS = ['#818CF8','#34D399','#F87171','#FBBF24','#60A5FA','#F472B6','#A78BFA'];

function SavedCard({
  item,
  index,
  weather,
  isDefault,
  isDark,
  colors,
  onFlyTo,
  onSetDefault,
  onDelete,
}: {
  item: SavedLocation;
  index: number;
  weather?: { temp: number };
  isDefault: boolean;
  isDark: boolean;
  colors: any;
  onFlyTo: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const accent = isDefault ? '#FACC15' : ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onFlyTo}>
      <View style={[
        s.savedCard,
        {
          borderColor: isDefault ? 'rgba(250,204,21,0.3)' : colors.cardBorder,
          backgroundColor: isDark ? 'rgba(22,32,48,0.7)' : 'rgba(255,255,255,0.75)',
        },
      ]}>
        {/* Left accent stripe */}
        <View style={[s.cardStripe, { backgroundColor: accent }]} />

        <View style={s.cardBody}>
          {/* City + temp */}
          <View style={s.cardTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.savedCity, { color: colors.textPrimary }]} numberOfLines={1}>{item.city}</Text>
              <Text style={[s.savedCountry, { color: colors.textMuted }]} numberOfLines={1}>{item.country}</Text>
            </View>
            {weather
              ? <Text style={[s.savedTemp, { color: colors.textPrimary }]}>{Math.round(weather.temp)}°</Text>
              : <ActivityIndicator size="small" color={colors.textMuted} style={{ marginLeft: 8 }} />
            }
          </View>

          {/* Bottom actions row */}
          <View style={s.cardBottomRow}>
            {isDefault && (
              <View style={s.defaultChip}>
                <Ionicons name="star" size={9} color="#FACC15" />
                <Text style={s.defaultChipText}>DEFAULT</Text>
              </View>
            )}
            <View style={[s.cardActions, !isDefault && { marginLeft: 'auto' }]}>
              <TouchableOpacity
                onPress={onSetDefault}
                style={[s.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
              >
                <Ionicons name={isDefault ? 'star' : 'star-outline'} size={15} color={isDefault ? '#FACC15' : colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onFlyTo}
                style={[s.actionBtn, { backgroundColor: 'rgba(99,102,241,0.1)' }]}
              >
                <Ionicons name="navigate-outline" size={15} color="#818CF8" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onDelete}
                style={[s.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
              >
                <Ionicons name="trash-outline" size={15} color="#F87171" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LocationsScreen() {
  const { savedLocations, addLocation, removeLocation, setDefaultLocation, defaultLocation, isPremium } = useApp();
  const { showToast }       = useToast();
  const { colors, isDark }  = useTheme();
  const { tabBarHeight }    = useTabBarHeight();
  const webViewRef          = useRef<WebView>(null);

  const [activeTab, setActiveTab]     = useState<Tab>('Map');
  const [query, setQuery]             = useState('');
  const [results, setResults]         = useState<GeocodingResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [adding, setAdding]           = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [locationWeather, setLocationWeather] = useState<Record<string, { temp: number }>>({});

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.timing(resultAnim, {
      toValue: showResults && results.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showResults, results.length]);

  // Fetch weather for saved locations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wMap: Record<string, { temp: number }> = {};
      for (const loc of savedLocations) {
        if (cancelled) break;
        try {
          const d = await fetchWeatherByCoords(loc.lat, loc.lon);
          wMap[loc.id] = { temp: d.current.temp };
        } catch { /* skip */ }
      }
      if (!cancelled) setLocationWeather(wMap);
    })();
    return () => { cancelled = true; };
  }, [savedLocations]);

  // ── WebView long-press ─────────────────────────────────────────────────────
  const onWebViewMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'longpress') {
        const lat = parseFloat(Number(msg.lat).toFixed(5));
        const lon = parseFloat(Number(msg.lon).toFixed(5));
        Alert.alert(
          '📍 Pin this spot?',
          `${lat.toFixed(3)}°,  ${lon.toFixed(3)}°`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => webViewRef.current?.injectJavaScript(`clearPending();true;`),
            },
            {
              text: 'Save Location',
              onPress: async () => {
                setAdding('coord');
                const ok = await addLocation({
                  city: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
                  country: 'Pinned spot',
                  lat,
                  lon,
                });
                setAdding(null);
                if (ok) {
                  successHaptic();
                  showToast({ type: 'success', message: 'Pinned location saved!' });
                } else {
                  webViewRef.current?.injectJavaScript(`clearPending();true;`);
                  showToast({ type: 'error', message: 'Could not save — limit reached or duplicate' });
                }
              },
            },
          ],
        );
      }
    } catch { /* ignore */ }
  }, [addLocation, showToast]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    Keyboard.dismiss();
    try {
      const res = await searchCities(q);
      setResults(res);
      setShowResults(true);
      if (res.length > 0) {
        webViewRef.current?.injectJavaScript(
          `handle(JSON.stringify({type:'flyTo',lat:${res[0].lat},lon:${res[0].lon},zoom:10}));true;`
        );
      }
    } catch {
      showToast({ type: 'error', message: 'Search failed — check connection' });
    } finally {
      setSearching(false);
    }
  }, [query, showToast]);

  const handleAddResult = useCallback(async (item: GeocodingResult) => {
    setAdding(`${item.lat}-${item.lon}`);
    try {
      const ok = await addLocation({ city: item.name, country: item.country, lat: item.lat, lon: item.lon });
      if (!ok) {
        showToast({ type: 'error', message: savedLocations.length >= 3 && !isPremium ? 'Upgrade for unlimited locations' : 'Already saved' });
      } else {
        successHaptic();
        showToast({ type: 'success', message: `${item.name} saved!` });
        setResults([]);
        setShowResults(false);
        setQuery('');
        setTimeout(() => {
          webViewRef.current?.injectJavaScript(
            `handle(JSON.stringify({type:'flyTo',lat:${item.lat},lon:${item.lon},zoom:11,addMarker:true}));true;`
          );
        }, 100);
      }
    } finally {
      setAdding(null);
    }
  }, [addLocation, isPremium, savedLocations.length, showToast]);

  const handleDelete = useCallback((id: string, city: string) => {
    Alert.alert('Remove Location', `Remove "${city}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeLocation(id) },
    ]);
  }, [removeLocation]);

  const flyTo = useCallback((loc: SavedLocation) => {
    setActiveTab('Map');
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(
        `handle(JSON.stringify({type:'flyTo',lat:${loc.lat},lon:${loc.lon},zoom:11}));true;`
      );
    }, 200);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }, []);

  const blurTint = isDark ? 'dark' : 'light';

  return (
    <View style={s.root}>
      <LinearGradient
        colors={isDark ? ['#0D1117','#0F172A','#0D1117'] : ['#EEF2FF','#E8EDF8','#EEF2FF']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top']}>
        <Animated.View style={[s.flex, { opacity: fadeAnim }]}>

          {/* ── Header ──────────────────────────────────────────── */}
          <View style={s.header}>
            <View>
              <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Locations</Text>
              <Text style={[s.headerSub, { color: colors.textMuted }]}>
                {savedLocations.length} saved{!isPremium ? ` of 3` : ''}
              </Text>
            </View>
            <LinearGradient
              colors={['rgba(99,102,241,0.22)','rgba(139,92,246,0.12)']}
              style={s.counterBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.counterNum}>{savedLocations.length}</Text>
              <Text style={[s.counterDen, { color: colors.textMuted }]}>/{isPremium ? '∞' : '3'}</Text>
            </LinearGradient>
          </View>

          {/* ── Tab Switcher ──────────────────────────────────── */}
          <View style={s.tabRow}>
            <TabSwitcher active={activeTab} onChange={setActiveTab} isDark={isDark} />
          </View>

          {/* ══ MAP TAB ══════════════════════════════════════════ */}
          {activeTab === 'Map' && (
            <View style={s.flex}>

              <WebView
                key={isDark ? 'dark' : 'light'}
                ref={webViewRef}
                source={{ html: buildMapHTML(isDark, savedLocations) }}
                style={[s.webview, { backgroundColor: isDark ? '#0D1117' : '#E8EDF4' }]}
                scrollEnabled={false}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                mixedContentMode="always"
                onMessage={onWebViewMessage}
              />

              {/* Search bar overlay */}
              <View style={s.searchOverlay}>
                <BlurView intensity={isDark ? 60 : 75} tint={blurTint as any} style={s.searchBlur}>
                  <Ionicons name="search" size={17} color={colors.textMuted} />
                  <TextInput
                    style={[s.searchInput, { color: colors.textPrimary }]}
                    placeholder="Search for a city…"
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={(t) => {
                      setQuery(t);
                      if (!t) { setResults([]); setShowResults(false); }
                    }}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                  {searching ? (
                    <ActivityIndicator size="small" color="#818CF8" />
                  ) : query.length > 0 ? (
                    <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    onPress={handleSearch}
                    disabled={searching || !query.trim()}
                    style={s.goBtn}
                  >
                    <LinearGradient colors={['#6366F1','#8B5CF6']} style={s.goBtnGrad}>
                      <Ionicons name="arrow-forward" size={15} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </BlurView>
              </View>

              {/* Search results dropdown */}
              {results.length > 0 && showResults && (
                <Animated.View style={[
                  s.resultsDropdown,
                  {
                    backgroundColor: isDark ? 'rgba(13,17,23,0.97)' : 'rgba(255,255,255,0.97)',
                    borderColor: colors.cardBorder,
                    opacity: resultAnim,
                    transform: [{ translateY: resultAnim.interpolate({ inputRange:[0,1], outputRange:[-6,0] }) }],
                  },
                ]}>
                  {results.slice(0, 5).map((item, i) => (
                    <TouchableOpacity
                      key={`${item.lat}-${item.lon}`}
                      style={[
                        s.resultRow,
                        i < Math.min(results.length, 5) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
                      ]}
                      onPress={() => handleAddResult(item)}
                      activeOpacity={0.72}
                    >
                      <View style={s.resultDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.resultCity, { color: colors.textPrimary }]}>{item.name}</Text>
                        <Text style={[s.resultSub, { color: colors.textMuted }]}>
                          {item.state ? `${item.state} · ` : ''}{item.country}
                        </Text>
                      </View>
                      {adding === `${item.lat}-${item.lon}`
                        ? <ActivityIndicator size="small" color="#818CF8" />
                        : (
                          <View style={s.saveChip}>
                            <Ionicons name="add" size={13} color="#818CF8" />
                            <Text style={s.saveChipText}>Save</Text>
                          </View>
                        )
                      }
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}

              {/* Zoom + locate controls */}
              <View style={s.mapControls}>
                <TouchableOpacity
                  onPress={() => webViewRef.current?.injectJavaScript(`map.zoomIn();true;`)}
                  style={[s.ctrlBtn, { backgroundColor: isDark ? 'rgba(13,17,23,0.88)' : 'rgba(255,255,255,0.92)' }]}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => webViewRef.current?.injectJavaScript(`map.zoomOut();true;`)}
                  style={[s.ctrlBtn, { backgroundColor: isDark ? 'rgba(13,17,23,0.88)' : 'rgba(255,255,255,0.92)', marginTop: 6 }]}
                >
                  <Ionicons name="remove" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => webViewRef.current?.injectJavaScript(`map.locate({setView:true,maxZoom:13});true;`)}
                  style={[s.ctrlBtn, { backgroundColor: isDark ? 'rgba(13,17,23,0.88)' : 'rgba(255,255,255,0.92)', marginTop: 12 }]}
                >
                  <Ionicons name="navigate" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>

              {/* Hold hint */}
              <View style={s.hintPill} pointerEvents="none">
                <BlurView intensity={50} tint={blurTint as any} style={s.hintInner}>
                  <View style={s.hintDot} />
                  <Text style={[s.hintText, { color: colors.textMuted }]}>
                    Hold map to drop a pin
                  </Text>
                </BlurView>
              </View>

              {/* Bottom drawer */}
              <View style={[s.drawer, { paddingBottom: tabBarHeight + 8 }]}>
                <BlurView intensity={isDark ? 80 : 90} tint={blurTint as any} style={s.drawerBlur}>
                  <View style={s.drawerHandle} />

                  {savedLocations.length > 0 ? (
                    <>
                      <Text style={[s.drawerLabel, { color: colors.textMuted }]}>SAVED LOCATIONS</Text>
                      <FlatList
                        data={savedLocations}
                        keyExtractor={(i) => i.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={s.chipsRow}
                        renderItem={({ item }) => {
                          const w = locationWeather[item.id];
                          const isDef = defaultLocation?.id === item.id;
                          return (
                            <TouchableOpacity
                              onPress={() => flyTo(item)}
                              activeOpacity={0.75}
                              style={[s.chip, {
                                backgroundColor: isDef
                                  ? (isDark ? 'rgba(250,204,21,0.1)' : 'rgba(250,204,21,0.08)')
                                  : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                                borderColor: isDef ? 'rgba(250,204,21,0.35)' : colors.cardBorder,
                              }]}
                            >
                              <View style={s.chipTop}>
                                <Ionicons name="location" size={11} color={isDef ? '#FACC15' : '#818CF8'} />
                                <Text style={[s.chipCity, { color: colors.textPrimary }]} numberOfLines={1}>{item.city}</Text>
                              </View>
                              <Text style={[s.chipTemp, { color: colors.textMuted }]}>
                                {w ? `${Math.round(w.temp)}°` : '—'}
                              </Text>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </>
                  ) : (
                    <View style={s.drawerEmpty}>
                      <Ionicons name="hand-left-outline" size={16} color={colors.textMuted} />
                      <Text style={[s.drawerEmptyText, { color: colors.textMuted }]}>
                        Hold the map or search a city to add your first location
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => showToast({ type: 'info', message: 'Search above or hold the map to pin a spot' })}
                    style={s.addBtn}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#6366F1','#4F46E5']}
                      style={s.addBtnGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#fff" />
                      <Text style={s.addBtnText}>Add New City</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </BlurView>
              </View>

            </View>
          )}

          {/* ══ SAVED TAB ════════════════════════════════════════ */}
          {activeTab === 'Saved' && (
            <View style={s.flex}>
              {savedLocations.length === 0 ? (
                <EmptyState
                  icon="location-outline"
                  title="No Saved Locations"
                  message="Switch to Map, search a city or hold the map to pin a spot"
                  iconColor="#818CF8"
                />
              ) : (
                <FlatList
                  data={savedLocations}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: tabBarHeight + 20 }}
                  initialNumToRender={FLATLIST_INITIAL_NUM_TO_RENDER}
                  maxToRenderPerBatch={FLATLIST_MAX_TO_RENDER_PER_BATCH}
                  windowSize={FLATLIST_WINDOW_SIZE}
                  removeClippedSubviews
                  renderItem={({ item, index }) => (
                    <SavedCard
                      item={item}
                      index={index}
                      weather={locationWeather[item.id]}
                      isDefault={defaultLocation?.id === item.id}
                      isDark={isDark}
                      colors={colors}
                      onFlyTo={() => flyTo(item)}
                      onSetDefault={() => setDefaultLocation(defaultLocation?.id === item.id ? null : item.id)}
                      onDelete={() => handleDelete(item.id, item.city)}
                    />
                  )}
                />
              )}
            </View>
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
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, marginTop: 2, fontWeight: '500' },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.22)',
  },
  counterNum: { fontSize: 18, fontWeight: '800', color: '#818CF8' },
  counterDen: { fontSize: 12, fontWeight: '600', marginLeft: 1 },

  // Tabs
  tabRow: { paddingHorizontal: 16, marginBottom: 8 },
  tabTrack: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    height: 40,
    position: 'relative',
  },
  tabPill: { position: 'absolute', top: 2, bottom: 2, borderRadius: 10 },
  tabBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabLabel: { fontSize: 13, fontWeight: '600' },

  // WebView
  webview: { flex: 1, backgroundColor: 'transparent' },

  // Search overlay
  searchOverlay: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20 },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  goBtn:     { borderRadius: 12, overflow: 'hidden' },
  goBtnGrad: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  // Results
  resultsDropdown: {
    position: 'absolute',
    top: 70,
    left: 12,
    right: 12,
    zIndex: 19,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  resultDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#818CF8' },
  resultCity: { fontSize: 14, fontWeight: '600' },
  resultSub:  { fontSize: 12, marginTop: 1 },
  saveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.22)',
  },
  saveChipText: { fontSize: 12, fontWeight: '600', color: '#818CF8' },

  // Map controls
  mapControls: { position: 'absolute', right: 12, top: '28%', zIndex: 10, alignItems: 'center' },
  ctrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.12)',
  },

  // Hint
  hintPill: { position: 'absolute', bottom: SCREEN_H * 0.30, alignSelf: 'center', zIndex: 10 },
  hintInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  hintDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  hintText: { fontSize: 11, fontWeight: '500' },

  // Bottom drawer
  drawer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15 },
  drawerBlur: {
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.32)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  drawerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, paddingHorizontal: 16, marginBottom: 10 },
  drawerEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  drawerEmptyText: { fontSize: 13, flex: 1, lineHeight: 18 },

  chipsRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
    maxWidth: 136,
  },
  chipTop:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  chipCity: { fontSize: 13, fontWeight: '700', flex: 1 },
  chipTemp: { fontSize: 20, fontWeight: '300' },

  // Add button
  addBtn: { marginHorizontal: 14, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  addBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Saved tab cards
  savedCard: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
  },
  cardStripe: { width: 4 },
  cardBody:   { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  savedCity:    { fontSize: 16, fontWeight: '700' },
  savedCountry: { fontSize: 12, marginTop: 2 },
  savedTemp:    { fontSize: 30, fontWeight: '200', marginLeft: 8 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center' },
  defaultChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(250,204,21,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.28)',
  },
  defaultChipText: { fontSize: 9, fontWeight: '800', color: '#FACC15', letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
