// ─── Haptics Utility ─────────────────────────────────────────────────────────
// Wrapper for expo-haptics with fallback for unsupported platforms
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Light haptic feedback for subtle interactions (button taps, toggles)
 */
export function lightHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Silently fail if haptics not supported
    });
  }
}

/**
 * Medium haptic feedback for standard interactions (selections, confirmations)
 */
export function mediumHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
      // Silently fail if haptics not supported
    });
  }
}

/**
 * Heavy haptic feedback for important interactions (errors, warnings)
 */
export function heavyHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {
      // Silently fail if haptics not supported
    });
  }
}

/**
 * Success haptic feedback (light, satisfying confirmation)
 */
export function successHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
      // Silently fail if haptics not supported
    });
  }
}

/**
 * Warning haptic feedback (medium, attention-grabbing)
 */
export function warningHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {
      // Silently fail if haptics not supported
    });
  }
}

/**
 * Error haptic feedback (heavy, distinct pattern)
 */
export function errorHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {
      // Silently fail if haptics not supported
    });
  }
}

/**
 * Selection change haptic feedback (light tap for selections)
 */
export function selectionHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    Haptics.selectionAsync().catch(() => {
      // Silently fail if haptics not supported
    });
  }
}
