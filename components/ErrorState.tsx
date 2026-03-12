// ─── Error State Component ──────────────────────────────────────────────────
// Reusable error state with icons, message, and actions
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { spacing, fontSize, fontWeight, iconSize, radius, shadows } from '../constants/DesignTokens';

type ErrorType = 'network' | 'api' | 'permission' | 'notFound' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  primaryAction?: {
    label: string;
    onPress: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

const ERROR_CONFIGS: Record<ErrorType, { icon: keyof typeof Ionicons.glyphMap; title: string; color: string }> = {
  network: {
    icon: 'cloud-offline-outline',
    title: "You're Offline",
    color: Colors.accentBlue,
  },
  api: {
    icon: 'alert-circle-outline',
    title: 'Something Went Wrong',
    color: Colors.accentRed,
  },
  permission: {
    icon: 'location-outline',
    title: 'Location Access Needed',
    color: Colors.accentOrange,
  },
  notFound: {
    icon: 'search-outline',
    title: 'Not Found',
    color: Colors.accentPurple,
  },
  generic: {
    icon: 'warning-outline',
    title: 'Oops!',
    color: Colors.accentYellow,
  },
};

export default function ErrorState({
  type = 'generic',
  title,
  message,
  icon,
  primaryAction,
  secondaryAction,
}: ErrorStateProps) {
  const config = ERROR_CONFIGS[type];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
        <Ionicons name={displayIcon} size={iconSize['4xl']} color={config.color} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{displayTitle}</Text>

      {/* Message */}
      {message && <Text style={styles.message}>{message}</Text>}

      {/* Actions */}
      {primaryAction && (
        <TouchableOpacity
          style={[styles.primaryButton, primaryAction.loading && styles.buttonDisabled]}
          onPress={primaryAction.onPress}
          disabled={primaryAction.loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={primaryAction.label}
        >
          {primaryAction.loading ? (
            <Text style={styles.primaryButtonText}>Loading...</Text>
          ) : (
            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
          )}
        </TouchableOpacity>
      )}

      {secondaryAction && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={secondaryAction.onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={secondaryAction.label}
        >
          <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.5,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    minWidth: 200,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.base,
  },
  primaryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.base,
  },
  secondaryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: Colors.accentBlue,
  },
});
