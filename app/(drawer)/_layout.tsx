// ─── Drawer Layout ───────────────────────────────────────────────────────────
// Custom animated drawer – no native worklets / @react-navigation/drawer needed
import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  Pressable,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Slot, Redirect } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { DrawerProvider, useDrawer } from '../../context/DrawerContext';
import CustomDrawerContent from '../../components/CustomDrawerContent';

const DRAWER_WIDTH = 300;
const OVERLAY_COLOR = 'rgba(0,0,0,0.6)';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Animated overlay that slides the drawer from the left ────────────────── */
function DrawerOverlay() {
  const { isOpen, closeDrawer, openDrawer } = useDrawer();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  // Swipe-to-close pan responder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -60) closeDrawer();
      },
    }),
  ).current;

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: isOpen ? 100 : -1 }]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* dim backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: OVERLAY_COLOR, opacity: overlayAnim },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      {/* drawer panel */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawerPanel,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <CustomDrawerContent />
      </Animated.View>
    </View>
  );
}

/* ── Swipe-from-edge to open ──────────────────────────────────────────────── */
function EdgeSwipeDetector() {
  const { openDrawer, isOpen } = useDrawer();
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.pageX < 30,
      onMoveShouldSetPanResponder: (e, g) =>
        e.nativeEvent.pageX < 50 && g.dx > 15,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 60) openDrawer();
      },
    }),
  ).current;

  if (isOpen) return null;

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.edgeStrip}
      pointerEvents="box-none"
    />
  );
}

/* ── Layout ───────────────────────────────────────────────────────────────── */
export default function DrawerLayout() {
  const { isLoggedIn, isLoading } = useApp();

  if (!isLoading && !isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <DrawerProvider>
      <View style={styles.root}>
        <Slot />
        <EdgeSwipeDetector />
        <DrawerOverlay />
      </View>
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0F172A',
  },
  edgeStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
  },
});
