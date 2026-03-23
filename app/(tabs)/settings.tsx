// ─── Settings Screen ─────────────────────────────────────────────────────────
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { selectionHaptic } from '../../utils/haptics';

// ─── Toggle Row Component ────────────────────────────────────────────────────
function SettingRow({
  icon,
  iconColor = Colors.textSecondary,
  label,
  value,
  type = 'toggle',
  options,
  onToggle,
  onSelect,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  label: string;
  value?: boolean | string;
  type?: 'toggle' | 'select';
  options?: { label: string; value: string }[];
  onToggle?: (val: boolean) => void;
  onSelect?: (val: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const segBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const switchTrackFalse = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const switchIosBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIconBg, { backgroundColor: `${iconColor}22` }]}>
        {icon}
      </View>
      <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>

      {type === 'toggle' && onToggle && (
        <Switch
          value={value as boolean}
          onValueChange={(val) => {
            selectionHaptic();
            onToggle(val);
          }}
          trackColor={{ false: switchTrackFalse, true: 'rgba(99, 102, 241, 0.4)' }}
          thumbColor={value ? '#6366F1' : '#94A3B8'}
          ios_backgroundColor={switchIosBg}
        />
      )}

      {type === 'select' && options && onSelect && (
        <View style={[styles.segmentContainer, { backgroundColor: segBg }]}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.segmentBtn,
                value === opt.value && styles.segmentBtnActive,
              ]}
              onPress={() => {
                selectionHaptic();
                onSelect(opt.value);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.textMuted },
                  value === opt.value && { color: colors.textPrimary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{title}</Text>;
}

export default function SettingsScreen() {
  const { user, settings, updateSettings, logout, isPremium, isLoggedIn } = useApp();
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const blurTint = isDark ? 'dark' : 'light' as any;
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const cardBorder = colors.cardBorder;
  const avatarIconColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom, colors.gradientTop] as any}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 44 }} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Account Section ───────────────────────────────────── */}
            <SectionHeader title="ACCOUNT" />
            <View style={[styles.cardWrapper, { borderColor: cardBorder }]}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
              >
                <BlurView intensity={15} tint={blurTint} style={styles.profileCard}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
                  ) : (
                    <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={28} color={avatarIconColor} />
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                    <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user?.email || 'user@email.com'}</Text>
                    {isPremium && (
                      <View style={styles.proBadge}>
                        <MaterialCommunityIcons name="crown" size={10} color="#FACC15" />
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* ─── Premium ───────────────────────────────────────────── */}
            {!isPremium && (
              <>
                <SectionHeader title="PREMIUM" />
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/premium')}
                  style={styles.premiumBtn}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['rgba(99,102,241,0.24)', 'rgba(139,92,246,0.14)']}
                    style={styles.premiumBtnInner}
                  >
                    <View style={styles.premiumIconWrap}>
                      <MaterialCommunityIcons name="crown" size={18} color="#FACC15" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>Unlock Premium Access</Text>
                      <Text style={[styles.premiumSub, { color: colors.textMuted }]}>Unlimited places, priority alerts, and advanced insights</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* ─── Units & Metrics ───────────────────────────────────── */}
            <SectionHeader title="UNITS & METRICS" />
            <View style={[styles.cardWrapper, { borderColor: cardBorder }]}>
              <BlurView intensity={15} tint={blurTint} style={styles.settingsCard}>
                <SettingRow
                  icon={<Feather name="thermometer" size={18} color={Colors.accentRed} />}
                  iconColor={Colors.accentRed}
                  label="Temperature"
                  value={settings.tempUnit}
                  type="select"
                  options={[
                    { label: '°C', value: 'C' },
                    { label: '°F', value: 'F' },
                  ]}
                  onSelect={(val) => updateSettings({ tempUnit: val as 'C' | 'F' })}
                />

                <View style={[styles.settingDivider, { backgroundColor: dividerColor }]} />

                <SettingRow
                  icon={<Feather name="wind" size={18} color={Colors.accentBlue} />}
                  iconColor={Colors.accentBlue}
                  label="Wind Speed"
                  value={settings.windUnit}
                  type="select"
                  options={[
                    { label: 'km/h', value: 'kmh' },
                    { label: 'mph', value: 'mph' },
                  ]}
                  onSelect={(val) => updateSettings({ windUnit: val as 'kmh' | 'mph' })}
                />

                <View style={[styles.settingDivider, { backgroundColor: dividerColor }]} />

                <SettingRow
                  icon={
                    <MaterialCommunityIcons
                      name="gauge"
                      size={18}
                      color={Colors.accentGreen}
                    />
                  }
                  iconColor={Colors.accentGreen}
                  label="Pressure"
                  value={settings.pressureUnit}
                  type="select"
                  options={[
                    { label: 'hPa', value: 'hPa' },
                    { label: 'mb', value: 'mb' },
                  ]}
                  onSelect={(val) => updateSettings({ pressureUnit: val as 'hPa' | 'mb' })}
                />
              </BlurView>
            </View>

            {/* ─── App Preferences ───────────────────────────────────── */}
            <SectionHeader title="APP PREFERENCES" />
            <View style={[styles.cardWrapper, { borderColor: cardBorder }]}>
              <BlurView intensity={15} tint={blurTint} style={styles.settingsCard}>
                <SettingRow
                  icon={<Ionicons name="moon-outline" size={18} color={Colors.accentPurple} />}
                  iconColor={Colors.accentPurple}
                  label="Dark Mode"
                  value={settings.darkMode}
                  type="toggle"
                  onToggle={(val) => updateSettings({ darkMode: val })}
                />

                <View style={[styles.settingDivider, { backgroundColor: dividerColor }]} />

                <SettingRow
                  icon={
                    <Ionicons
                      name="notifications-outline"
                      size={18}
                      color={Colors.accentOrange}
                    />
                  }
                  iconColor={Colors.accentOrange}
                  label="Notifications"
                  value={settings.notifications}
                  type="toggle"
                  onToggle={(val) => updateSettings({ notifications: val })}
                />
              </BlurView>
            </View>

            {/* ─── About ─────────────────────────────────────────────── */}
            <SectionHeader title="ABOUT" />
            <View style={[styles.cardWrapper, { borderColor: cardBorder }]}>
              <BlurView intensity={15} tint={blurTint} style={styles.settingsCard}>
                <View style={styles.aboutRow}>
                  <Text style={[styles.aboutLabel, { color: colors.textPrimary }]}>Version</Text>
                  <Text style={[styles.aboutValue, { color: colors.textMuted }]}>1.0.0</Text>
                </View>
                <View style={[styles.settingDivider, { backgroundColor: dividerColor }]} />
                <View style={styles.aboutRow}>
                  <Text style={[styles.aboutLabel, { color: colors.textPrimary }]}>Build</Text>
                  <Text style={[styles.aboutValue, { color: colors.textMuted }]}>2026.02.14</Text>
                </View>
                <View style={[styles.settingDivider, { backgroundColor: dividerColor }]} />
                <View style={styles.aboutRow}>
                  <Text style={[styles.aboutLabel, { color: colors.textPrimary }]}>API</Text>
                  <Text style={[styles.aboutValue, { color: colors.textMuted }]}>OpenWeather</Text>
                </View>
              </BlurView>
            </View>

            {/* ─── Logout Button ─────────────────────────────────────── */}
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutBtn}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.logoutBtnInner,
                  { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)' },
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.accentRed} />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  // Section Header
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  // Card Wrapper
  cardWrapper: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FACC15',
    letterSpacing: 1,
  },
  // Settings Card
  settingsCard: {
    padding: 4,
  },
  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  settingIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  // Segment
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  premiumBtn: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.24)',
  },
  premiumBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  premiumIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250,204,21,0.15)',
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  premiumSub: {
    fontSize: 12,
    marginTop: 2,
  },
  // About
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 14,
  },
  // Logout
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentRed,
  },
});
