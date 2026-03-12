// ─── Empty State Component ──────────────────────────────────────────────────
// Reusable empty state with icons, message, and optional action
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { spacing, fontSize, fontWeight, iconSize, radius, shadows } from '../constants/DesignTokens';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  iconColor?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  message,
  iconColor = Colors.accentBlue,
  action,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon} size={iconSize['5xl']} color={iconColor} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      {message && <Text style={styles.message}>{message}</Text>}

      {/* Action Button */}
      {action && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: iconColor }]}
          onPress={action.onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.actionButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
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
    maxWidth: 300,
  },
  actionButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    minWidth: 180,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.base,
  },
  actionButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
});
