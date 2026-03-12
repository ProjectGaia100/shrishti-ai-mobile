// ─── SettingsContent ─────────────────────────────────────────────────────────
// Shared settings UI used by both (tabs)/settings.tsx and (drawer)/settings.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';
import { selectionHaptic, successHaptic, errorHaptic } from '../utils/haptics';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  /** Renders a left-side menu/hamburger button instead of the back affordance */
  showMenuButton?: boolean;
  onMenuPress?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ title, colors }: { title: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{title}</Text>
  );
}

function Card({ children, colors }: { children: React.ReactNode; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

function SettingRow({
  icon,
  accentColor,
  label,
  subtitle,
  right,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  accentColor: string;
  label: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBg, { backgroundColor: accentColor + '20' }]}>
        {icon}
      </View>
      <View style={styles.settingMid}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </Wrapper>
  );
}

function SegmentControl({
  options,
  value,
  onChange,
  colors,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.segment, { backgroundColor: colors.inputBg }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={() => { selectionHaptic(); onChange(opt.value); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.segmentText, { color: active ? '#fff' : colors.textMuted }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SettingsContent({ showMenuButton, onMenuPress }: Props) {
  const { user, settings, updateSettings, logout, isPremium } = useApp();
  const { isDark, colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Profile expand / edit state
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Change password state
  const [pwExpanded, setPwExpanded] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // Keep editName in sync if user changes after load (e.g. after a Supabase reload)
  useEffect(() => {
    setEditName(user?.name ?? '');
  }, [user?.name]);

  // ─── Initials avatar ────────────────────────────────────────────────────
  const initials = (user?.name ?? user?.email ?? 'U')
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  // ─── Save name ──────────────────────────────────────────────────────────
  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed) { setNameError('Name cannot be empty'); return; }
    setNameError('');
    setSavingName(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not logged in');
      const { error } = await supabase
        .from('profiles')
        .update({ name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
      if (error) throw error;
      // Also update local user state via storage — AppContext will pick it up next load
      const { StorageService } = await import('../services/storage');
      if (user) await StorageService.setAuth({ ...user, name: trimmed });
      successHaptic();
      setProfileExpanded(false);
    } catch (e: any) {
      errorHaptic();
      setNameError(e.message ?? 'Failed to save name');
    } finally {
      setSavingName(false);
    }
  }, [editName, user]);

  // ─── Save password ───────────────────────────────────────────────────────
  const handleSavePassword = useCallback(async () => {
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    setPwError('');
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      successHaptic();
      setNewPassword('');
      setConfirmPassword('');
      setPwExpanded(false);
    } catch (e: any) {
      errorHaptic();
      setPwError(e.message ?? 'Failed to update password');
    } finally {
      setSavingPw(false);
    }
  }, [newPassword, confirmPassword]);

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
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
  }, [logout]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#E2E8F0', '#F1F5F9', '#E2E8F0']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

          {/* ─── Header ──────────────────────────────────────────────── */}
          <View style={styles.header}>
            {showMenuButton && onMenuPress ? (
              <TouchableOpacity onPress={onMenuPress} style={[styles.headerBtn, { backgroundColor: colors.card }]}>
                <Ionicons name="menu" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >

            {/* ─── Account ─────────────────────────────────────────── */}
            <SectionLabel title="ACCOUNT" colors={colors} />
            <Card colors={colors}>
              {/* Profile row */}
              <TouchableOpacity
                style={styles.profileRow}
                activeOpacity={0.75}
                onPress={() => { selectionHaptic(); setProfileExpanded((v) => !v); }}
              >
                {/* Initials avatar */}
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>

                <View style={styles.profileMid}>
                  <View style={styles.profileNameRow}>
                    <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                      {user?.name || 'User'}
                    </Text>
                    {isPremium && (
                      <View style={styles.proBadge}>
                        <MaterialCommunityIcons name="crown" size={9} color="#FACC15" />
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                    {user?.email || ''}
                  </Text>
                </View>

                <Animated.View style={{
                  transform: [{
                    rotate: profileExpanded ? '90deg' : '0deg',
                  }],
                }}>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Animated.View>
              </TouchableOpacity>

              {/* Inline edit name */}
              {profileExpanded && (
                <View style={[styles.expandSection, { borderTopColor: colors.divider }]}>
                  <Text style={[styles.expandLabel, { color: colors.textMuted }]}>Display Name</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
                    <Ionicons name="person-outline" size={16} color={colors.textMuted} style={{ marginLeft: 12 }} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      value={editName}
                      onChangeText={(t) => { setEditName(t); setNameError(''); }}
                      placeholder="Your name"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                  {nameError ? (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.accentRed} />
                      <Text style={[styles.errorText, { color: colors.accentRed }]}>{nameError}</Text>
                    </View>
                  ) : null}
                  <View style={styles.expandBtns}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                      onPress={() => { setProfileExpanded(false); setNameError(''); setEditName(user?.name ?? ''); }}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSaveName}
                      disabled={savingName}
                    >
                      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {savingName
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.saveBtnText}>Save</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Card>

            {/* ─── Units & Metrics ─────────────────────────────────── */}
            <SectionLabel title="UNITS & METRICS" colors={colors} />
            <Card colors={colors}>
              <SettingRow
                colors={colors}
                accentColor={colors.accentRed}
                icon={<Feather name="thermometer" size={17} color={colors.accentRed} />}
                label="Temperature"
                right={
                  <SegmentControl
                    colors={colors}
                    value={settings.tempUnit}
                    options={[{ label: '°C', value: 'C' }, { label: '°F', value: 'F' }]}
                    onChange={(v) => updateSettings({ tempUnit: v as 'C' | 'F' })}
                  />
                }
              />
              <Divider colors={colors} />
              <SettingRow
                colors={colors}
                accentColor={colors.accentBlue}
                icon={<Feather name="wind" size={17} color={colors.accentBlue} />}
                label="Wind Speed"
                right={
                  <SegmentControl
                    colors={colors}
                    value={settings.windUnit}
                    options={[{ label: 'km/h', value: 'kmh' }, { label: 'mph', value: 'mph' }]}
                    onChange={(v) => updateSettings({ windUnit: v as 'kmh' | 'mph' })}
                  />
                }
              />
              <Divider colors={colors} />
              <SettingRow
                colors={colors}
                accentColor={colors.accentGreen}
                icon={<MaterialCommunityIcons name="gauge" size={17} color={colors.accentGreen} />}
                label="Pressure"
                right={
                  <SegmentControl
                    colors={colors}
                    value={settings.pressureUnit}
                    options={[{ label: 'hPa', value: 'hPa' }, { label: 'mb', value: 'mb' }]}
                    onChange={(v) => updateSettings({ pressureUnit: v as 'hPa' | 'mb' })}
                  />
                }
              />
            </Card>

            {/* ─── App Preferences ─────────────────────────────────── */}
            <SectionLabel title="APP PREFERENCES" colors={colors} />
            <Card colors={colors}>
              <SettingRow
                colors={colors}
                accentColor={colors.accentPurple}
                icon={<Ionicons name={isDark ? 'moon' : 'sunny'} size={17} color={colors.accentPurple} />}
                label="Dark Mode"
                right={
                  <Switch
                    value={settings.darkMode}
                    onValueChange={(v) => { selectionHaptic(); updateSettings({ darkMode: v }); }}
                    trackColor={{ false: colors.inputBg, true: 'rgba(99,102,241,0.5)' }}
                    thumbColor={settings.darkMode ? '#6366F1' : (isDark ? '#94A3B8' : '#CBD5E1')}
                    ios_backgroundColor={colors.inputBg}
                  />
                }
              />
              <Divider colors={colors} />
              <SettingRow
                colors={colors}
                accentColor={colors.accentOrange}
                icon={<Ionicons name="notifications-outline" size={17} color={colors.accentOrange} />}
                label="Notifications"
                right={
                  <Switch
                    value={settings.notifications}
                    onValueChange={(v) => { selectionHaptic(); updateSettings({ notifications: v }); }}
                    trackColor={{ false: colors.inputBg, true: 'rgba(251,146,60,0.45)' }}
                    thumbColor={settings.notifications ? colors.accentOrange : (isDark ? '#94A3B8' : '#CBD5E1')}
                    ios_backgroundColor={colors.inputBg}
                  />
                }
              />
            </Card>

            {/* ─── Security ────────────────────────────────────────── */}
            <SectionLabel title="SECURITY" colors={colors} />
            <Card colors={colors}>
              <SettingRow
                colors={colors}
                accentColor={colors.accentBlue}
                icon={<Ionicons name="lock-closed-outline" size={17} color={colors.accentBlue} />}
                label="Change Password"
                subtitle={pwExpanded ? undefined : 'Update your account password'}
                onPress={() => { selectionHaptic(); setPwExpanded((v) => !v); setPwError(''); }}
                right={
                  <Ionicons
                    name={pwExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                  />
                }
              />

              {pwExpanded && (
                <View style={[styles.expandSection, { borderTopColor: colors.divider }]}>
                  {/* New password */}
                  <Text style={[styles.expandLabel, { color: colors.textMuted }]}>New Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
                    <Ionicons name="lock-closed-outline" size={15} color={colors.textMuted} style={{ marginLeft: 12 }} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      value={newPassword}
                      onChangeText={(t) => { setNewPassword(t); setPwError(''); }}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showNew}
                    />
                    <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm password */}
                  <Text style={[styles.expandLabel, { color: colors.textMuted, marginTop: 10 }]}>Confirm Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
                    <Ionicons name="lock-closed-outline" size={15} color={colors.textMuted} style={{ marginLeft: 12 }} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setPwError(''); }}
                      placeholder="Repeat password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirm}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {pwError ? (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={13} color={colors.accentRed} />
                      <Text style={[styles.errorText, { color: colors.accentRed }]}>{pwError}</Text>
                    </View>
                  ) : null}

                  <View style={styles.expandBtns}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                      onPress={() => { setPwExpanded(false); setNewPassword(''); setConfirmPassword(''); setPwError(''); }}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSavePassword}
                      disabled={savingPw}
                    >
                      <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {savingPw
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.saveBtnText}>Update</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Card>

            {/* ─── About ───────────────────────────────────────────── */}
            <SectionLabel title="ABOUT" colors={colors} />
            <Card colors={colors}>
              {[
                { label: 'Version', value: '1.0.0' },
                { label: 'Build', value: '2026.02.26' },
                { label: 'Weather API', value: 'OpenWeather' },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <View style={styles.aboutRow}>
                    <Text style={[styles.aboutLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.aboutValue, { color: colors.textMuted }]}>{item.value}</Text>
                  </View>
                  {i < arr.length - 1 && <Divider colors={colors} />}
                </React.Fragment>
              ))}
            </Card>

            {/* ─── Log Out ─────────────────────────────────────────── */}
            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.logoutBtn, { borderColor: colors.accentRed + '30' }]}
              activeOpacity={0.8}
            >
              <View style={[styles.logoutInner, { backgroundColor: colors.accentRed + '12' }]}>
                <Ionicons name="log-out-outline" size={19} color={colors.accentRed} />
                <Text style={[styles.logoutText, { color: colors.accentRed }]}>Log Out</Text>
              </View>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  inner: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingMid: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 1 },

  // Segment control
  segment: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    gap: 2,
  },
  segmentBtn: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: '#6366F1',
  },
  segmentText: { fontSize: 12, fontWeight: '600' },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileMid: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(250,204,21,0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#FACC15', letterSpacing: 0.8 },

  // Expand section (inline edit / change password)
  expandSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
    paddingTop: 14,
  },
  expandLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 11 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  errorText: { fontSize: 12, flex: 1 },
  expandBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // About
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  aboutLabel: { fontSize: 15, fontWeight: '500' },
  aboutValue: { fontSize: 14 },

  // Logout
  logoutBtn: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 24,
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
