// ─── Toast Notification System ──────────────────────────────────────────────
// Context and component for displaying toast messages
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { spacing, fontSize, fontWeight, iconSize, radius, shadows, duration } from '../constants/DesignTokens';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TOAST_CONFIGS: Record<ToastType, ToastConfig> = {
  success: { icon: 'checkmark-circle', color: Colors.accentGreen },
  error: { icon: 'close-circle', color: Colors.accentRed },
  info: { icon: 'information-circle', color: Colors.accentBlue },
  warning: { icon: 'warning', color: Colors.accentOrange },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [translateY] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options);
    
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration.fast,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    const dismissDuration = options.duration || 3000;
    setTimeout(() => {
      hideToast();
    }, dismissDuration);
  }, [translateY, opacity]);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration.fast,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const config = toast ? TOAST_CONFIGS[toast.type || 'info'] : TOAST_CONFIGS.info;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: insets.top + spacing.sm,
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <BlurView intensity={Platform.OS === 'ios' ? 20 : 80} tint="dark" style={styles.toastBlur}>
            <View style={styles.toastContent}>
              <Ionicons name={config.icon} size={iconSize.md} color={config.color} />
              <Text style={styles.toastMessage} numberOfLines={2}>
                {toast.message}
              </Text>
              {toast.action && (
                <TouchableOpacity
                  onPress={() => {
                    toast.action?.onPress();
                    hideToast();
                  }}
                  activeOpacity={0.7}
                  style={styles.toastAction}
                  accessibilityRole="button"
                  accessibilityLabel={toast.action.label}
                >
                  <Text style={[styles.toastActionText, { color: config.color }]}>
                    {toast.action.label}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={hideToast}
                style={styles.toastClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
              >
                <Ionicons name="close" size={iconSize.sm} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 1000,
    ...shadows.lg,
  },
  toastBlur: {
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  toastMessage: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.textPrimary,
    lineHeight: fontSize.sm * 1.4,
  },
  toastAction: {
    paddingHorizontal: spacing.sm,
  },
  toastActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  toastClose: {
    padding: spacing.xs,
  },
});
