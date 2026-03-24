/**
 * SPET Mobile App — Entry point.
 * Wraps the app with Auth + Venue providers.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/hooks/useAuth';
import { VenueProvider } from './src/hooks/useVenue';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <VenueProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </VenueProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
