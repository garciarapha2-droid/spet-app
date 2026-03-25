/**
 * Theme Context — provides dark/light theming across the app.
 *
 * Behavior:
 *   1. Default: dark mode
 *   2. Reads stored preference from SecureStore on mount
 *   3. Falls back to system color scheme if preference is 'system'
 *   4. Persists manual overrides
 *   5. Components use useTheme().colors for all color values
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkTheme, lightTheme, type ThemeColors } from '../theme/themes';

const THEME_STORAGE_KEY = 'spet-theme';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkTheme,
  isDark: true,
  mode: 'dark',
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          setMode(stored);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme !== 'light';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const colors = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const value = useMemo(
    () => ({ colors, isDark, mode, setThemeMode }),
    [colors, isDark, mode, setThemeMode],
  );

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
