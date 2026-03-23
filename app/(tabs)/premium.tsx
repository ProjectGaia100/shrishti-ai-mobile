import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useApp } from '../../context/AppContext';

const BENEFITS = [
  {
    icon: 'location-outline' as const,
    iconSet: 'ion' as const,
    title: 'Unlimited Saved Places',
    desc: 'Save as many locations as you want (no 3-place limit).',
    color: Colors.accentBlue,
  },
  {
    icon: 'notifications-outline' as const,
    iconSet: 'ion' as const,
    title: 'Priority Disaster Alerts',
    desc: 'Get severe weather and hazard notifications first.',
    color: Colors.accentRed,
  },
  {
    icon: 'trending-up' as const,
    iconSet: 'feather' as const,
    title: 'Advanced Forecast Insights',
    desc: 'Extra trend and confidence insights for prediction models.',
    color: Colors.accentOrange,
  },
  {
    icon: 'radar' as const,
    iconSet: 'mci' as const,
    title: 'Enhanced Map Tools',
    desc: 'Better map controls and custom-location workflows.',
    color: Colors.accentGreen,
  },
];

export default function PremiumScreen() {
  const { isPremium, setPremium } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [dialogType, setDialogType] = useState<'none' | 'confirm' | 'activated' | 'already'>('none');
  const [subscribing, setSubscribing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
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

  const planText = selectedPlan === 'yearly' ? 'Yearly (Rs 2499/year)' : 'Monthly (Rs 399/month)';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E1B4B', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <LinearGradient colors={['rgba(250,204,21,0.28)', 'rgba(99,102,241,0.2)']} style={styles.crownWrap}>
                <MaterialCommunityIcons name="crown" size={44} color="#FACC15" />
              </LinearGradient>
              <Text style={styles.title}>{isPremium ? 'You are Premium' : 'Unlock Premium Access'}</Text>
              <Text style={styles.subtitle}>
                {isPremium
                  ? 'All premium capabilities are active on your account.'
                  : 'Upgrade to remove limits and unlock advanced disaster-weather features.'}
              </Text>
            </View>

            <View style={styles.benefitsCard}>
              <BlurView intensity={18} tint="dark" style={styles.benefitsInner}>
                {BENEFITS.map((item) => (
                  <View key={item.title} style={styles.benefitRow}>
                    <View style={[styles.iconBg, { backgroundColor: `${item.color}22` }]}>
                      {item.iconSet === 'mci' ? (
                        <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                      ) : item.iconSet === 'feather' ? (
                        <Feather name={item.icon as any} size={18} color={item.color} />
                      ) : (
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.benefitTitle}>{item.title}</Text>
                      <Text style={styles.benefitDesc}>{item.desc}</Text>
                    </View>
                    {isPremium ? <Ionicons name="checkmark-circle" size={18} color={Colors.accentGreen} /> : null}
                  </View>
                ))}
              </BlurView>
            </View>

            {!isPremium && (
              <View style={styles.planSection}>
                <Text style={styles.planHeading}>Choose Plan</Text>

                <TouchableOpacity
                  style={[styles.planBtn, selectedPlan === 'yearly' && styles.planBtnActive]}
                  onPress={() => setSelectedPlan('yearly')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.planName}>Yearly</Text>
                  <Text style={styles.planPrice}>Rs 2499/year</Text>
                  <Text style={styles.planHint}>Best value</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planBtn, selectedPlan === 'monthly' && styles.planBtnActive]}
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>Rs 399/month</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.85} style={styles.ctaWrap}>
              <LinearGradient
                colors={isPremium ? ['#22C55E', '#16A34A'] : ['#6366F1', '#8B5CF6']}
                style={styles.ctaBtn}
              >
                <Ionicons name={isPremium ? 'checkmark-circle' : 'rocket-outline'} size={18} color="#fff" />
                <Text style={styles.ctaText}>{isPremium ? 'Premium Active' : 'Start Premium Trial'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>

          <Modal visible={dialogType !== 'none'} transparent animationType="fade" onRequestClose={() => setDialogType('none')}>
            <Pressable style={styles.dialogBackdrop} onPress={() => !subscribing && setDialogType('none')}>
              <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
                <LinearGradient
                  colors={['rgba(30,41,59,0.98)', 'rgba(30,27,75,0.98)']}
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
                    {dialogType === 'confirm' && `Start ${planText} with a 7-day free trial?`}
                    {dialogType === 'activated' && 'You now have access to all premium features.'}
                    {dialogType === 'already' && 'You already have Premium access.'}
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
                        {subscribing ? (
                          <Text style={styles.dialogBtnPrimaryText}>Upgrading...</Text>
                        ) : (
                          <Text style={styles.dialogBtnPrimaryText}>Upgrade</Text>
                        )}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  hero: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  crownWrap: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 18,
  },
  benefitsCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  benefitsInner: { padding: 10 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  benefitDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  planSection: {
    marginTop: 18,
    gap: 10,
  },
  planHeading: {
    color: '#cbd5e1',
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  planBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(15,23,42,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  planBtnActive: {
    borderColor: 'rgba(129,140,248,0.75)',
    backgroundColor: 'rgba(99,102,241,0.18)',
  },
  planName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  planPrice: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 2,
  },
  planHint: {
    color: '#a5b4fc',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  ctaWrap: { marginTop: 20, borderRadius: 15, overflow: 'hidden' },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  dialogCard: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.35)',
  },
  dialogCardInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dialogIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(129,140,248,0.14)',
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