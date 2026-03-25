/**
 * SPET Mobile App — Entry point.
 *
 * Startup flow:
 *   1. SplashScreen.preventAutoHideAsync() — splash stays visible
 *   2. SafeAreaProvider + ErrorBoundary mount
 *   3. ThemeProvider resolves stored preference
 *   4. AuthProvider checks SecureStore / refreshes token
 *   5. RootNavigator hides splash ONLY when auth resolves
 *   6. Navigation renders Login or Main — never blank
 */
import React from 'react';
import { View, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/hooks/useAuth';
import { VenueProvider } from './src/hooks/useVenue';
import { ErrorBoundary } from './src/components/ProductionUI';
import RootNavigator from './src/navigation/RootNavigator';

try {
  SplashScreen.preventAutoHideAsync();
} catch {}

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

function ThemedApp() {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <VenueProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
              <RootNavigator />
            </VenueProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
