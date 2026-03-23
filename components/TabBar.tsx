// ─── Custom Animated Tab Bar ─────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeatherTheme } from '../context/WeatherThemeContext';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';

// ─── Tab definitions ──────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabDef {
  name: string;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  color: string;
}

const TABS: TabDef[] = [
  { name: 'index',     label: 'Home',     icon: 'home-outline',          activeIcon: 'home',          color: '#818CF8' },
  { name: 'alerts',    label: 'Alerts',   icon: 'notifications-outline', activeIcon: 'notifications', color: '#F87171' },
  { name: 'locations', label: 'Places',   icon: 'location-outline',      activeIcon: 'location',      color: '#60A5FA' },
  { name: 'settings',  label: 'Settings', icon: 'settings-outline',      activeIcon: 'settings',      color: '#94A3B8' },
];

// ─── Individual Tab Item ──────────────────────────────────────────────────────
function TabItem({
  tab,
  isActive,
  onPress,
  onPressIn,
  onPressOut,
}: {
  tab: TabDef;
  isActive: boolean;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}) {
  const { isDark } = useTheme();
  const inactiveColor = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(15,23,42,0.32)';
  const inactiveLabelColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(15,23,42,0.28)';
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const iconColor  = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dotOpacity, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.spring(iconColor, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      }),
    ]).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.82, useNativeDriver: true, tension: 500, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 14 }),
    ]).start();
    onPress();
  };

  const animatedIconColor = iconColor.interpolate({
    inputRange:  [0, 1],
    outputRange: [inactiveColor, tab.color],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.tabItem}
      activeOpacity={1}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>

        {/* Active indicator dot */}
        <Animated.View
          style={[styles.dot, { backgroundColor: tab.color, opacity: dotOpacity }]}
        />

        {/* Icon */}
        <Animated.Text style={{ color: animatedIconColor }}>
          <Ionicons
            name={isActive ? tab.activeIcon : tab.icon}
            size={24}
            color={isActive ? tab.color : inactiveColor}
          />
        </Animated.Text>

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: isActive ? tab.color : inactiveLabelColor },
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Tab Bar ─────────────────────────────────────────────────────────────
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tabBarTint } = useWeatherTheme();
  const { colors } = useTheme();
  const { isPremium, setPremium } = useApp();
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRouteName = state.routes[state.index]?.name;

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  const startPremiumResetHold = (routeName: string) => {
    if (routeName !== 'settings' || !isPremium) return;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(async () => {
      await setPremium(false);
      Alert.alert('Premium Deactivated', 'Demo mode reset complete.');
      resetTimerRef.current = null;
    }, 10000);
  };

  const cancelPremiumResetHold = (routeName: string) => {
    if (routeName !== 'settings') return;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  if (activeRouteName === 'premium') {
    return null;
  }

  // On home screen use weather tint, on other screens use theme bg
  const isHome = state.index === 0;
  const fadeColor = isHome ? tabBarTint : colors.tabBarBg;

  const bottomPad = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: bottomPad }]}
    >
      {/* Gradient fade — transparent top → weather color bottom */}
      <LinearGradient
        colors={['transparent', fadeColor + 'CC', fadeColor]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Tab row — no background, floats over the gradient */}
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS[index];
          if (!tab) return null;
          const isActive = state.index === index;

          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              onPressIn={() => startPremiumResetHold(route.name)}
              onPressOut={() => cancelPremiumResetHold(route.name)}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // tall enough for gradient fade + tab row
    paddingTop: 40,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 6,
    // no background — sits over the gradient
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.1,
  },
});
