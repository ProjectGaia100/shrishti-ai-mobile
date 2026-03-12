// ─── Login / Signup Screen ────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const { login, signup, isLoggedIn } = useApp();
  const [mode, setMode] = useState<Mode>('login');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup-only field
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const tabSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [isLoggedIn]);

  // Animate tab indicator
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setError('');
    setMode(next);
    Animated.spring(tabSlide, {
      toValue: next === 'login' ? 0 : 1,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await login(email.trim(), password);
        if (err) {
          setError(err);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        const { error: err } = await signup(email.trim(), password, name.trim());
        if (err) {
          setError(err);
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabIndicatorLeft = tabSlide.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F172A', '#1E1B4B', '#312E81', '#0F172A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#A78BFA']}
                style={styles.logoBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="weather-partly-cloudy" size={40} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>WeatherWise</Text>
            <Text style={styles.subtitle}>Your premium weather companion</Text>

            {/* Card */}
            <View style={styles.cardWrapper}>
              <View style={styles.card}>
                {/* Tab switcher */}
                <View style={styles.tabBar}>
                  <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
                  <TouchableOpacity
                    style={styles.tab}
                    onPress={() => switchMode('login')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tab}
                    onPress={() => switchMode('signup')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.fields}>
                  {/* Name (signup only) */}
                  {mode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Full name"
                        placeholderTextColor={Colors.textMuted}
                        value={name}
                        onChangeText={(t) => { setName(t); setError(''); }}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  )}

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor={Colors.textMuted}
                      value={email}
                      onChangeText={(t) => { setEmail(t); setError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputIcon}>
                      <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={Colors.textMuted}
                      value={password}
                      onChangeText={(t) => { setPassword(t); setError(''); }}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={Colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirm password (signup only) */}
                  {mode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor={Colors.textMuted}
                        value={confirmPassword}
                        onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                        secureTextEntry={!showConfirm}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirm(!showConfirm)}
                        style={styles.eyeBtn}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={Colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Error */}
                  {error ? (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={14} color={Colors.accentRed} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Submit button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={styles.submitBtnWrap}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={styles.submitBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                          </Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Switch mode link */}
                  <TouchableOpacity
                    onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    style={styles.switchRow}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchText}>
                      {mode === 'login'
                        ? "Don't have an account? "
                        : 'Already have an account? '}
                      <Text style={styles.switchLink}>
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  content: { alignItems: 'center', paddingHorizontal: 28 },

  // Decorative circles
  circle: { position: 'absolute', borderRadius: 999, opacity: 0.08 },
  circle1: { width: 300, height: 300, backgroundColor: '#6366F1', top: -50, right: -80 },
  circle2: { width: 200, height: 200, backgroundColor: '#8B5CF6', bottom: 100, left: -60 },
  circle3: { width: 150, height: 150, backgroundColor: '#A78BFA', bottom: -30, right: 30 },

  // Logo
  logoContainer: { marginBottom: 20 },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginBottom: 36 },

  // Card
  cardWrapper: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  card: { backgroundColor: 'rgba(255,255,255,0.07)' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 44,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    backgroundColor: 'rgba(99,102,241,0.35)',
    borderRadius: 9,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.textPrimary },

  // Fields area
  fields: { padding: 20 },

  // Input
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputIcon: { paddingLeft: 14, paddingRight: 4 },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  eyeBtn: { paddingRight: 14, paddingVertical: 14 },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  errorText: { color: Colors.accentRed, fontSize: 13, flex: 1 },

  // Submit button
  submitBtnWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 16, marginTop: 4 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Switch mode
  switchRow: { alignItems: 'center', paddingTop: 4 },
  switchText: { color: Colors.textMuted, fontSize: 13 },
  switchLink: { color: '#A78BFA', fontWeight: '600' },
});
