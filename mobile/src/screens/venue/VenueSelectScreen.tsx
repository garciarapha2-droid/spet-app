/**
 * Venue Selection Screen — themed. Pick a venue after login.
 */
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { useVenue } from '../../hooks/useVenue';
import { SectionHeader } from '../../components/ui';

export default function VenueSelectScreen() {
  const { colors } = useTheme();
  const { venues, loading, loadVenues, selectVenue, selectedVenue } = useVenue();

  useEffect(() => { loadVenues(); }, [loadVenues]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xxl }}>
      <SectionHeader title="Select Venue" subtitle="Choose your active venue" />
      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md }}
        renderItem={({ item }) => {
          const isSelected = selectedVenue?.id === item.id;
          return (
            <TouchableOpacity
              onPress={() => selectVenue(item)}
              activeOpacity={0.7}
              style={{
                backgroundColor: isSelected ? colors.primaryBg : colors.card,
                borderRadius: radius.lg, padding: spacing.xl,
                borderWidth: 1, borderColor: isSelected ? colors.primary : colors.border,
                minHeight: 64, justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: isSelected ? colors.primary : colors.foreground }}>{item.name}</Text>
              {isSelected && <Text style={{ fontSize: fontSize.xs, color: colors.primaryLight, marginTop: spacing.xs }}>Active</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
