/**
 * SPET Mobile App — Entry point.
 * Production-ready: Error boundary, splash screen, providers.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/hooks/useAuth';
import { VenueProvider } from './src/hooks/useVenue';
import { ErrorBoundary } from './src/components/ProductionUI';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

// Keep splash visible while we check auth
SplashScreen.preventAutoHideAsync().catch(() => {});

// Suppress known warnings in production
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Small delay for a smoother transition from splash
    const t = setTimeout(() => setAppReady(true), 200);
    return () => clearTimeout(t);
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <AuthProvider>
          <VenueProvider>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <RootNavigator />
          </VenueProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
