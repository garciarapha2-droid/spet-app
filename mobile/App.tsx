/**
 * SPET Mobile App — Entry point.
 *
 * Startup flow:
 *   1. SplashScreen.preventAutoHideAsync() — splash stays visible
 *   2. SafeAreaProvider + ErrorBoundary mount
 *   3. AuthProvider checks SecureStore / refreshes token
 *   4. RootNavigator hides splash ONLY when auth resolves
 *   5. Navigation renders Login or Main — never blank
 *
 * Crash prevention:
 *   - ErrorBoundary catches render errors
 *   - Global promise rejection handler prevents silent crashes
 *   - All native module access is guarded
 */
import React from 'react';
import { View, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/hooks/useAuth';
import { VenueProvider } from './src/hooks/useVenue';
import { ErrorBoundary } from './src/components/ProductionUI';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

// ─── Keep splash visible until auth resolves ────────────
try {
  SplashScreen.preventAutoHideAsync();
} catch {}

// ─── Suppress known RN warnings ─────────────────────────
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// ─── Global unhandled promise rejection safety net ──────
const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
if ((globalThis as any).ErrorUtils?.setGlobalHandler) {
  (globalThis as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
    console.log('[GLOBAL]', isFatal ? 'FATAL' : 'ERROR', error?.message || error);
    // Let the original handler decide what to do (RedBox in dev, crash report in prod)
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// ─── App root ───────────────────────────────────────────
export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <VenueProvider>
              <StatusBar style="light" translucent backgroundColor="transparent" />
              <RootNavigator />
            </VenueProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}
