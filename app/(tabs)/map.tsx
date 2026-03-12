// ─── Map + Shristi AI Chat ────────────────────────────────────────────────────
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useTabBarHeight } from '../../context/TabBarHeightContext';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Leaflet map HTML (theme-aware) ──────────────────────────────────────────
function buildMapHTML(dark: boolean): string {
  const bg = dark ? '#0F172A' : '#E2E8F0';
  const tiles = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body,#map { width:100%; height:100%; background:${bg}; }
  .leaflet-control-zoom { display:none; }
  .leaflet-control-attribution { display:none; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    center: [-3.4653, -62.2159],
    zoom: 6,
    zoomControl: false,
    attributionControl: false,
  });
  L.tileLayer('${tiles}', {
    maxZoom: 19,
    detectRetina: true,
  }).addTo(map);
  var marker = null;
  map.on('click', function(e) {
    if (marker) map.removeLayer(marker);
    marker = L.circleMarker(e.latlng, {
      radius: 8, color: '#6366F1', fillColor: '#818CF8',
      fillOpacity: 0.9, weight: 2,
    }).addTo(map);
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'tap', lat: e.latlng.lat, lng: e.latlng.lng })
    );
  });
</script>
</body>
</html>`;
}

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Analyze flood risk for this area',
  'Show NDVI trend last 12 months',
  'Is there a cyclone warning near me?',
  'Soil moisture levels in this sector',
];

// ─── Mock chat messages ───────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'bot',
    text: "Hi! I'm Shristi AI. Ask me about disaster risks, environmental trends, or tap anywhere on the map to analyze that area.",
  },
];

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, colors }: { msg: Message; colors: any }) {
  const isBot = msg.role === 'bot';
  return (
    <View style={[bbl.wrap, isBot ? bbl.wrapBot : bbl.wrapUser]}>
      {isBot && (
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={bbl.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={12} color="#fff" />
        </LinearGradient>
      )}
      <View
        style={[
          bbl.body,
          isBot
            ? { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }
            : { backgroundColor: '#6366F1' },
        ]}
      >
        <Text style={[bbl.text, { color: isBot ? colors.textPrimary : '#fff' }]}>
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { tabBarHeight } = useTabBarHeight();

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const PANEL_HEIGHT = SCREEN_H * 0.55;

  const toggleChat = useCallback(() => {
    const next = !chatOpen;
    setChatOpen(next);
    Animated.spring(chatAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 68,
      friction: 14,
    }).start();
  }, [chatOpen]);

  const sendMessage = useCallback(
    (text?: string) => {
      const t = (text ?? inputText).trim();
      if (!t) return;
      setInputText('');
      const userMsg: Message = { id: Date.now().toString(), role: 'user', text: t };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      setTimeout(() => {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: 'Our AI models are being trained on satellite & climate data. Full geospatial analysis coming soon!',
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }, 1300);
    },
    [inputText],
  );

  const panelTranslateY = chatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_HEIGHT + 20, 0],
  });
  const overlayOpacity = chatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });
  const fabOpacity = chatAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0],
  });
  const fabScale = chatAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: [1, 0.6],
  });
  const sliderOpacity = chatAnim.interpolate({
    inputRange: [0, 0.4],
    outputRange: [1, 0],
  });

  const panelBg = isDark ? '#1A1F35' : '#FFFFFF';
  const panelBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const glassCtrl = isDark ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.88)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const mapHtml = buildMapHTML(isDark);

  return (
    <View style={[s.root, { backgroundColor: isDark ? '#0F172A' : '#E2E8F0' }]}>
      <StatusBar style={colors.statusBar} />

      {/* Full-screen map */}
      <WebView
        key={isDark ? 'dark' : 'light'}
        source={{ html: mapHtml }}
        style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#0F172A' : '#E2E8F0' }]}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
      />

      {/* Dark overlay when chat open */}
      <Animated.View
        pointerEvents={chatOpen ? 'auto' : 'none'}
        style={[s.overlay, { opacity: overlayOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleChat} />
      </Animated.View>

      {/* Search bar */}
      <View style={[s.searchBar, { top: insets.top + 12, backgroundColor: glassCtrl, borderColor: glassBorder }]}>
        <Ionicons name="search" size={16} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'} />
        <Text style={[s.searchText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }]}>
          Search area or coordinates…
        </Text>
        <Ionicons name="mic-outline" size={16} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} />
      </View>

      {/* Right controls */}
      <View style={[s.controls, { right: 14, top: insets.top + 70 }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[s.ctrlBtn, { backgroundColor: glassCtrl, borderColor: glassBorder }]}
        >
          <MaterialCommunityIcons name="layers-outline" size={18} color={isDark ? '#C7D2FE' : '#4F46E5'} />
          <Text style={[s.ctrlLabel, { color: isDark ? '#C7D2FE' : '#4F46E5' }]}>LAYERS</Text>
        </TouchableOpacity>

        <View style={[s.zoomGroup, { borderColor: glassBorder }]}>
          <TouchableOpacity style={[s.zoomBtn, { backgroundColor: glassCtrl }]} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={isDark ? '#E2E8F0' : '#1E293B'} />
          </TouchableOpacity>
          <View style={[s.zoomDivider, { backgroundColor: glassBorder }]} />
          <TouchableOpacity style={[s.zoomBtn, { backgroundColor: glassCtrl }]} activeOpacity={0.8}>
            <Ionicons name="remove" size={20} color={isDark ? '#E2E8F0' : '#1E293B'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[s.ctrlBtn, { backgroundColor: glassCtrl, borderColor: glassBorder }]}
        >
          <Ionicons name="locate" size={18} color={isDark ? '#E2E8F0' : '#1E293B'} />
        </TouchableOpacity>
      </View>

      {/* Bottom bar: FAB + time slider */}
      <Animated.View
        pointerEvents={chatOpen ? 'none' : 'auto'}
        style={[s.bottomBar, { bottom: tabBarHeight + 14, opacity: sliderOpacity }]}
      >
        <Animated.View style={{ opacity: fabOpacity, transform: [{ scale: fabScale }] }}>
          <TouchableOpacity onPress={toggleChat} activeOpacity={0.85}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={s.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="sparkles" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={[s.sliderPill, { backgroundColor: glassCtrl, borderColor: glassBorder }]}>
          <Ionicons name="play" size={11} color="#818CF8" style={{ marginRight: 2 }} />
          <Text style={[s.sliderLabel, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }]}>JAN 23</Text>
          <View style={s.sliderTrack}>
            <View style={s.sliderFill} />
            <View style={s.sliderThumb} />
          </View>
          <Text style={[s.sliderLabel, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)' }]}>JAN 24</Text>
        </View>
      </Animated.View>

      {/* Chat panel */}
      <Animated.View
        pointerEvents={chatOpen ? 'auto' : 'none'}
        style={[
          s.panel,
          {
            bottom: tabBarHeight,
            height: PANEL_HEIGHT,
            backgroundColor: panelBg,
            borderTopColor: panelBorder,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
      >
        <View style={s.handleWrap}>
          <View style={[s.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
        </View>

        <View style={[s.panelHeader, { borderBottomColor: panelBorder }]}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={s.panelAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={14} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[s.panelTitle, { color: colors.textPrimary }]}>Shristi AI</Text>
            <Text style={[s.panelSub, { color: colors.textMuted }]}>Geospatial intelligence assistant</Text>
          </View>
          <TouchableOpacity onPress={toggleChat} style={s.closeBtn}>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} colors={colors} />
          ))}
          {isTyping && (
            <View style={[bbl.wrap, bbl.wrapBot]}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={bbl.avatar}>
                <Ionicons name="sparkles" size={12} color="#fff" />
              </LinearGradient>
              <View style={[bbl.body, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                <Text style={[bbl.text, { color: colors.textMuted }]}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
            {SUGGESTIONS.map((sugg, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => sendMessage(sugg)}
                style={[s.chip, { backgroundColor: inputBg, borderColor: panelBorder }]}
                activeOpacity={0.75}
              >
                <Text style={[s.chipText, { color: colors.textSecondary }]}>{sugg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.inputBar, { borderTopColor: panelBorder, backgroundColor: panelBg }]}>
            <TouchableOpacity style={s.attachBtn}>
              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={[s.textInput, { backgroundColor: inputBg, color: colors.textPrimary }]}
              placeholder="Ask Shristi AI to analyze this area…"
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!inputText.trim()}
              style={[s.sendBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={s.sendBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="arrow-up" size={17} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Chat bubble stylesheet ───────────────────────────────────────────────────
const bbl = StyleSheet.create({
  wrap: { flexDirection: 'row', marginBottom: 10, maxWidth: '85%' },
  wrapBot: { alignSelf: 'flex-start', alignItems: 'flex-end' },
  wrapUser: { alignSelf: 'flex-end' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
    flexShrink: 0,
  },
  body: { borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  text: { fontSize: 14, lineHeight: 20 },
});

// ─── Screen stylesheet ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F172A' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },

  searchBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchText: { flex: 1, fontSize: 14 },

  controls: { position: 'absolute', alignItems: 'center', gap: 10 },
  ctrlBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  ctrlLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  zoomGroup: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  zoomBtn: { width: 52, height: 44, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 1 },

  bottomBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  sliderPill: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 6,
  },
  sliderTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6366F1',
  },
  sliderThumb: {
    position: 'absolute',
    left: '60%',
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#818CF8',
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  sliderLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 18,
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 38, height: 4, borderRadius: 2 },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  panelAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: { fontSize: 15, fontWeight: '700' },
  panelSub: { fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 4 },

  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 10 },

  chipsRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  attachBtn: { padding: 4 },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sendBtn: {},
  sendBtnGrad: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
