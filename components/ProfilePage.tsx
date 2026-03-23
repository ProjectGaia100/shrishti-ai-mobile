import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useTabBarHeight } from '../context/TabBarHeightContext';
import { getSessionSafe, supabase } from '../utils/supabase';

export default function ProfilePage() {
  const OTP_COOLDOWN_SECONDS = 60;

  const { user, isPremium, updateProfileName } = useApp();
  const { colors, isDark } = useTheme();
  const { tabBarHeight } = useTabBarHeight();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [showOtpField, setShowOtpField] = useState(false);

  const currentEmail = useMemo(() => user?.email ?? '', [user?.email]);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const refreshEmailVerification = async () => {
    const session = await getSessionSafe();
    if (!session?.user) {
      setIsEmailVerified(null);
      return;
    }
    const { data } = await supabase.auth.getUser();
    setIsEmailVerified(Boolean(data.user?.email_confirmed_at));
  };

  useEffect(() => {
    refreshEmailVerification();
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) {
      if (showOtpField) {
        setShowOtpField(false);
        setOtp('');
      }
      return;
    }

    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpCooldown, showOtpField]);

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert('Invalid Name', 'Please enter a valid display name.');
      return;
    }
    setSavingName(true);
    const { error } = await updateProfileName(name);
    setSavingName(false);
    if (error) {
      Alert.alert('Update Failed', error);
      return;
    }
    Alert.alert('Saved', 'Your display name has been updated.');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password must match.');
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);

    if (error) {
      Alert.alert('Password Update Failed', error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password Updated', 'Your password has been changed successfully.');
  };

  const handleSendEmailOtp = async () => {
    if (!currentEmail) {
      Alert.alert('No Email', 'No email found on this account.');
      return;
    }

    setSendingOtp(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: currentEmail,
      options: { shouldCreateUser: false },
    });
    setSendingOtp(false);

    if (error) {
      Alert.alert('Send OTP Failed', error.message);
      return;
    }
    setShowOtpField(true);
    setOtpCooldown(OTP_COOLDOWN_SECONDS);
    Alert.alert('OTP Sent', 'A verification code has been sent to your email.');
  };

  const handleVerifyOtp = async () => {
    if (!currentEmail) {
      Alert.alert('No Email', 'No email found on this account.');
      return;
    }
    if (!otp.trim()) {
      Alert.alert('Missing OTP', 'Please enter the OTP sent to your email.');
      return;
    }

    setVerifyingOtp(true);
    const { error } = await supabase.auth.verifyOtp({
      email: currentEmail,
      token: otp.trim(),
      type: 'email',
    });
    setVerifyingOtp(false);

    if (error) {
      Alert.alert('Verification Failed', error.message);
      return;
    }

    setOtp('');
    setShowOtpField(false);
    setOtpCooldown(0);
    await refreshEmailVerification();
    Alert.alert('Email Verified', 'Your email has been verified successfully.');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom, colors.gradientTop] as any}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)' }]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        >
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(22,32,48,0.75)' : 'rgba(255,255,255,0.8)', borderColor: colors.cardBorder }]}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={34} color={isDark ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.55)'} />
              </View>
            )}

            <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email || 'user@email.com'}</Text>

            {isPremium && (
              <View style={styles.proBadge}>
                <MaterialCommunityIcons name="crown" size={11} color="#FACC15" />
                <Text style={styles.proBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>

          <View style={[styles.infoCard, { borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)' }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Profile Details</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: colors.cardBorder,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            ]}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveName} disabled={savingName} activeOpacity={0.85}>
            {savingName ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Save Name</Text>}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Change Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: colors.cardBorder,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            ]}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: colors.cardBorder,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            ]}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword} disabled={updatingPassword} activeOpacity={0.85}>
            {updatingPassword ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Email Verification (OTP)</Text>
          <Text style={[styles.infoLine, { color: colors.textSecondary }]}>Email: {currentEmail || 'Not available'}</Text>
          <Text style={[styles.infoLine, { color: isEmailVerified ? '#22C55E' : '#F59E0B' }]}>
            Status: {isEmailVerified ? 'Verified' : 'Not verified'}
          </Text>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSendEmailOtp}
            disabled={sendingOtp || otpCooldown > 0}
            activeOpacity={0.85}
          >
            {sendingOtp ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.secondaryBtnText}>
                {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Send OTP to Email'}
              </Text>
            )}
          </TouchableOpacity>

          {showOtpField && otpCooldown > 0 && (
            <>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.cardBorder,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  },
                ]}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} disabled={verifyingOtp} activeOpacity={0.85}>
                {verifyingOtp ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Verify Email</Text>}
              </TouchableOpacity>
            </>
          )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.35)',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.22)',
  },
  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  proBadge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(250,204,21,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.3)',
  },
  proBadgeText: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  infoCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  infoLine: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '700',
  },
});
