/**
 * Top Navbar — shared across all main screens.
 * Logo | Page title | Theme toggle
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize } from '../theme/themes';

interface TopNavbarProps {
  title: string;
  rightContent?: React.ReactNode;
}

export default function TopNavbar({ title, rightContent }: TopNavbarProps) {
  const { colors, isDark, setThemeMode, mode } = useTheme();
  const insets = useSafeAreaInsets();

  const toggleTheme = () => {
    if (mode === 'dark') setThemeMode('light');
    else if (mode === 'light') setThemeMode('dark');
    else setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: spacing.lg,
        height: insets.top + 56,
        backgroundColor: colors.cardTranslucent,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '80',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      data-testid="top-navbar"
    >
      <Text
        style={{
          fontSize: fontSize.sm,
          fontWeight: '700',
          color: colors.mutedForeground,
          letterSpacing: 1,
        }}
      >
        spet.
      </Text>

      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: '600',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {rightContent}
        <TouchableOpacity
          onPress={toggleTheme}
          activeOpacity={0.7}
          data-testid="theme-toggle"
          style={{
            padding: 8,
            borderRadius: 10,
          }}
        >
          <Feather
            name={isDark ? 'sun' : 'moon'}
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
