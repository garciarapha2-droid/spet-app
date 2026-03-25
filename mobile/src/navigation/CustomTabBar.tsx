/**
 * Custom Bottom Tab Bar — matches Pulse Mobile spec.
 *
 * Features:
 *   - Semi-transparent card background
 *   - Active tab: primary color + subtle glow container
 *   - Top indicator line on active tab
 *   - Safe area bottom padding
 *   - Compact icon + label layout
 */
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TabConfig {
  name: string;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { name: 'Entry', label: 'Entry', icon: 'search' },
  { name: 'Tabs', label: 'Tabs', icon: 'credit-card' },
  { name: 'TablesStack', label: 'Tables', icon: 'grid' },
  { name: 'More', label: 'More', icon: 'more-horizontal' },
];

export default function CustomTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 8);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.cardTranslucent,
        borderTopWidth: 1,
        borderTopColor: colors.border + '60',
        paddingTop: 6,
        paddingBottom: safeBottom,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        {TABS.map((tab, index) => {
          const isActive = state.index === index;
          const color = isActive ? colors.primary : colors.mutedForeground;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              data-testid={`tab-${tab.label.toLowerCase()}`}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 56,
                paddingVertical: 2,
              }}
            >
              {isActive && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    width: 16,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: colors.primary,
                  }}
                />
              )}
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,
                  backgroundColor: isActive ? colors.primaryBg : 'transparent',
                }}
              >
                <Feather name={tab.icon as any} size={20} color={color} />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color,
                  marginTop: 1,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
