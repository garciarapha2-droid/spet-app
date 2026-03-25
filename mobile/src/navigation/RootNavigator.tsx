/**
 * Root Navigation — iPhone product scope.
 *
 * Bottom tabs: Entry | Tabs | Tables | More
 *
 * REMOVED from iPhone: Kitchen/KDS, Manager, CEO, Owner
 */
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../hooks/useAuth';
import { useVenue } from '../hooks/useVenue';
import { useTheme } from '../contexts/ThemeContext';

import LoginScreen from '../screens/auth/LoginScreen';
import VenueSelectScreen from '../screens/venue/VenueSelectScreen';

import EntryHomeScreen from '../screens/entry/EntryHomeScreen';
import NfcScanScreen from '../screens/entry/NfcScanScreen';
import GuestSearchScreen from '../screens/entry/GuestSearchScreen';
import EntryDecisionScreen from '../screens/entry/EntryDecisionScreen';
import GuestIntakeScreen from '../screens/entry/GuestIntakeScreen';
import NfcRegisterScreen from '../screens/entry/NfcRegisterScreen';

import TabsMainScreen from '../screens/tabs/TabsMainScreen';
import TabDetailScreen from '../screens/pulse/TabDetailScreen';
import AddItemScreen from '../screens/pulse/AddItemScreen';

import TablesHomeScreen from '../screens/tables/TablesHomeScreen';
import TableDetailScreen from '../screens/tables/TableDetailScreen';

import SettingsScreen from '../screens/settings/SettingsScreen';

import CustomTabBar from './CustomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EntryStack = createNativeStackNavigator();
const TabsStack = createNativeStackNavigator();
const TablesStackNav = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

function EntryStackNavigator() {
  const { colors } = useTheme();
  const opts = {
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <EntryStack.Navigator screenOptions={opts}>
      <EntryStack.Screen name="EntryHome" component={EntryHomeScreen} options={{ headerShown: false }} />
      <EntryStack.Screen name="NfcScan" component={NfcScanScreen} options={{ title: 'NFC Scan' }} />
      <EntryStack.Screen name="GuestSearch" component={GuestSearchScreen} options={{ title: 'Search Guest' }} />
      <EntryStack.Screen name="EntryDecision" component={EntryDecisionScreen} options={{ title: 'Entry Decision' }} />
      <EntryStack.Screen name="GuestIntake" component={GuestIntakeScreen} options={{ title: 'New Guest' }} />
      <EntryStack.Screen name="NfcRegister" component={NfcRegisterScreen} options={{ title: 'Register NFC' }} />
    </EntryStack.Navigator>
  );
}

function TabsStackNavigator() {
  const { colors } = useTheme();
  const opts = {
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <TabsStack.Navigator screenOptions={opts}>
      <TabsStack.Screen name="TabsMain" component={TabsMainScreen} options={{ headerShown: false }} />
      <TabsStack.Screen name="TabDetail" component={TabDetailScreen} options={{ title: 'Tab Detail' }} />
      <TabsStack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
    </TabsStack.Navigator>
  );
}

function TablesStackNavigator() {
  const { colors } = useTheme();
  const opts = {
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <TablesStackNav.Navigator screenOptions={opts}>
      <TablesStackNav.Screen name="TablesHome" component={TablesHomeScreen} options={{ headerShown: false }} />
      <TablesStackNav.Screen name="TableDetail" component={TableDetailScreen} options={{ title: 'Table Detail' }} />
      <TablesStackNav.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
    </TablesStackNav.Navigator>
  );
}

function MoreStackNavigator() {
  const { colors } = useTheme();
  const opts = {
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.foreground,
    headerTitleStyle: { fontWeight: '600' as const, fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <MoreStack.Navigator screenOptions={opts}>
      <MoreStack.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: false }} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Entry" component={EntryStackNavigator} />
      <Tab.Screen name="Tabs" component={TabsStackNavigator} />
      <Tab.Screen name="TablesStack" component={TablesStackNavigator} />
      <Tab.Screen name="More" component={MoreStackNavigator} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { authenticated, loading } = useAuth();
  const { selectedVenue, loadVenues } = useVenue();
  const { colors, isDark } = useTheme();
  const splashHidden = React.useRef(false);

  React.useEffect(() => {
    if (!loading && !splashHidden.current) {
      splashHidden.current = true;
      try { SplashScreen.hideAsync(); } catch {}
    }
  }, [loading, authenticated]);

  React.useEffect(() => {
    if (authenticated) {
      loadVenues().catch(() => {});
    }
  }, [authenticated, loadVenues]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium: { fontFamily: 'System', fontWeight: '500' as const },
      bold: { fontFamily: 'System', fontWeight: '700' as const },
      heavy: { fontFamily: 'System', fontWeight: '800' as const },
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !selectedVenue ? (
          <Stack.Screen name="VenueSelect" component={VenueSelectScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
