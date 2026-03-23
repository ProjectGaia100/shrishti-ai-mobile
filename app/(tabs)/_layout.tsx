// ─── Tab Layout ───────────────────────────────────────────────────────────────
import { Tabs } from 'expo-router';
import TabBar from '../../components/TabBar';
import { WeatherThemeProvider } from '../../context/WeatherThemeContext';
import { TabBarHeightProvider } from '../../context/TabBarHeightContext';

export default function TabLayout() {
  return (
    <TabBarHeightProvider>
      <WeatherThemeProvider>
        <Tabs
          tabBar={(props) => <TabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
          <Tabs.Screen name="locations" options={{ title: 'Places' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
          <Tabs.Screen name="premium" options={{ href: null }} />
          <Tabs.Screen name="profile" options={{ href: null }} />
        </Tabs>
      </WeatherThemeProvider>
    </TabBarHeightProvider>
  );
}
