// ─── Premium Screen ──────────────────────────────────────────────────────────
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawer } from '../../context/DrawerContext';
import { Colors } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

const BENEFITS = [
  {
    icon: 'location',
    iconSet: 'ion' as const,
    title: 'Unlimited Locations',
    desc: 'Save unlimited cities and monitor weather everywhere',
    color: Colors.accentBlue,
  },
  {
    icon: 'analytics-outline',
    iconSet: 'ion' as const,
    title: 'Advanced Analytics',
    desc: 'Deep weather insights with historical data & trends',
    color: Colors.accentPurple,
  },
  {
    icon: 'trending-up',
    iconSet: 'feather' as const,
    title: 'Disaster Trend Forecasts',
    desc: 'AI-powered prediction models for severe weather events',
    color: Colors.accentOrange,
  },
  {
    icon: 'notifications-outline',
    iconSet: 'ion' as const,
    title: 'Priority Alerts',
    desc: 'Get notified first about critical weather changes',
    color: Colors.accentRed,
  },
  {
    icon: 'radar',
    iconSet: 'mci' as const,
    title: 'Radar Maps',
    desc: 'Live precipitation, satellite & wind maps',
    color: Colors.accentGreen,
  },
];

// ─── Glow Button Animation ──────────────────────────────────────────────────
function GlowButton({ onPress, label, isPro }: { onPress: () => void; label: string; isPro: boolean }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isPro) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [isPro]);

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={[styles.glowContainer, { shadowOpacity }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.ctaBtnWrap}>
        <LinearGradient
          colors={isPro ? ['#4ADE80', '#22C55E'] : ['#6366F1', '#8B5CF6', '#A78BFA']}
          style={styles.ctaBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isPro ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.ctaBtnText}>You're a Pro Member!</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="crown" size={20} color="#FACC15" />
              <Text style={styles.ctaBtnText}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PremiumScreen() {
  const { openDrawer } = useDrawer();
  const { isPremium, setPremium } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [dialogType, setDialogType] = useState<'none' | 'confirm' | 'activated' | 'already'>('none');
  const [subscribing, setSubscribing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const crownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(crownAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubscribe = () => {
    if (isPremium) {
      setDialogType('already');
      return;
    }
    setDialogType('confirm');
  };

  const confirmUpgrade = async () => {
    setSubscribing(true);
    await setPremium(true);
    setSubscribing(false);
    setDialogType('activated');
  };

  const planText = selectedPlan === 'yearly' ? 'Yearly (Rs 2499/yr)' : 'Monthly (Rs 399/mo)';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E1B4B', '#312E81', '#0F172A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.menuBtn}
            >
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Hero Section ──────────────────────────────────────── */}
            <View style={styles.heroSection}>
              <Animated.View
                style={[
                  styles.crownContainer,
                  {
                    transform: [
                      {
                        scale: crownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(250, 204, 21, 0.25)', 'rgba(139, 92, 246, 0.15)']}
                  style={styles.crownBg}
                >
                  <MaterialCommunityIcons name="crown" size={48} color="#FACC15" />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.heroTitle}>
                {isPremium ? 'Welcome, Pro!' : 'Upgrade to'}
              </Text>
              <Text style={styles.heroTitleBold}>Weather Pro</Text>
              <Text style={styles.heroSubtitle}>
                {isPremium
                  ? 'You have access to all premium features'
                  : 'Unlock the full power of weather intelligence'}
              </Text>
            </View>

            {/* ─── Benefits List ─────────────────────────────────────── */}
            <View style={styles.benefitsSection}>
              {BENEFITS.map((item, idx) => (
                <View key={idx} style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: `${item.color}15` }]}>
                    {item.iconSet === 'mci' ? (
                      <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                    ) : item.iconSet === 'feather' ? (
                      <Feather name={item.icon as any} size={20} color={item.color} />
                    ) : (
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    )}
                  </View>
                  <View style={styles.benefitInfo}>
                    <Text style={styles.benefitTitle}>{item.title}</Text>
                    <Text style={styles.benefitDesc}>{item.desc}</Text>
                  </View>
                  {isPremium && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.accentGreen} />
                  )}
                </View>
              ))}
            </View>

            {/* ─── Pricing Cards ─────────────────────────────────────── */}
            {!isPremium && (
              <View style={styles.pricingSection}>
                <Text style={styles.pricingTitle}>Choose Your Plan</Text>

                {/* Yearly Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === 'yearly' && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan('yearly')}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={15} tint="dark" style={styles.planCardInner}>
                    <View style={styles.planBestValue}>
                      <Text style={styles.planBestValueText}>BEST VALUE</Text>
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>Yearly</Text>
                      <Text style={styles.planPrice}>Rs 2499</Text>
                      <Text style={styles.planPeriod}>/year</Text>
                    </View>
                    <Text style={styles.planSavings}>Save 50% vs monthly</Text>
                    <View
                      style={[
                        styles.planRadio,
                        selectedPlan === 'yearly' && styles.planRadioActive,
                      ]}
                    >
                      {selectedPlan === 'yearly' && <View style={styles.planRadioDot} />}
                    </View>
                  </BlurView>
                </TouchableOpacity>

                {/* Monthly Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlan === 'monthly' && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={15} tint="dark" style={styles.planCardInner}>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>Monthly</Text>
                      <Text style={styles.planPrice}>Rs 399</Text>
                      <Text style={styles.planPeriod}>/month</Text>
                    </View>
                    <View
                      style={[
                        styles.planRadio,
                        selectedPlan === 'monthly' && styles.planRadioActive,
                      ]}
                    >
                      {selectedPlan === 'monthly' && <View style={styles.planRadioDot} />}
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </View>
            )}

            {/* ─── CTA Button ────────────────────────────────────────── */}
            <View style={styles.ctaSection}>
              <GlowButton
                onPress={handleSubscribe}
                label="Start 7-Day Free Trial"
                isPro={isPremium}
              />
              {!isPremium && (
                <Text style={styles.cancelText}>
                  Cancel anytime. No questions asked.
                </Text>
              )}
            </View>
          </ScrollView>

          <Modal visible={dialogType !== 'none'} transparent animationType="fade" onRequestClose={() => setDialogType('none')}>
            <Pressable style={styles.dialogBackdrop} onPress={() => !subscribing && setDialogType('none')}>
              <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
                <LinearGradient
                  colors={['rgba(30,41,59,0.98)', 'rgba(49,46,129,0.96)']}
                  style={styles.dialogCardInner}
                >
                  <View style={styles.dialogIconWrap}>
                    <Ionicons
                      name={dialogType === 'activated' ? 'checkmark-circle' : 'diamond-outline'}
                      size={24}
                      color={dialogType === 'activated' ? '#4ADE80' : '#A5B4FC'}
                    />
                  </View>

                  <Text style={styles.dialogTitle}>
                    {dialogType === 'confirm' && 'Confirm Upgrade'}
                    {dialogType === 'activated' && 'Premium Activated'}
                    {dialogType === 'already' && 'Already Premium'}
                  </Text>

                  <Text style={styles.dialogMessage}>
                    {dialogType === 'confirm' && `Subscribe to Weather Pro ${planText}?\n7-day free trial included.`}
                    {dialogType === 'activated' && 'You now have access to all premium features.'}
                    {dialogType === 'already' && 'You already have a Premium subscription.'}
                  </Text>

                  {dialogType === 'confirm' ? (
                    <View style={styles.dialogActionsRow}>
                      <TouchableOpacity
                        style={[styles.dialogBtn, styles.dialogBtnGhost]}
                        onPress={() => setDialogType('none')}
                        disabled={subscribing}
                      >
                        <Text style={styles.dialogBtnGhostText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.dialogBtn, styles.dialogBtnPrimary]}
                        onPress={confirmUpgrade}
                        disabled={subscribing}
                      >
                        <Text style={styles.dialogBtnPrimaryText}>{subscribing ? 'Subscribing...' : 'Subscribe'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.dialogBtn, styles.dialogBtnPrimary, styles.dialogSingleActionBtn, { alignSelf: 'stretch' }]}
                      onPress={() => setDialogType('none')}
                    >
                      <View style={styles.dialogBtnContent}>
                        <Ionicons name="checkmark-circle" size={16} color="#F8FAFF" />
                        <Text style={styles.dialogBtnPrimaryText}>Continue</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </Pressable>
            </Pressable>
          </Modal>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  crownContainer: {
    marginBottom: 20,
  },
  crownBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  heroTitleBold: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  // Benefits
  benefitsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  // Pricing
  pricingSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  planCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCardSelected: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  planCardInner: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planBestValue: {
    position: 'absolute',
    top: 0,
    right: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  planBestValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  planInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  planPeriod: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  planSavings: {
    fontSize: 11,
    color: Colors.accentGreen,
    fontWeight: '600',
    marginRight: 14,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioActive: {
    borderColor: '#6366F1',
  },
  planRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  // CTA
  ctaSection: {
    padding: 20,
    marginTop: 10,
  },
  glowContainer: {
    shadowColor: '#6366F1',
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  ctaBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.35)',
  },
  dialogCardInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dialogIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(129,140,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  dialogTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  dialogMessage: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    marginBottom: 14,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 12,
  },
  dialogBtnGhost: {
    backgroundColor: 'rgba(148,163,184,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  dialogBtnGhostText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
  },
  dialogBtnPrimary: {
    backgroundColor: '#6366F1',
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.5)',
    minHeight: 44,
  },
  dialogSingleActionBtn: {
    marginTop: 2,
    marginBottom: 4,
  },
  dialogBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 22,
    gap: 8,
  },
  dialogBtnPrimaryText: {
    color: '#F8FAFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
