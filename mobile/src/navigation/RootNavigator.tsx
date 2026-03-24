/**
 * Root Navigation — Auth stack + Main tab navigator.
 */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { useVenue } from '../hooks/useVenue';
import { colors, fontSize } from '../theme/colors';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import VenueSelectScreen from '../screens/venue/VenueSelectScreen';
import EntryHomeScreen from '../screens/entry/EntryHomeScreen';
import NfcScanScreen from '../screens/entry/NfcScanScreen';
import GuestSearchScreen from '../screens/entry/GuestSearchScreen';
import EntryDecisionScreen from '../screens/entry/EntryDecisionScreen';
import GuestIntakeScreen from '../screens/entry/GuestIntakeScreen';
import NfcRegisterScreen from '../screens/entry/NfcRegisterScreen';
import PulseHomeScreen from '../screens/pulse/PulseHomeScreen';
import TabDetailScreen from '../screens/pulse/TabDetailScreen';
import AddItemScreen from '../screens/pulse/AddItemScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EntryStack = createNativeStackNavigator();
const PulseStack = createNativeStackNavigator();

const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgCard,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const, fontSize: fontSize.lg },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

// ─── Entry Stack ───

function EntryStackNavigator() {
  return (
    <EntryStack.Navigator screenOptions={screenOptions}>
      <EntryStack.Screen name="EntryHome" component={EntryHomeScreen} options={{ headerShown: false }} />
      <EntryStack.Screen name="NfcScan" component={NfcScanScreen} options={{ title: 'NFC Scan' }} />
      <EntryStack.Screen name="GuestSearch" component={GuestSearchScreen} options={{ title: 'Search Guest' }} />
      <EntryStack.Screen name="EntryDecision" component={EntryDecisionScreen} options={{ title: 'Entry Decision' }} />
      <EntryStack.Screen name="GuestIntake" component={GuestIntakeScreen} options={{ title: 'New Guest' }} />
      <EntryStack.Screen name="NfcRegister" component={NfcRegisterScreen} options={{ title: 'Register NFC' }} />
    </EntryStack.Navigator>
  );
}

// ─── Pulse Stack ───

function PulseStackNavigator() {
  return (
    <PulseStack.Navigator screenOptions={screenOptions}>
      <PulseStack.Screen name="PulseHome" component={PulseHomeScreen} options={{ headerShown: false }} />
      <PulseStack.Screen name="TabDetail" component={TabDetailScreen} options={{ title: 'Tab Detail' }} />
      <PulseStack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
    </PulseStack.Navigator>
  );
}

// ─── Main Tabs ───

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 84,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Entry"
        component={EntryStackNavigator}
        options={{
          tabBarLabel: 'Entry',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: color }} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Pulse"
        component={PulseStackNavigator}
        options={{
          tabBarLabel: 'Tabs',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: color }} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="VenueTab"
        component={VenueSelectScreen}
        options={{
          tabBarLabel: 'Venue',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }] }} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───

export default function RootNavigator() {
  const { authenticated, loading } = useAuth();
  const { selectedVenue, loadVenues } = useVenue();

  // Auto-load venues when authenticated
  React.useEffect(() => {
    if (authenticated) {
      loadVenues();
    }
  }, [authenticated, loadVenues]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={darkTheme}>
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
