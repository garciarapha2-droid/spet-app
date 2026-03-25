/**
 * Root Navigation — Auth stack + Main tab navigator with all modules.
 * 5 Bottom Tabs: Entry, Tabs, Tables, Kitchen, Modules
 * Plus stack navigators for each dashboard.
 */
import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useVenue } from '../hooks/useVenue';
import { colors, fontSize } from '../theme/colors';

// Auth + Venue
import LoginScreen from '../screens/auth/LoginScreen';
import VenueSelectScreen from '../screens/venue/VenueSelectScreen';

// Entry
import EntryHomeScreen from '../screens/entry/EntryHomeScreen';
import NfcScanScreen from '../screens/entry/NfcScanScreen';
import GuestSearchScreen from '../screens/entry/GuestSearchScreen';
import EntryDecisionScreen from '../screens/entry/EntryDecisionScreen';
import GuestIntakeScreen from '../screens/entry/GuestIntakeScreen';
import NfcRegisterScreen from '../screens/entry/NfcRegisterScreen';

// Pulse / Tabs
import PulseHomeScreen from '../screens/pulse/PulseHomeScreen';
import TabDetailScreen from '../screens/pulse/TabDetailScreen';
import AddItemScreen from '../screens/pulse/AddItemScreen';
import PulseInsideScreen from '../screens/pulse/PulseInsideScreen';
import PulseExitScreen from '../screens/pulse/PulseExitScreen';
import PulseBarScreen from '../screens/pulse/PulseBarScreen';
import PulseRewardsScreen from '../screens/pulse/PulseRewardsScreen';

// Tables
import TablesHomeScreen from '../screens/tables/TablesHomeScreen';
import TableDetailScreen from '../screens/tables/TableDetailScreen';

// Kitchen
import KitchenScreen from '../screens/kitchen/KitchenScreen';

// Modules Hub
import ModulesHomeScreen from '../screens/modules/ModulesHomeScreen';

// Dashboards
import ManagerDashboardScreen from '../screens/manager/ManagerDashboardScreen';
import CeoDashboardScreen from '../screens/ceo/CeoDashboardScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';

// Settings
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const EntryStack = createNativeStackNavigator();
const PulseStack = createNativeStackNavigator();
const TablesStack = createNativeStackNavigator();
const KitchenStack = createNativeStackNavigator();
const ModulesStack = createNativeStackNavigator();

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
      <PulseStack.Screen name="PulseInside" component={PulseInsideScreen} options={{ title: 'Inside' }} />
      <PulseStack.Screen name="PulseExit" component={PulseExitScreen} options={{ title: 'Exits' }} />
      <PulseStack.Screen name="PulseBar" component={PulseBarScreen} options={{ title: 'Bar' }} />
      <PulseStack.Screen name="PulseRewards" component={PulseRewardsScreen} options={{ title: 'Rewards' }} />
    </PulseStack.Navigator>
  );
}

// ─── Tables Stack ───
function TablesStackNavigator() {
  return (
    <TablesStack.Navigator screenOptions={screenOptions}>
      <TablesStack.Screen name="TablesHome" component={TablesHomeScreen} options={{ headerShown: false }} />
      <TablesStack.Screen name="TableDetail" component={TableDetailScreen} options={{ title: 'Table Detail' }} />
      <TablesStack.Screen name="AddItem" component={AddItemScreen} options={{ title: 'Add Item' }} />
    </TablesStack.Navigator>
  );
}

// ─── Kitchen Stack ───
function KitchenStackNavigator() {
  return (
    <KitchenStack.Navigator screenOptions={screenOptions}>
      <KitchenStack.Screen name="KitchenHome" component={KitchenScreen} options={{ headerShown: false }} />
    </KitchenStack.Navigator>
  );
}

// ─── Modules Stack (Dashboards + Settings) ───
function ModulesStackNavigator() {
  return (
    <ModulesStack.Navigator screenOptions={screenOptions}>
      <ModulesStack.Screen name="ModulesHome" component={ModulesHomeScreen} options={{ headerShown: false }} />
      <ModulesStack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} options={{ title: 'Manager' }} />
      <ModulesStack.Screen name="CeoDashboard" component={CeoDashboardScreen} options={{ title: 'CEO' }} />
      <ModulesStack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} options={{ title: 'Owner' }} />
      <ModulesStack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
    </ModulesStack.Navigator>
  );
}

// ─── Main Tabs ───
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Let safe-area-context handle bottom padding natively
          paddingTop: 6,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      })}
    >
      <Tab.Screen
        name="Entry"
        component={EntryStackNavigator}
        options={{
          tabBarLabel: 'Entry',
          tabBarIcon: ({ color, size }) => <Feather name="log-in" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Pulse"
        component={PulseStackNavigator}
        options={{
          tabBarLabel: 'Tabs',
          tabBarIcon: ({ color, size }) => <Feather name="credit-card" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="TablesStack"
        component={TablesStackNavigator}
        options={{
          tabBarLabel: 'Tables',
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="KitchenStack"
        component={KitchenStackNavigator}
        options={{
          tabBarLabel: 'Kitchen',
          tabBarIcon: ({ color, size }) => <Feather name="coffee" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Modules"
        component={ModulesStackNavigator}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color, size }) => <Feather name="menu" size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───
export default function RootNavigator() {
  const { authenticated, loading } = useAuth();
  const { selectedVenue, loadVenues } = useVenue();

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
