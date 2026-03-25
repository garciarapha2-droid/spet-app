/**
 * Pulse Exit — Production-ready. Shows today's exits.
 */
import React from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { ErrorState, EmptyState, SkeletonList, useAsyncData } from '../../components/ProductionUI';
import { api } from '../../services/api';

export default function PulseExitScreen() {
  const { venueId } = useVenue();
  const { data, loading, error, refresh } = useAsyncData(
    () => api.get(`/pulse/exits/today?venue_id=${venueId}`),
    [venueId],
  );

  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const exits = data?.exits || data || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {loading ? (
        <SkeletonList count={5} />
      ) : exits.length === 0 ? (
        <EmptyState icon="log-out" title="No Exits Today" message="Exit records will appear here throughout the day." />
      ) : (
        <FlatList
          data={exits}
          keyExtractor={(item, i) => item.id || String(i)}
          contentContainerStyle={{ padding: spacing.xxl }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={{ marginBottom: spacing.xxl }}>
              <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                {exits.length} exits today
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="log-out" size={16} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{item.guest_name || 'Guest'}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                  {item.exited_at ? new Date(item.exited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
