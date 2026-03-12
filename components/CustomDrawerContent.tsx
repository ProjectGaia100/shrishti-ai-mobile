// ─── Custom Drawer Content ───────────────────────────────────────────────────
// Pure-RN implementation – no @react-navigation/drawer dependency
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useApp } from '../context/AppContext';
import { useDrawer } from '../context/DrawerContext';
import { lightHaptic } from '../utils/haptics';

interface MenuItem {
  label: string;
  icon: string;
  iconSet: 'ion' | 'mci';
  route: string;
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Home', icon: 'home', iconSet: 'ion', route: '/(drawer)' },
  { label: 'Add Locations', icon: 'location', iconSet: 'ion', route: '/(drawer)/locations' },
  { label: 'Alerts', icon: 'warning', iconSet: 'ion', route: '/(drawer)/alerts', badge: '3' },
  { label: 'Premium', icon: 'crown', iconSet: 'mci', route: '/(drawer)/premium' },
  { label: 'Settings', icon: 'settings-sharp', iconSet: 'ion', route: '/(drawer)/settings' },
];

export default function CustomDrawerContent() {
  const { user, isPremium, logout } = useApp();
  const { closeDrawer } = useDrawer();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handleNavigate = (route: string) => {
    lightHaptic();
    closeDrawer();
    // Navigate after a small delay to allow drawer to close smoothly
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    router.push('/login');
  };

  const isActive = (route: string) => {
    // Exact match for home route
    if (route === '/(drawer)') {
      return pathname === '/' || pathname === '/(drawer)';
    }
    // Extract route name without the drawer prefix
    const routeName = route.replace('/(drawer)/', '').replace('/(drawer)', '');
    // Check if pathname ends with or exactly matches the route name
    return pathname === route || pathname.endsWith(`/${routeName}`) || pathname === `/${routeName}`;
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#0F172A']}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={{ flex: 1 }}>
        {/* ─── Profile Header ──────────────────────────────────────────── */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.15)']}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={36} color="rgba(255,255,255,0.7)" />
                </View>
              )}
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <MaterialCommunityIcons name="crown" size={10} color="#FACC15" />
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user?.name || 'Weather User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            {isPremium && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* ─── Menu Items ──────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={styles.menuContainer}
          showsVerticalScrollIndicator={false}
        >
          {MENU_ITEMS.map((item, index) => {
            const active = isActive(item.route);
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconBg, active && styles.menuIconBgActive]}>
                  {item.iconSet === 'mci' ? (
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={active ? '#fff' : Colors.textSecondary}
                    />
                  ) : (
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={active ? '#fff' : Colors.textSecondary}
                    />
                  )}
                </View>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.accentRed} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.version}>WeatherWise v1.0.0</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  profileGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    backgroundColor: '#312E81',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  proBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FACC15',
    letterSpacing: 2,
  },
  menuContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIconBgActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.35)',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  menuLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.accentRed,
  },
  version: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
